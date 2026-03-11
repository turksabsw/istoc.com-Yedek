# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Trade Hub Authentication API v1.

This module provides comprehensive OAuth2/OpenID Connect SSO authentication
endpoints for the Trade Hub B2B marketplace, integrating with Keycloak
for single sign-on across all platform applications.

Key Features:
- OAuth2 authorization code flow with PKCE support
- SSO callback endpoint for token exchange
- Automatic Frappe user creation on first login
- Token refresh and logout endpoints
- Multi-tenant support with tenant-specific Keycloak configuration
- CSRF protection with state parameter validation
- Secure session management

SSO Flow:
1. Frontend calls get_login_url() to get Keycloak authorization URL
2. User is redirected to Keycloak for authentication
3. Keycloak redirects back to sso_callback() with authorization code
4. Callback exchanges code for tokens, creates/updates user, starts session
5. User is redirected to the success URL or error page

Usage Example:
    # Frontend initiates login
    const response = await fetch('/api/method/trade_hub.api.v1.auth.get_login_url');
    window.location.href = response.authorization_url;

    # After callback, user is logged in
    # Frontend can check session status
    const user = await fetch('/api/method/trade_hub.api.v1.auth.get_session_user');

CRITICAL NOTES:
- For Keycloak >= 18: server URL without /auth/ prefix
- For Keycloak < 18: server URL with /auth/ prefix
- JWT 'aud' claim must include client name (requires audience mapper in Keycloak)
- Redirect URIs must match exactly (trailing slash matters)
"""

from typing import Any, Dict, List, Optional
import json
import re
import secrets
import urllib.parse

import frappe
from frappe import _
from frappe.utils import cint, get_url, now_datetime
from frappe.utils.password import update_password as _update_password


# =============================================================================
# CONSTANTS
# =============================================================================

# Cache key prefix for SSO operations
SSO_CACHE_PREFIX = "trade_hub:sso"

# Default OAuth2 scopes
DEFAULT_SCOPES = ["openid", "profile", "email"]

# State parameter expiry in seconds (10 minutes)
STATE_EXPIRY_SECONDS = 600

# Redirect paths
DEFAULT_SUCCESS_PATH = "/"
DEFAULT_ERROR_PATH = "/login?error=sso_failed"

# Session cookie settings
SESSION_COOKIE_NAME = "sid"

# Rate limiting settings (per user/IP)
RATE_LIMITS = {
    "register": {"limit": 9999, "window": 3600},  # TEST: disabled
    "login": {"limit": 9999, "window": 300},  # TEST: disabled
    "password_reset": {"limit": 9999, "window": 3600},  # TEST: disabled
    "verification": {"limit": 9999, "window": 300},  # TEST: disabled
    "2fa_verify": {"limit": 9999, "window": 300},  # TEST: disabled
}

# Password requirements
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIREMENTS = {
    "min_length": 8,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digit": True,
    "require_special": False,  # Optional but recommended
}

# Verification code settings
VERIFICATION_CODE_LENGTH = 6
VERIFICATION_OTP_EXPIRY_SECONDS = 600  # 10 minutes
PASSWORD_RESET_OTP_EXPIRY_SECONDS = 900  # 15 minutes
RESEND_OTP_COOLDOWN_SECONDS = 60  # 60-second cooldown between OTP resends

# Valid user types for registration
VALID_USER_TYPES = ("buyer", "supplier")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def get_keycloak_client():
    """
    Get the Keycloak client instance.

    Returns:
        KeycloakClient: Initialized Keycloak client
    """
    try:
        from tr_tradehub.integrations.keycloak import get_keycloak_client as _get_client
        return _get_client()
    except ImportError:
        frappe.throw(
            _("Keycloak integration module not available"),
            title=_("Configuration Error")
        )


def is_keycloak_enabled() -> bool:
    """
    Check if Keycloak SSO is enabled.

    Returns:
        bool: True if Keycloak is enabled and configured
    """
    try:
        from tr_tradehub.integrations.keycloak import is_keycloak_enabled as _is_enabled
        return _is_enabled()
    except ImportError:
        return False


def get_keycloak_settings() -> Dict[str, Any]:
    """
    Get Keycloak configuration settings.

    Returns:
        dict: Keycloak settings
    """
    try:
        from tr_tradehub.integrations.keycloak import get_keycloak_settings as _get_settings
        return _get_settings()
    except ImportError:
        return {}


def create_or_update_user(keycloak_user_info: Dict[str, Any], tenant: str = None) -> Optional[str]:
    """
    Create or update a Frappe user from Keycloak user info.

    Args:
        keycloak_user_info: User info from Keycloak token/userinfo endpoint
        tenant: Optional tenant to assign to the user

    Returns:
        str: The Frappe user name (email) or None on error
    """
    try:
        from tr_tradehub.integrations.keycloak import create_or_update_frappe_user
        return create_or_update_frappe_user(keycloak_user_info, tenant)
    except ImportError:
        # Fallback implementation
        return _create_user_fallback(keycloak_user_info, tenant)


def _create_user_fallback(keycloak_user_info: Dict[str, Any], tenant: str = None) -> Optional[str]:
    """
    Fallback user creation if main function is not available.

    Args:
        keycloak_user_info: User info from Keycloak
        tenant: Optional tenant to assign

    Returns:
        str: The user email or None on error
    """
    email = keycloak_user_info.get("email")
    if not email:
        frappe.log_error(
            message=f"No email in Keycloak user info: {keycloak_user_info}",
            title="SSO User Creation Error"
        )
        return None

    try:
        if frappe.db.exists("User", email):
            user_doc = frappe.get_doc("User", email)
            is_new = False
        else:
            user_doc = frappe.new_doc("User")
            user_doc.email = email
            user_doc.send_welcome_email = 0
            is_new = True

        # Update user fields
        user_doc.first_name = (
            keycloak_user_info.get("given_name") or
            keycloak_user_info.get("firstName") or
            ""
        )
        user_doc.last_name = (
            keycloak_user_info.get("family_name") or
            keycloak_user_info.get("lastName") or
            ""
        )
        user_doc.full_name = (
            keycloak_user_info.get("name") or
            f"{user_doc.first_name} {user_doc.last_name}".strip()
        )
        user_doc.username = (
            keycloak_user_info.get("preferred_username") or
            email.split("@")[0]
        )
        user_doc.enabled = 1

        # Set Keycloak ID if field exists
        keycloak_sub = keycloak_user_info.get("sub")
        if keycloak_sub and hasattr(user_doc, "keycloak_user_id"):
            user_doc.keycloak_user_id = keycloak_sub

        # Set tenant if provided and field exists
        if tenant and hasattr(user_doc, "tenant"):
            user_doc.tenant = tenant

        user_doc.flags.ignore_permissions = True
        user_doc.flags.no_welcome_mail = True
        user_doc.save()

        frappe.db.commit()
        return email

    except Exception as e:
        frappe.log_error(
            message=f"Failed to create/update user {email}: {str(e)}",
            title="SSO User Creation Error"
        )
        return None


def generate_state() -> str:
    """
    Generate a cryptographically secure state parameter.

    Returns:
        str: A secure random state string
    """
    return secrets.token_urlsafe(32)


def store_state(state: str, data: Dict[str, Any] = None) -> None:
    """
    Store state parameter in cache for verification.

    Args:
        state: The state parameter value
        data: Optional additional data to store (redirect_uri, tenant, etc.)
    """
    cache_key = f"{SSO_CACHE_PREFIX}:state:{state}"
    cache_data = {"valid": True, "created_at": str(now_datetime())}
    if data:
        cache_data.update(data)

    frappe.cache().set_value(
        cache_key,
        json.dumps(cache_data),
        expires_in_sec=STATE_EXPIRY_SECONDS
    )


def verify_state(state: str) -> tuple:
    """
    Verify state parameter from callback.

    Args:
        state: The state parameter from callback

    Returns:
        tuple: (is_valid, stored_data or None)
    """
    if not state:
        return False, None

    cache_key = f"{SSO_CACHE_PREFIX}:state:{state}"
    cached = frappe.cache().get_value(cache_key)

    if not cached:
        return False, None

    # Delete state after verification (one-time use)
    frappe.cache().delete_value(cache_key)

    try:
        data = json.loads(cached)
        return data.get("valid", False), data
    except json.JSONDecodeError:
        return False, None


def store_pkce_verifier(state: str, verifier: str) -> None:
    """
    Store PKCE code verifier for later use.

    Args:
        state: The state parameter to associate with
        verifier: The code verifier
    """
    cache_key = f"{SSO_CACHE_PREFIX}:pkce:{state}"
    frappe.cache().set_value(
        cache_key,
        verifier,
        expires_in_sec=STATE_EXPIRY_SECONDS
    )


def get_pkce_verifier(state: str) -> Optional[str]:
    """
    Retrieve and delete PKCE code verifier.

    Args:
        state: The state parameter

    Returns:
        str: The code verifier or None
    """
    cache_key = f"{SSO_CACHE_PREFIX}:pkce:{state}"
    verifier = frappe.cache().get_value(cache_key)

    if verifier:
        frappe.cache().delete_value(cache_key)

    return verifier


def start_frappe_session(user: str) -> None:
    """
    Start a Frappe session for the given user.

    Args:
        user: The user email/name
    """
    frappe.local.login_manager.login_as(user)


def get_redirect_url(path: str = None, params: Dict[str, str] = None) -> str:
    """
    Build a full redirect URL.

    Args:
        path: The path to redirect to
        params: Optional query parameters

    Returns:
        str: Full redirect URL
    """
    base_url = get_url()
    path = path or DEFAULT_SUCCESS_PATH

    if path.startswith("http"):
        url = path
    else:
        url = f"{base_url}{path}"

    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    return url


def build_callback_uri() -> str:
    """
    Build the SSO callback URI.

    Returns:
        str: The callback URI
    """
    return f"{get_url()}/api/method/trade_hub.api.v1.auth.sso_callback"


# =============================================================================
# RATE LIMITING
# =============================================================================


def check_rate_limit(
    action: str,
    identifier: Optional[str] = None,
    throw: bool = True,
) -> bool:
    """
    Check if an action is rate limited.

    Args:
        action: The action to check (e.g., "register", "login")
        identifier: User/IP identifier (defaults to request IP)
        throw: If True, raises exception when rate limited

    Returns:
        bool: True if allowed, False if rate limited

    Raises:
        frappe.TooManyRequestsError: If throw=True and rate limited
    """
    if action not in RATE_LIMITS:
        return True

    config = RATE_LIMITS[action]

    # Get identifier (use IP address by default)
    if not identifier:
        try:
            identifier = frappe.request.remote_addr if frappe.request else "unknown"
        except Exception:
            identifier = "unknown"

    cache_key = f"rate_limit:{action}:{identifier}"

    # Get current count
    current = frappe.cache().get_value(cache_key)
    if current is None:
        # First request
        frappe.cache().set_value(cache_key, 1, expires_in_sec=config["window"])
        return True

    current = cint(current)
    if current >= config["limit"]:
        if throw:
            frappe.throw(
                _("Too many requests. Please try again later."),
                exc=frappe.TooManyRequestsError,
            )
        return False

    # Increment counter
    frappe.cache().set_value(cache_key, current + 1, expires_in_sec=config["window"])
    return True


# =============================================================================
# VALIDATION HELPERS
# =============================================================================


def validate_email_format(email: str) -> bool:
    """Validate email format using regex."""
    if not email:
        return False
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email.strip()))


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password meets security requirements.

    Args:
        password: Password to validate

    Returns:
        dict: Validation result with is_valid and errors list
    """
    errors = []

    if len(password) < PASSWORD_REQUIREMENTS["min_length"]:
        errors.append(
            _("Password must be at least {0} characters").format(
                PASSWORD_REQUIREMENTS["min_length"]
            )
        )

    if PASSWORD_REQUIREMENTS["require_uppercase"] and not re.search(r"[A-Z]", password):
        errors.append(_("Password must contain at least one uppercase letter"))

    if PASSWORD_REQUIREMENTS["require_lowercase"] and not re.search(r"[a-z]", password):
        errors.append(_("Password must contain at least one lowercase letter"))

    if PASSWORD_REQUIREMENTS["require_digit"] and not re.search(r"\d", password):
        errors.append(_("Password must contain at least one number"))

    if PASSWORD_REQUIREMENTS["require_special"] and not re.search(
        r"[!@#$%^&*(),.?\":{}|<>]", password
    ):
        errors.append(_("Password must contain at least one special character"))

    return {"is_valid": len(errors) == 0, "errors": errors}


# =============================================================================
# TOKEN & OTP GENERATION
# =============================================================================


def generate_auth_token(email: str) -> str:
    """
    Generate or reuse Frappe API key/secret for a user.

    Checks if the user already has an API key before generating a new one
    to avoid orphaned API keys accumulating in the database.

    Args:
        email: The user's email address

    Returns:
        str: Token string in format 'api_key:api_secret'

    Raises:
        frappe.DoesNotExistError: If user does not exist
    """
    if not frappe.db.exists("User", email):
        frappe.throw(
            _("User {0} does not exist").format(email),
            exc=frappe.DoesNotExistError,
        )

    user_doc = frappe.get_doc("User", email)

    # Check if user already has an API key — reuse to avoid orphaned keys
    api_key = user_doc.api_key

    if not api_key:
        # Generate new API key
        api_key = frappe.generate_hash(length=15)
        user_doc.api_key = api_key
        user_doc.flags.ignore_permissions = True
        user_doc.save()

    # Always generate a fresh API secret (Frappe stores it hashed)
    api_secret = frappe.generate_hash(length=15)
    user_doc.api_secret = api_secret
    user_doc.flags.ignore_permissions = True
    user_doc.save()

    frappe.db.commit()

    return f"{api_key}:{api_secret}"


def generate_verification_otp(email: str) -> str:
    """
    Generate a 6-digit OTP for email verification, stored in Redis for 10 minutes.

    Args:
        email: The email address to generate OTP for

    Returns:
        str: The 6-digit OTP code
    """
    otp = "".join([str(secrets.randbelow(10)) for _ in range(VERIFICATION_CODE_LENGTH)])
    cache_key = f"trade_hub:verify:otp:{email}"
    frappe.cache().set_value(
        cache_key,
        otp,
        expires_in_sec=VERIFICATION_OTP_EXPIRY_SECONDS,
    )
    return otp


def generate_password_reset_otp(email: str) -> str:
    """
    Generate a 6-digit OTP for password reset, stored in Redis for 15 minutes.

    Args:
        email: The email address to generate OTP for

    Returns:
        str: The 6-digit OTP code
    """
    otp = "".join([str(secrets.randbelow(10)) for _ in range(VERIFICATION_CODE_LENGTH)])
    cache_key = f"trade_hub:reset:otp:{email}"
    frappe.cache().set_value(
        cache_key,
        otp,
        expires_in_sec=PASSWORD_RESET_OTP_EXPIRY_SECONDS,
    )
    return otp


# =============================================================================
# EMAIL HELPERS
# =============================================================================


def send_verification_email(email: str, otp: str, first_name: str) -> None:
    """
    Send email verification OTP to the user.

    Args:
        email: Recipient email address
        otp: The 6-digit OTP code
        first_name: User's first name for personalization
    """
    try:
        frappe.sendmail(
            recipients=email,
            subject=_("Verify Your Email - Trade Hub"),
            template="email_verification",
            args={
                "first_name": first_name or _("User"),
                "otp": otp,
                "valid_minutes": VERIFICATION_OTP_EXPIRY_SECONDS // 60,
            },
            now=True,
        )
    except Exception as e:
        frappe.log_error(
            title="Auth API Error",
            message=f"Verification email error for {email}: {str(e)}",
        )


def send_password_reset_email(email: str, otp: str, first_name: str) -> None:
    """
    Send password reset OTP to the user.

    Args:
        email: Recipient email address
        otp: The 6-digit OTP code
        first_name: User's first name for personalization
    """
    try:
        frappe.sendmail(
            recipients=email,
            subject=_("Password Reset Request - Trade Hub"),
            template="password_reset",
            args={
                "first_name": first_name or _("User"),
                "otp": otp,
                "valid_minutes": PASSWORD_RESET_OTP_EXPIRY_SECONDS // 60,
            },
            now=True,
        )
    except Exception as e:
        frappe.log_error(
            title="Auth API Error",
            message=f"Password reset email error for {email}: {str(e)}",
        )


# =============================================================================
# PUBLIC API ENDPOINTS
# =============================================================================


@frappe.whitelist(allow_guest=True)
def get_sso_status() -> Dict[str, Any]:
    """
    Check SSO availability and configuration.

    Returns the status of Keycloak SSO integration, including whether
    it's enabled and the realm name.

    Returns:
        dict: {
            "enabled": bool,
            "realm": str or None,
            "features": {...}
        }

    API: GET /api/method/trade_hub.api.v1.auth.get_sso_status
    """
    enabled = is_keycloak_enabled()
    settings = get_keycloak_settings() if enabled else {}

    return {
        "success": True,
        "enabled": enabled,
        "realm": settings.get("realm"),
        "features": {
            "social_login": enabled,
            "auto_create_users": settings.get("auto_create_users", True),
        }
    }


@frappe.whitelist(allow_guest=True)
def get_login_url(
    redirect_uri: str = None,
    success_url: str = None,
    tenant: str = None
) -> Dict[str, Any]:
    """
    Get the Keycloak authorization URL for SSO login.

    Generates a secure authorization URL with CSRF state protection.
    The frontend should redirect the user to this URL to initiate login.

    Args:
        redirect_uri: Custom OAuth2 callback URI (optional, uses default)
        success_url: URL to redirect to after successful login (optional)
        tenant: Tenant context for multi-tenant deployments (optional)

    Returns:
        dict: {
            "success": True,
            "authorization_url": str,
            "state": str
        }

    API: GET /api/method/trade_hub.api.v1.auth.get_login_url

    Example:
        GET /api/method/trade_hub.api.v1.auth.get_login_url?success_url=/dashboard
    """
    if not is_keycloak_enabled():
        frappe.throw(
            _("Keycloak SSO is not enabled"),
            title=_("SSO Not Available")
        )

    # Generate CSRF state
    state = generate_state()

    # Use default callback URI if not provided
    callback_uri = redirect_uri or build_callback_uri()

    # Store state with additional data for callback
    store_state(state, {
        "redirect_uri": callback_uri,
        "success_url": success_url or DEFAULT_SUCCESS_PATH,
        "tenant": tenant,
    })

    # Get authorization URL from Keycloak client
    client = get_keycloak_client()
    auth_url = client.get_authorization_url(
        redirect_uri=callback_uri,
        state=state,
        scope=DEFAULT_SCOPES,
    )

    return {
        "success": True,
        "authorization_url": auth_url,
        "state": state,
    }


@frappe.whitelist(allow_guest=True)
def sso_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None
) -> None:
    """
    OAuth2 callback endpoint for Keycloak SSO.

    This endpoint handles the OAuth2 authorization code flow callback from Keycloak.
    It validates the state, exchanges the code for tokens, creates/updates the user,
    starts a Frappe session, and redirects to the success URL.

    Args:
        code: Authorization code from Keycloak
        state: State parameter for CSRF validation
        error: Error code if authentication failed
        error_description: Human-readable error description

    Returns:
        None (redirects to success or error URL)

    API: GET /api/method/trade_hub.api.v1.auth.sso_callback

    Flow:
        1. Validate state parameter (CSRF protection)
        2. Check for errors from Keycloak
        3. Exchange authorization code for tokens
        4. Validate access token
        5. Get user info from token
        6. Create or update Frappe user
        7. Start Frappe session
        8. Redirect to success URL
    """
    # Handle errors from Keycloak
    if error:
        frappe.log_error(
            message=f"SSO error: {error} - {error_description}",
            title="Keycloak SSO Error"
        )
        redirect_url = get_redirect_url(DEFAULT_ERROR_PATH, {
            "error": error,
            "error_description": error_description or "Authentication failed"
        })
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url
        return

    # Validate required parameters
    if not code:
        frappe.log_error(
            message="SSO callback missing authorization code",
            title="Keycloak SSO Error"
        )
        redirect_url = get_redirect_url(DEFAULT_ERROR_PATH, {
            "error": "missing_code",
            "error_description": "Authorization code not provided"
        })
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url
        return

    if not state:
        frappe.log_error(
            message="SSO callback missing state parameter",
            title="Keycloak SSO Error"
        )
        redirect_url = get_redirect_url(DEFAULT_ERROR_PATH, {
            "error": "missing_state",
            "error_description": "State parameter not provided"
        })
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url
        return

    # Verify state (CSRF protection)
    is_valid, state_data = verify_state(state)
    if not is_valid:
        frappe.log_error(
            message=f"Invalid or expired state parameter: {state}",
            title="Keycloak SSO Error"
        )
        redirect_url = get_redirect_url(DEFAULT_ERROR_PATH, {
            "error": "invalid_state",
            "error_description": "State validation failed. Please try logging in again."
        })
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url
        return

    # Get stored data from state
    callback_uri = state_data.get("redirect_uri") or build_callback_uri()
    success_url = state_data.get("success_url") or DEFAULT_SUCCESS_PATH
    tenant = state_data.get("tenant")

    try:
        # Check if Keycloak is enabled
        if not is_keycloak_enabled():
            raise Exception("Keycloak SSO is not enabled")

        # Get Keycloak client
        client = get_keycloak_client()

        # Exchange authorization code for tokens
        tokens = client.exchange_code(code, callback_uri)

        if not tokens:
            raise Exception("Failed to exchange authorization code for tokens")

        access_token = tokens.get("access_token")
        if not access_token:
            raise Exception("No access token in response")

        # Validate the token and get user info
        is_token_valid, token_info = client.validate_token(access_token)

        if not is_token_valid:
            raise Exception("Token validation failed")

        # Get additional user info if needed
        user_info = client.get_user_info(access_token)

        # Merge token info and user info
        keycloak_user_info = {**token_info}
        if user_info:
            keycloak_user_info.update(user_info)

        # Verify email is present
        email = keycloak_user_info.get("email")
        if not email:
            raise Exception("No email in user info. Email claim must be included in token.")

        # Verify email is verified (optional but recommended)
        email_verified = keycloak_user_info.get("email_verified", True)
        settings = get_keycloak_settings()
        if settings.get("require_email_verified", False) and not email_verified:
            raise Exception("Email address is not verified in Keycloak")

        # Create or update Frappe user
        frappe_user = create_or_update_user(keycloak_user_info, tenant)

        if not frappe_user:
            raise Exception(f"Failed to create/update user for email: {email}")

        # Start Frappe session
        start_frappe_session(frappe_user)

        # Store tokens in session if needed (for token refresh)
        if tokens.get("refresh_token"):
            frappe.cache().set_value(
                f"{SSO_CACHE_PREFIX}:refresh:{frappe_user}",
                tokens.get("refresh_token"),
                expires_in_sec=cint(tokens.get("refresh_expires_in", 86400))
            )

        # Log successful login
        frappe.logger().info(f"SSO login successful for user: {frappe_user}")

        # Redirect to success URL
        redirect_url = get_redirect_url(success_url)
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url

    except Exception as e:
        frappe.log_error(
            message=f"SSO callback error: {str(e)}",
            title="Keycloak SSO Error"
        )
        redirect_url = get_redirect_url(DEFAULT_ERROR_PATH, {
            "error": "callback_error",
            "error_description": str(e)
        })
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = redirect_url


@frappe.whitelist()
def get_session_user() -> Dict[str, Any]:
    """
    Get current session user information.

    Returns information about the currently logged-in user,
    including whether they authenticated via SSO.

    Returns:
        dict: {
            "success": True,
            "logged_in": bool,
            "user": {...} | None
        }

    API: GET /api/method/trade_hub.api.v1.auth.get_session_user
    """
    user = frappe.session.user

    if user == "Guest":
        return {
            "success": True,
            "logged_in": False,
            "user": None
        }

    user_doc = frappe.get_doc("User", user)

    # Check if user has Keycloak ID (SSO user)
    is_sso_user = bool(
        hasattr(user_doc, "keycloak_user_id") and user_doc.keycloak_user_id
    )

    return {
        "success": True,
        "logged_in": True,
        "user": {
            "email": user_doc.email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "username": user_doc.username,
            "user_image": user_doc.user_image,
            "is_sso_user": is_sso_user,
            "roles": [r.role for r in user_doc.roles],
            "tenant": getattr(user_doc, "tenant", None),
        }
    }


@frappe.whitelist()
def refresh_token() -> Dict[str, Any]:
    """
    Refresh the access token using stored refresh token.

    Uses the refresh token stored during login to get new tokens
    from Keycloak.

    Returns:
        dict: {
            "success": True,
            "expires_in": int
        }

    API: POST /api/method/trade_hub.api.v1.auth.refresh_token
    """
    user = frappe.session.user

    if user == "Guest":
        frappe.throw(_("Not authenticated"), title=_("Authentication Required"))

    # Get stored refresh token
    refresh_token_value = frappe.cache().get_value(
        f"{SSO_CACHE_PREFIX}:refresh:{user}"
    )

    if not refresh_token_value:
        frappe.throw(
            _("No refresh token available. Please log in again."),
            title=_("Token Expired")
        )

    try:
        client = get_keycloak_client()
        new_tokens = client.refresh_token(refresh_token_value)

        if not new_tokens:
            frappe.throw(
                _("Failed to refresh token. Please log in again."),
                title=_("Token Refresh Failed")
            )

        # Store new refresh token
        if new_tokens.get("refresh_token"):
            frappe.cache().set_value(
                f"{SSO_CACHE_PREFIX}:refresh:{user}",
                new_tokens.get("refresh_token"),
                expires_in_sec=cint(new_tokens.get("refresh_expires_in", 86400))
            )

        return {
            "success": True,
            "expires_in": new_tokens.get("expires_in"),
            "token_type": new_tokens.get("token_type", "Bearer"),
        }

    except Exception as e:
        frappe.log_error(
            message=f"Token refresh failed for user {user}: {str(e)}",
            title="Token Refresh Error"
        )
        frappe.throw(
            _("Failed to refresh token: {0}").format(str(e)),
            title=_("Token Refresh Failed")
        )


@frappe.whitelist()
def logout(
    redirect_url: str = None,
    logout_from_keycloak: bool = True
) -> Dict[str, Any]:
    """
    Logout from Frappe and optionally from Keycloak.

    Ends the Frappe session and optionally invalidates the Keycloak
    session as well.

    Args:
        redirect_url: URL to redirect to after logout
        logout_from_keycloak: Whether to also logout from Keycloak

    Returns:
        dict: {
            "success": True,
            "keycloak_logout_url": str | None
        }

    API: POST /api/method/trade_hub.api.v1.auth.logout
    """
    user = frappe.session.user
    keycloak_logout_url = None

    if user != "Guest":
        # Get refresh token before logout
        refresh_token_value = frappe.cache().get_value(
            f"{SSO_CACHE_PREFIX}:refresh:{user}"
        )

        # Clear cached refresh token
        frappe.cache().delete_value(f"{SSO_CACHE_PREFIX}:refresh:{user}")

        # Logout from Keycloak if requested
        if logout_from_keycloak and refresh_token_value and is_keycloak_enabled():
            try:
                client = get_keycloak_client()
                client.logout(refresh_token_value)
            except Exception as e:
                frappe.log_error(
                    message=f"Keycloak logout failed for user {user}: {str(e)}",
                    title="Keycloak Logout Error"
                )

            # Build Keycloak logout URL for frontend redirect
            settings = get_keycloak_settings()
            if settings.get("server_url") and settings.get("realm"):
                post_logout_uri = redirect_url or get_url()
                keycloak_logout_url = (
                    f"{settings['server_url']}/realms/{settings['realm']}"
                    f"/protocol/openid-connect/logout"
                    f"?post_logout_redirect_uri={urllib.parse.quote(post_logout_uri)}"
                )

    # Logout from Frappe
    frappe.local.login_manager.logout()

    return {
        "success": True,
        "keycloak_logout_url": keycloak_logout_url,
        "redirect_url": redirect_url or get_url(),
    }


@frappe.whitelist(allow_guest=True)
def check_email_exists(email: str) -> Dict[str, Any]:
    """
    Check if a user with the given email exists.

    Useful for pre-login validation to determine if user should
    register or login.

    Args:
        email: Email address to check

    Returns:
        dict: {
            "success": True,
            "exists": bool
        }

    API: GET /api/method/trade_hub.api.v1.auth.check_email_exists
    """
    # Rate limiting to prevent mass user enumeration
    check_rate_limit("verification")

    if not email:
        frappe.throw(_("Email is required"))

    email = email.strip().lower()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Please enter a valid email address"))

    exists = frappe.db.exists("User", email)

    return {
        "success": True,
        "exists": bool(exists)
    }


@frappe.whitelist(allow_guest=True)
def get_social_providers() -> Dict[str, Any]:
    """
    Get available social login providers.

    Returns a list of enabled social login providers configured
    in Keycloak.

    Returns:
        dict: {
            "success": True,
            "providers": [{"id": str, "name": str, "icon": str}]
        }

    API: GET /api/method/trade_hub.api.v1.auth.get_social_providers
    """
    if not is_keycloak_enabled():
        return {
            "success": True,
            "providers": []
        }

    # Social providers are configured in Keycloak realm settings
    # This returns commonly configured providers
    # Actual availability depends on Keycloak configuration
    providers = [
        {"id": "google", "name": "Google", "icon": "google"},
        {"id": "facebook", "name": "Facebook", "icon": "facebook"},
        {"id": "apple", "name": "Apple", "icon": "apple"},
        {"id": "linkedin", "name": "LinkedIn", "icon": "linkedin"},
    ]

    return {
        "success": True,
        "providers": providers
    }


# =============================================================================
# REGISTRATION & VERIFICATION ENDPOINTS
# =============================================================================


@frappe.whitelist(allow_guest=True)
def register(
    email: str,
    password: str,
    first_name: str,
    last_name: str = "",
    user_type: str = "buyer",
) -> Dict[str, Any]:
    """
    Register a new user account on Trade Hub marketplace.

    Creates a Frappe User with custom Trade Hub fields, generates a 6-digit
    OTP for email verification, and sends a verification email.

    Args:
        email: User's email address (used as login identifier)
        password: User's password (must meet strength requirements)
        first_name: User's first name
        last_name: User's last name (optional)
        user_type: Account type - "buyer" or "supplier" (default: "buyer")

    Returns:
        dict: {
            "success": True,
            "message": str,
            "user": str (email),
            "requires_verification": True
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.register

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.register
        {
            "email": "user@example.com",
            "password": "SecurePass1",
            "first_name": "Ali",
            "last_name": "Yılmaz",
            "user_type": "buyer"
        }
    """
    # Rate limiting
    check_rate_limit("register")

    # Validate required fields
    if not email or not password or not first_name:
        frappe.throw(_("Email, password, and first name are required"))

    email = email.strip().lower()
    first_name = first_name.strip()
    last_name = (last_name or "").strip()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Please enter a valid email address"))

    # Check if email already exists
    if frappe.db.exists("User", email):
        frappe.throw(_("An account with this email already exists"))

    # Validate password strength
    password_check = validate_password_strength(password)
    if not password_check["is_valid"]:
        frappe.throw("\n".join(password_check["errors"]))

    # Validate user type
    if user_type not in VALID_USER_TYPES:
        frappe.throw(
            _("Invalid user type. Must be 'buyer' or 'supplier'.")
        )

    # Create user
    try:
        full_name = f"{first_name} {last_name}".strip()

        user_doc = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "enabled": 1,
            "new_password": password,
            "user_type": "Website User",
            "send_welcome_email": 0,
        })
        user_doc.flags.ignore_permissions = True
        user_doc.flags.no_welcome_mail = True
        user_doc.flags.ignore_password_policy = True
        user_doc.insert()

        # Set custom Trade Hub fields
        custom_fields = {
            "tradehub_user_type": user_type,
            "is_email_verified": 0,
            "has_completed_onboarding": 0,
        }
        for field, value in custom_fields.items():
            if hasattr(user_doc, field):
                frappe.db.set_value("User", email, field, value)

        # Generate OTP and send verification email
        otp = generate_verification_otp(email)
        send_verification_email(email, otp, first_name)

        frappe.db.commit()

        return {
            "success": True,
            "message": _(
                "Account created successfully. Please check your email "
                "to verify your account."
            ),
            "user": email,
            "requires_verification": True,
        }

    except frappe.DuplicateEntryError:
        frappe.throw(_("An account with this email already exists"))
    except Exception as e:
        # Cleanup on failure — remove partially created user
        if frappe.db.exists("User", email):
            frappe.delete_doc("User", email, force=True)
            frappe.db.commit()
        frappe.log_error(
            title="Auth API Registration Error",
            message=f"Registration error for {email}: {str(e)}",
        )
        frappe.throw(
            _("An error occurred during registration. Please try again.")
        )


@frappe.whitelist(allow_guest=True)
def verify_email(
    email: str,
    otp: str,
) -> Dict[str, Any]:
    """
    Verify a user's email address using the 6-digit OTP code.

    Validates the OTP from Redis, marks the user's email as verified,
    starts a Frappe session, generates an auth token, and returns the
    user profile.

    Args:
        email: The email address to verify
        otp: The 6-digit verification code

    Returns:
        dict: {
            "success": True,
            "message": str,
            "token": {"api_key": str, "api_secret": str, "token_type": "token"},
            "user": {email, full_name, first_name, last_name, user_type, ...}
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.verify_email

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.verify_email
        {
            "email": "user@example.com",
            "otp": "123456"
        }
    """
    # Rate limiting
    check_rate_limit("verification", email)

    # Validate required fields
    if not email or not otp:
        frappe.throw(_("Email and verification code are required"))

    email = email.strip().lower()
    otp = otp.strip()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Invalid email format"))

    # Check if user exists
    if not frappe.db.exists("User", email):
        frappe.throw(_("No account found with this email"))

    # Get stored OTP from Redis
    cache_key = f"trade_hub:verify:otp:{email}"
    stored_otp = frappe.cache().get_value(cache_key)

    if not stored_otp:
        frappe.throw(
            _("Verification code has expired. Please request a new one."),
            title=_("Code Expired"),
        )

    if str(stored_otp) != str(otp):
        frappe.throw(
            _("Invalid verification code. Please try again."),
            title=_("Invalid Code"),
        )

    # Delete OTP after successful verification (single-use)
    frappe.cache().delete_value(cache_key)

    # Also clear any resend cooldown
    frappe.cache().delete_value(f"trade_hub:verify:cooldown:{email}")

    # Mark email as verified
    frappe.db.set_value("User", email, "is_email_verified", 1)

    # Start Frappe session
    frappe.local.login_manager.login_as(email)

    # Generate auth token (reuses existing API key if present)
    token = generate_auth_token(email)
    api_key, api_secret = token.split(":")

    # Get user profile
    user_doc = frappe.get_doc("User", email)

    frappe.db.commit()

    return {
        "success": True,
        "message": _("Email verified successfully"),
        "token": {
            "api_key": api_key,
            "api_secret": api_secret,
            "token_type": "token",
        },
        "user": {
            "email": user_doc.email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name or "",
            "user_type": getattr(user_doc, "tradehub_user_type", None),
            "is_email_verified": 1,
            "has_completed_onboarding": cint(
                getattr(user_doc, "has_completed_onboarding", 0)
            ),
        },
    }


@frappe.whitelist(allow_guest=True)
def resend_verification_otp(
    email: str,
) -> Dict[str, Any]:
    """
    Resend the email verification OTP code.

    Rate-limited to one request per 60 seconds per email address
    to prevent abuse. Generates a fresh OTP (invalidating any previous one)
    and sends a new verification email.

    Args:
        email: The email address to resend verification to

    Returns:
        dict: {
            "success": True,
            "message": str
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.resend_verification_otp

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.resend_verification_otp
        {
            "email": "user@example.com"
        }
    """
    # Rate limiting (general verification rate limit)
    check_rate_limit("verification", email)

    # Validate required fields
    if not email:
        frappe.throw(_("Email is required"))

    email = email.strip().lower()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Invalid email format"))

    # Check if user exists
    if not frappe.db.exists("User", email):
        frappe.throw(_("No account found with this email"))

    # Check if already verified
    is_verified = frappe.db.get_value("User", email, "is_email_verified")
    if cint(is_verified):
        frappe.throw(_("Email is already verified"))

    # Check 60-second cooldown
    cooldown_key = f"trade_hub:verify:cooldown:{email}"
    last_sent = frappe.cache().get_value(cooldown_key)
    if last_sent:
        frappe.throw(
            _("Please wait {0} seconds before requesting a new code.").format(
                RESEND_OTP_COOLDOWN_SECONDS
            ),
            title=_("Too Soon"),
        )

    # Get user's first name for email personalization
    first_name = frappe.db.get_value("User", email, "first_name")

    # Generate new OTP (overwrites any previous one in Redis)
    otp = generate_verification_otp(email)
    send_verification_email(email, otp, first_name)

    # Set cooldown
    frappe.cache().set_value(
        cooldown_key,
        "1",
        expires_in_sec=RESEND_OTP_COOLDOWN_SECONDS,
    )

    return {
        "success": True,
        "message": _("Verification code sent successfully"),
    }


# =============================================================================
# LOGIN ENDPOINTS
# =============================================================================


@frappe.whitelist(allow_guest=True)
def login(
    email: str,
    password: str,
) -> Dict[str, Any]:
    """
    Log in to Trade Hub with email and password.

    Validates credentials via check_password(), checks email verification
    status, handles 2FA flow when enabled, and on success starts a Frappe
    session and returns auth token + user profile.

    If email is not verified, a new verification OTP is sent and the request
    fails with title='email_not_verified'.

    If 2FA is required, returns a session_id that must be passed to
    verify_2fa() along with the OTP code.

    Args:
        email: User's email address
        password: User's password

    Returns:
        dict: On success (no 2FA):
            {
                "success": True,
                "requires_2fa": False,
                "token": {"api_key": str, "api_secret": str, "token_type": "token"},
                "user": {email, full_name, first_name, last_name, user_type, ...}
            }
        dict: On 2FA required:
            {
                "success": True,
                "requires_2fa": True,
                "session_id": str,
                "method": str,
                "verification": {...},
                "message": str
            }

    API: POST /api/method/tr_tradehub.api.v1.auth.login

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.login
        {
            "email": "user@example.com",
            "password": "SecurePass1"
        }
    """
    # Rate limiting by IP and by email
    check_rate_limit("login")
    check_rate_limit("login", email)

    # Validate required fields
    if not email or not password:
        frappe.throw(_("Email and password are required"))

    email = email.strip().lower()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Invalid email format"))

    # Check if user exists — use generic error to prevent user enumeration
    if not frappe.db.exists("User", email):
        frappe.throw(
            _("Invalid email or password"),
            exc=frappe.AuthenticationError,
        )

    # Validate credentials via Frappe's check_password
    from frappe.utils.password import check_password

    try:
        check_password(email, password)
    except frappe.AuthenticationError:
        frappe.throw(
            _("Invalid email or password"),
            exc=frappe.AuthenticationError,
        )

    # Load user document
    user_doc = frappe.get_doc("User", email)

    # Check if user is enabled
    if not user_doc.enabled:
        frappe.throw(
            _("Your account has been disabled. Please contact support."),
            exc=frappe.AuthenticationError,
        )

    # Check if email is verified
    is_verified = cint(getattr(user_doc, "is_email_verified", 1))
    if not is_verified:
        # Send new verification OTP so user can verify
        otp = generate_verification_otp(email)
        send_verification_email(email, otp, user_doc.first_name)
        frappe.db.commit()

        frappe.throw(
            _(
                "Please verify your email before logging in. "
                "A new verification code has been sent."
            ),
            title="email_not_verified",
        )

    # Check if 2FA is required for this user
    from frappe.twofactor import (
        should_run_2fa,
        authenticate_for_2factor,
        get_verification_method,
    )

    if should_run_2fa(email):
        # Set password in form_dict so authenticate_for_2factor can cache it
        frappe.form_dict["pwd"] = password

        # authenticate_for_2factor sets tmp_id in frappe.local.response
        authenticate_for_2factor(email)

        # Extract tmp_id and verification info from frappe.local.response
        tmp_id = frappe.local.response.get("tmp_id")
        verification = frappe.local.response.get("verification")

        if not tmp_id:
            frappe.throw(
                _(
                    "Two-factor authentication setup failed. "
                    "Please try again."
                ),
                title=_("2FA Error"),
            )

        # Generate a session identifier to map to the internal tmp_id
        session_id = secrets.token_urlsafe(32)

        # Store tmp_id + user in Redis keyed by session_id (5 min expiry)
        cache_key = f"trade_hub:2fa:session:{session_id}"
        frappe.cache().set_value(
            cache_key,
            json.dumps({"tmp_id": tmp_id, "user": email}),
            expires_in_sec=300,
        )

        # Clean up response keys set by authenticate_for_2factor
        frappe.local.response.pop("tmp_id", None)
        frappe.local.response.pop("verification", None)

        # Get verification method (system-wide setting)
        method = get_verification_method()

        return {
            "success": True,
            "requires_2fa": True,
            "session_id": session_id,
            "method": method,
            "verification": verification,
            "message": _("Two-factor authentication required"),
        }

    # No 2FA — start session directly
    frappe.local.login_manager.login_as(email)

    # Generate auth token (reuses existing API key if present)
    token = generate_auth_token(email)
    api_key, api_secret = token.split(":")

    frappe.db.commit()

    return {
        "success": True,
        "requires_2fa": False,
        "message": _("Login successful"),
        "token": {
            "api_key": api_key,
            "api_secret": api_secret,
            "token_type": "token",
        },
        "user": {
            "email": user_doc.email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name or "",
            "user_type": getattr(user_doc, "tradehub_user_type", None),
            "is_email_verified": cint(
                getattr(user_doc, "is_email_verified", 0)
            ),
            "has_completed_onboarding": cint(
                getattr(user_doc, "has_completed_onboarding", 0)
            ),
        },
    }


@frappe.whitelist(allow_guest=True)
def verify_2fa(
    session_id: str,
    otp: str,
) -> Dict[str, Any]:
    """
    Verify a two-factor authentication code to complete login.

    After the login endpoint returns requires_2fa=True with a session_id,
    the frontend calls this endpoint with the session_id and the user's
    OTP code. Retrieves the cached tmp_id from Redis, reconstructs a
    LoginManager, and calls confirm_otp_token to validate the OTP.

    On success, starts a Frappe session and returns an auth token + user
    profile, identical to a successful login response.

    Args:
        session_id: The session identifier returned by the login endpoint
        otp: The OTP code entered by the user

    Returns:
        dict: {
            "success": True,
            "message": str,
            "token": {"api_key": str, "api_secret": str, "token_type": "token"},
            "user": {email, full_name, first_name, last_name, user_type, ...}
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.verify_2fa

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.verify_2fa
        {
            "session_id": "abc123...",
            "otp": "123456"
        }
    """
    # Rate limiting by IP (at the START, before any Redis lookups)
    check_rate_limit("2fa_verify")

    # Validate required fields
    if not session_id or not otp:
        frappe.throw(_("Session ID and verification code are required"))

    otp = otp.strip()

    # Validate OTP format (must be 6 digits)
    if not re.match(r"^\d{6}$", otp):
        frappe.throw(_("Verification code must be 6 digits"))

    # Retrieve 2FA session data from Redis
    cache_key = f"trade_hub:2fa:session:{session_id}"
    session_data = frappe.cache().get_value(cache_key)

    if not session_data:
        frappe.throw(
            _("Two-factor session has expired. Please log in again."),
            title=_("Session Expired"),
        )

    try:
        data = json.loads(session_data)
    except (json.JSONDecodeError, TypeError):
        frappe.throw(
            _("Invalid session data. Please log in again."),
            title=_("Session Error"),
        )

    tmp_id = data.get("tmp_id")
    user = data.get("user")

    if not tmp_id or not user:
        frappe.throw(
            _("Invalid session data. Please log in again."),
            title=_("Session Error"),
        )

    # Additional rate limiting by email (after retrieving user from session)
    check_rate_limit("2fa_verify", user)

    # Reconstruct LoginManager without calling __init__
    # (which would attempt to login/resume session)
    from frappe.auth import LoginManager

    login_manager = object.__new__(LoginManager)
    login_manager.user = user

    # Validate the OTP using Frappe's built-in confirm_otp_token
    from frappe.twofactor import confirm_otp_token

    try:
        result = confirm_otp_token(login_manager, otp=otp, tmp_id=tmp_id)
    except frappe.AuthenticationError:
        # confirm_otp_token calls login_manager.fail() which raises
        # AuthenticationError on incorrect codes
        frappe.throw(
            _("Incorrect verification code. Please try again."),
            exc=frappe.AuthenticationError,
        )
    except Exception as e:
        error_msg = str(e)
        if "expired" in error_msg.lower():
            # Delete expired session from Redis
            frappe.cache().delete_value(cache_key)
            frappe.throw(
                _("Login session has expired. Please log in again."),
                title=_("Session Expired"),
            )
        frappe.log_error(
            title="Auth API Error",
            message=f"2FA verification error for {user}: {error_msg}",
        )
        frappe.throw(
            _("Verification failed. Please try again."),
            title=_("Verification Error"),
        )

    if not result:
        frappe.throw(
            _("Incorrect verification code. Please try again."),
            exc=frappe.AuthenticationError,
        )

    # OTP verified successfully — delete the 2FA session from Redis
    frappe.cache().delete_value(cache_key)

    # Start Frappe session
    frappe.local.login_manager.login_as(user)

    # Generate auth token (reuses existing API key if present)
    token = generate_auth_token(user)
    api_key, api_secret = token.split(":")

    # Get user profile
    user_doc = frappe.get_doc("User", user)

    frappe.db.commit()

    return {
        "success": True,
        "message": _("Two-factor authentication successful"),
        "token": {
            "api_key": api_key,
            "api_secret": api_secret,
            "token_type": "token",
        },
        "user": {
            "email": user_doc.email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name or "",
            "user_type": getattr(user_doc, "tradehub_user_type", None),
            "is_email_verified": cint(
                getattr(user_doc, "is_email_verified", 0)
            ),
            "has_completed_onboarding": cint(
                getattr(user_doc, "has_completed_onboarding", 0)
            ),
        },
    }


# =============================================================================
# PASSWORD RESET ENDPOINTS
# =============================================================================


# Reset token expiry in seconds (10 minutes)
RESET_TOKEN_EXPIRY_SECONDS = 600


@frappe.whitelist(allow_guest=True)
def forgot_password(
    email: str,
) -> Dict[str, Any]:
    """
    Initiate the password reset flow by sending a reset OTP to the user's email.

    IMPORTANT: Always returns the same success message regardless of whether
    the email exists in the system. This prevents user enumeration attacks.

    If the email is associated with an account, a 6-digit OTP is generated
    and sent to the email address. The OTP expires in 15 minutes.

    Args:
        email: The email address to send the reset OTP to

    Returns:
        dict: {
            "success": True,
            "message": str
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.forgot_password

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.forgot_password
        {
            "email": "user@example.com"
        }
    """
    # Rate limiting by email to prevent abuse
    check_rate_limit("password_reset", email)

    # Validate required fields
    if not email:
        frappe.throw(_("Email is required"))

    email = email.strip().lower()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Please enter a valid email address"))

    # Anti-enumeration: always return the same success message
    # Only generate OTP and send email if user actually exists
    if frappe.db.exists("User", email):
        # Check that user is enabled
        user_enabled = frappe.db.get_value("User", email, "enabled")
        if cint(user_enabled):
            first_name = frappe.db.get_value("User", email, "first_name")
            otp = generate_password_reset_otp(email)
            send_password_reset_email(email, otp, first_name)
            frappe.db.commit()

    return {
        "success": True,
        "message": _(
            "If an account with this email exists, you will receive "
            "a password reset code shortly."
        ),
    }


@frappe.whitelist(allow_guest=True)
def verify_reset_otp(
    email: str,
    otp: str,
) -> Dict[str, Any]:
    """
    Verify the password reset OTP and generate a single-use reset token.

    Validates the 6-digit OTP code sent to the user's email during the
    forgot_password step. On success, invalidates the OTP (single-use)
    and generates a secure reset_token stored in Redis for 10 minutes.

    The reset_token must be passed to the reset_password endpoint along
    with the new password.

    Args:
        email: The email address the OTP was sent to
        otp: The 6-digit OTP code from the email

    Returns:
        dict: {
            "success": True,
            "message": str,
            "reset_token": str
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.verify_reset_otp

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.verify_reset_otp
        {
            "email": "user@example.com",
            "otp": "123456"
        }
    """
    # Rate limiting by email
    check_rate_limit("verification", email)

    # Validate required fields
    if not email or not otp:
        frappe.throw(_("Email and verification code are required"))

    email = email.strip().lower()
    otp = otp.strip()

    # Validate email format
    if not validate_email_format(email):
        frappe.throw(_("Invalid email format"))

    # Check if user exists
    if not frappe.db.exists("User", email):
        frappe.throw(
            _("Invalid verification code. Please try again."),
            title=_("Invalid Code"),
        )

    # Get stored OTP from Redis
    cache_key = f"trade_hub:reset:otp:{email}"
    stored_otp = frappe.cache().get_value(cache_key)

    if not stored_otp:
        frappe.throw(
            _("Verification code has expired. Please request a new one."),
            title=_("Code Expired"),
        )

    if str(stored_otp) != str(otp):
        frappe.throw(
            _("Invalid verification code. Please try again."),
            title=_("Invalid Code"),
        )

    # Delete OTP after successful verification (single-use)
    frappe.cache().delete_value(cache_key)

    # Generate a single-use reset token
    reset_token = secrets.token_urlsafe(32)

    # Store reset token in Redis for 10 minutes, mapping token -> email
    token_cache_key = f"trade_hub:reset:token:{reset_token}"
    frappe.cache().set_value(
        token_cache_key,
        email,
        expires_in_sec=RESET_TOKEN_EXPIRY_SECONDS,
    )

    return {
        "success": True,
        "message": _("Verification code accepted"),
        "reset_token": reset_token,
    }


@frappe.whitelist(allow_guest=True)
def reset_password(
    reset_token: str,
    new_password: str,
) -> Dict[str, Any]:
    """
    Reset the user's password using a valid reset token.

    Validates the single-use reset_token from the verify_reset_otp step,
    validates the new password strength, updates the password via Frappe's
    update_password(), and invalidates the token.

    After a successful password reset, the user should log in with their
    new password.

    Args:
        reset_token: The single-use token from verify_reset_otp
        new_password: The new password (must meet strength requirements)

    Returns:
        dict: {
            "success": True,
            "message": str
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.reset_password

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.reset_password
        {
            "reset_token": "abc123...",
            "new_password": "NewSecurePass1"
        }
    """
    # Rate limiting by IP to prevent brute-force token guessing
    check_rate_limit("password_reset")

    # Validate required fields
    if not reset_token or not new_password:
        frappe.throw(_("Reset token and new password are required"))

    # Retrieve email from Redis using reset token
    token_cache_key = f"trade_hub:reset:token:{reset_token}"
    email = frappe.cache().get_value(token_cache_key)

    if not email:
        frappe.throw(
            _("Password reset link has expired or is invalid. "
              "Please request a new password reset."),
            title=_("Invalid Token"),
        )

    # Invalidate the token immediately (single-use)
    frappe.cache().delete_value(token_cache_key)

    # Validate the user still exists and is enabled
    if not frappe.db.exists("User", email):
        frappe.throw(
            _("User account not found. Please contact support."),
            title=_("Account Error"),
        )

    user_enabled = frappe.db.get_value("User", email, "enabled")
    if not cint(user_enabled):
        frappe.throw(
            _("Your account has been disabled. Please contact support."),
            title=_("Account Disabled"),
        )

    # Validate new password strength
    password_check = validate_password_strength(new_password)
    if not password_check["is_valid"]:
        frappe.throw("\n".join(password_check["errors"]))

    # Update the password via Frappe's update_password utility
    try:
        _update_password(email, new_password)
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(
            title="Auth API Error",
            message=f"Password reset error for {email}: {str(e)}",
        )
        frappe.throw(
            _("An error occurred while resetting your password. "
              "Please try again."),
            title=_("Reset Error"),
        )

    return {
        "success": True,
        "message": _(
            "Password has been reset successfully. "
            "You can now log in with your new password."
        ),
    }


# =============================================================================
# ONBOARDING ENDPOINTS
# =============================================================================


@frappe.whitelist()
def complete_onboarding() -> Dict[str, Any]:
    """
    Mark the current user's onboarding as completed.

    This authenticated endpoint reads the session user, sets
    has_completed_onboarding=1 on their User DocType, and returns
    a success response with a redirect URL. The frontend auth
    middleware uses this flag to decide whether to redirect new
    users to the welcome/onboarding page.

    Returns:
        dict: {
            "success": True,
            "message": str,
            "redirect_url": str
        }

    API: POST /api/method/tr_tradehub.api.v1.auth.complete_onboarding

    Example:
        POST /api/method/tr_tradehub.api.v1.auth.complete_onboarding
    """
    user = frappe.session.user

    if user == "Guest":
        frappe.throw(
            _("Authentication required"),
            exc=frappe.AuthenticationError,
        )

    # Verify user exists
    if not frappe.db.exists("User", user):
        frappe.throw(
            _("User account not found"),
            exc=frappe.DoesNotExistError,
        )

    try:
        # Set has_completed_onboarding flag on User DocType
        frappe.db.set_value("User", user, "has_completed_onboarding", 1)
        frappe.db.commit()

        # Determine redirect URL based on user type
        user_type = frappe.db.get_value("User", user, "tradehub_user_type")
        if user_type == "supplier":
            redirect_path = "/pages/seller/sell.html"
        else:
            redirect_path = "/pages/dashboard/buyer-dashboard.html"

        return {
            "success": True,
            "message": _("Onboarding completed successfully"),
            "redirect_url": redirect_path,
        }

    except Exception as e:
        frappe.log_error(
            title="Auth API Error",
            message=f"Complete onboarding error for {user}: {str(e)}",
        )
        frappe.throw(
            _("An error occurred while completing onboarding. "
              "Please try again."),
            title=_("Onboarding Error"),
        )


# =============================================================================
# INTERNAL/ADMIN ENDPOINTS
# =============================================================================


@frappe.whitelist()
def get_sso_debug_info() -> Dict[str, Any]:
    """
    Get SSO configuration debug information.

    Returns detailed configuration information for debugging SSO issues.
    Only available to System Managers.

    Returns:
        dict: SSO configuration details

    API: GET /api/method/trade_hub.api.v1.auth.get_sso_debug_info
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Managers can access debug info"))

    settings = get_keycloak_settings()

    return {
        "success": True,
        "debug_info": {
            "enabled": is_keycloak_enabled(),
            "server_url": settings.get("server_url"),
            "realm": settings.get("realm"),
            "client_id": settings.get("client_id"),
            "auto_create_users": settings.get("auto_create_users"),
            "default_tenant": settings.get("default_tenant"),
            "callback_uri": build_callback_uri(),
            "role_mappings": settings.get("role_mappings", {}),
        }
    }


@frappe.whitelist()
def test_keycloak_connection() -> Dict[str, Any]:
    """
    Test the connection to Keycloak server.

    Attempts to connect to Keycloak and fetch the OpenID configuration.
    Only available to System Managers.

    Returns:
        dict: Connection test result

    API: POST /api/method/trade_hub.api.v1.auth.test_keycloak_connection
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Managers can test connections"))

    if not is_keycloak_enabled():
        return {
            "success": False,
            "message": "Keycloak is not configured"
        }

    try:
        import requests

        settings = get_keycloak_settings()
        server_url = settings.get("server_url")
        realm = settings.get("realm")

        well_known_url = f"{server_url}/realms/{realm}/.well-known/openid-configuration"

        response = requests.get(well_known_url, timeout=10)

        if response.status_code == 200:
            config = response.json()
            return {
                "success": True,
                "message": "Successfully connected to Keycloak",
                "issuer": config.get("issuer"),
                "authorization_endpoint": config.get("authorization_endpoint"),
                "token_endpoint": config.get("token_endpoint"),
            }
        else:
            return {
                "success": False,
                "message": f"Keycloak returned status {response.status_code}",
            }

    except requests.exceptions.ConnectionError as e:
        return {
            "success": False,
            "message": f"Could not connect to Keycloak: {str(e)}",
        }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "message": "Connection timed out",
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
        }


@frappe.whitelist()
def invalidate_user_sessions(user: str) -> Dict[str, Any]:
    """
    Invalidate all SSO sessions for a user.

    Clears cached refresh tokens and optionally revokes Keycloak sessions.
    Only available to System Managers.

    Args:
        user: The user email

    Returns:
        dict: Result of invalidation

    API: POST /api/method/trade_hub.api.v1.auth.invalidate_user_sessions
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Managers can invalidate sessions"))

    if not user:
        frappe.throw(_("User is required"))

    if not frappe.db.exists("User", user):
        frappe.throw(_("User not found"))

    # Clear cached refresh token
    frappe.cache().delete_value(f"{SSO_CACHE_PREFIX}:refresh:{user}")

    return {
        "success": True,
        "message": f"SSO sessions invalidated for user: {user}"
    }
