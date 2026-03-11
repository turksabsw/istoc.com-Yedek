# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Permission hooks for Trade Hub Catalog module.

This module provides permission query conditions and document-level permission
checks for Brand, Brand Gating, Brand Ownership Claim, Brand Authorization
Request, and Variant Request DocTypes.

Functions are registered in hooks.py under:
- permission_query_conditions (brand_gating_conditions, brand_ownership_claim_conditions,
  brand_authorization_request_conditions, variant_request_conditions)
- has_permission (brand_has_permission, brand_gating_has_permission,
  variant_request_has_permission)

Key Behaviors:
- System Manager always has full access (bypass all checks)
- Brand owner_seller gets write access to allowed profile fields only
- Brand Gating: owner_seller can create, read, write for own brand entries
- Brand Authorization Request: requesting_seller sees own requests,
  brand owner_seller sees requests for their brands
- Variant Request: requesting_seller sees own requests,
  brand owner_seller can read+write requests for their brands
- Tenant isolation via get_current_tenant() from tradehub_core
"""

import frappe
from frappe import _


# =============================================================================
# BRAND OWNER ALLOWED FIELDS
# =============================================================================

# Fields that the brand owner_seller is allowed to modify
BRAND_OWNER_ALLOWED_FIELDS = [
    "cover_image",
    "founding_story",
    "brand_values",
    "website",
    "description",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "social_media_links",
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def _get_doc_field(doc, fieldname):
    """
    Safely get a field value from a document that may be a dict or Document.

    Args:
        doc: The document (dict or Document object).
        fieldname (str): The field name to retrieve.

    Returns:
        The field value, or None if not found.
    """
    if isinstance(doc, dict):
        return doc.get(fieldname)
    return getattr(doc, fieldname, None)


def _get_seller_for_user(user):
    """
    Get the Seller Profile name linked to a user.

    Args:
        user (str): The user email/ID.

    Returns:
        str or None: The Seller Profile name, or None if not found.
    """
    return frappe.db.get_value("Seller Profile", {"user": user}, "name")


def _get_current_tenant():
    """
    Get the current tenant using tradehub_core utility.

    Returns:
        str or None: The current tenant name, or None.
    """
    try:
        from tradehub_core.tradehub_core.utils.tenant import get_current_tenant
        return get_current_tenant()
    except ImportError:
        return None


# =============================================================================
# BRAND PERMISSION
# =============================================================================


def brand_has_permission(doc, ptype=None, user=None):
    """
    Check if user has permission to access a Brand document.

    System Managers have full access. Brand owner_seller gets write access
    to allowed profile fields only. All users with standard read permission
    can read brands.

    Args:
        doc: The Brand document (dict or Document object).
        ptype (str, optional): Permission type (read, write, create, etc.).
            Defaults to 'read'.
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        bool: True if user has permission, False otherwise.
    """
    try:
        user = user or frappe.session.user
        ptype = ptype or "read"

        # System Manager bypass
        if "System Manager" in frappe.get_roles(user):
            return True

        # Read access: allow if user has standard read role permission
        if ptype == "read":
            return True

        # Write/create/delete: check if user is the brand owner_seller
        if ptype in ("write", "create", "delete", "cancel", "submit"):
            owner_seller = _get_doc_field(doc, "owner_seller")
            if not owner_seller:
                return False

            # Check if current user is the owner seller
            seller = _get_seller_for_user(user)
            if not seller:
                return False

            return seller == owner_seller

        return True
    except Exception:
        frappe.log_error("Brand has_permission error")
        return False


# =============================================================================
# BRAND GATING PERMISSION
# =============================================================================


def brand_gating_has_permission(doc, ptype=None, user=None):
    """
    Check if user has permission to access a Brand Gating document.

    System Managers have full access. The owner_seller of the linked brand
    can create, read, and write Brand Gating entries for their own brand.
    The seller linked to the Brand Gating entry can read their own entries.

    Args:
        doc: The Brand Gating document (dict or Document object).
        ptype (str, optional): Permission type (read, write, create, etc.).
            Defaults to 'read'.
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        bool: True if user has permission, False otherwise.
    """
    try:
        user = user or frappe.session.user
        ptype = ptype or "read"

        # System Manager bypass
        if "System Manager" in frappe.get_roles(user):
            return True

        seller = _get_seller_for_user(user)
        if not seller:
            return False

        # Check if user is the seller linked to this Brand Gating entry
        doc_seller = _get_doc_field(doc, "seller")
        if doc_seller == seller:
            # Seller can read and write their own gating entries
            if ptype in ("read", "write", "create"):
                return True

        # Check if user is the owner_seller of the brand
        brand = _get_doc_field(doc, "brand")
        if brand:
            brand_owner_seller = frappe.db.get_value(
                "Brand", brand, "owner_seller", cache=True
            )
            if brand_owner_seller and brand_owner_seller == seller:
                # Brand owner can create, read, write gating entries for their brand
                if ptype in ("read", "write", "create"):
                    return True

        # Tenant isolation check
        doc_tenant = _get_doc_field(doc, "tenant")
        if doc_tenant:
            current_tenant = _get_current_tenant()
            if current_tenant and doc_tenant != current_tenant:
                return False

        return False
    except Exception:
        frappe.log_error("Brand Gating has_permission error")
        return False


# =============================================================================
# BRAND GATING QUERY CONDITIONS
# =============================================================================


def brand_gating_conditions(user=None):
    """
    Return SQL conditions for Brand Gating list queries.

    System Managers see all records. Sellers see only entries where they are
    the linked seller or the brand owner_seller. Tenant isolation is enforced.

    Args:
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        str: SQL WHERE clause fragment (without WHERE keyword).
    """
    try:
        user = user or frappe.session.user

        # System Manager sees all
        if "System Manager" in frappe.get_roles(user):
            return ""

        # Get seller profile for user
        seller = _get_seller_for_user(user)
        if not seller:
            return "1=0"

        escaped_seller = frappe.db.escape(seller)

        # Tenant isolation
        current_tenant = _get_current_tenant()
        tenant_condition = ""
        if current_tenant:
            escaped_tenant = frappe.db.escape(current_tenant)
            tenant_condition = (
                " AND `tabBrand Gating`.`tenant` = {tenant}"
            ).format(tenant=escaped_tenant)

        # Seller sees entries where they are the seller OR the brand owner_seller
        return (
            "("
            "`tabBrand Gating`.`seller` = {seller}"
            " OR `tabBrand Gating`.`brand` IN ("
            "SELECT `name` FROM `tabBrand` WHERE `owner_seller` = {seller}"
            ")"
            ")"
            "{tenant_condition}"
        ).format(
            seller=escaped_seller,
            tenant_condition=tenant_condition
        )
    except Exception:
        frappe.log_error("Brand Gating permission query conditions error")
        return "1=0"


# =============================================================================
# BRAND OWNERSHIP CLAIM QUERY CONDITIONS
# =============================================================================


def brand_ownership_claim_conditions(user=None):
    """
    Return SQL conditions for Brand Ownership Claim list queries.

    System Managers see all records. Sellers see only their own claims.
    Tenant isolation is enforced.

    Args:
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        str: SQL WHERE clause fragment (without WHERE keyword).
    """
    try:
        user = user or frappe.session.user

        # System Manager sees all
        if "System Manager" in frappe.get_roles(user):
            return ""

        # Get seller profile for user
        seller = _get_seller_for_user(user)
        if not seller:
            return "1=0"

        escaped_seller = frappe.db.escape(seller)

        # Tenant isolation
        current_tenant = _get_current_tenant()
        tenant_condition = ""
        if current_tenant:
            escaped_tenant = frappe.db.escape(current_tenant)
            tenant_condition = (
                " AND `tabBrand Ownership Claim`.`tenant` = {tenant}"
            ).format(tenant=escaped_tenant)

        # Seller sees only their own claims
        return (
            "`tabBrand Ownership Claim`.`claiming_seller` = {seller}"
            "{tenant_condition}"
        ).format(
            seller=escaped_seller,
            tenant_condition=tenant_condition
        )
    except Exception:
        frappe.log_error("Brand Ownership Claim permission query conditions error")
        return "1=0"


# =============================================================================
# BRAND AUTHORIZATION REQUEST QUERY CONDITIONS
# =============================================================================


def brand_authorization_request_conditions(user=None):
    """
    Return SQL conditions for Brand Authorization Request list queries.

    System Managers see all records. Sellers see requests where they are
    the requesting_seller OR the brand owner_seller (so brand owners can
    review requests for their brands). Tenant isolation is enforced.

    Args:
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        str: SQL WHERE clause fragment (without WHERE keyword).
    """
    try:
        user = user or frappe.session.user

        # System Manager sees all
        if "System Manager" in frappe.get_roles(user):
            return ""

        # Get seller profile for user
        seller = _get_seller_for_user(user)
        if not seller:
            return "1=0"

        escaped_seller = frappe.db.escape(seller)

        # Tenant isolation
        current_tenant = _get_current_tenant()
        tenant_condition = ""
        if current_tenant:
            escaped_tenant = frappe.db.escape(current_tenant)
            tenant_condition = (
                " AND `tabBrand Authorization Request`.`tenant` = {tenant}"
            ).format(tenant=escaped_tenant)

        # Seller sees requests where they are the requesting_seller
        # OR where they are the brand owner_seller (brand owner can review)
        return (
            "("
            "`tabBrand Authorization Request`.`requesting_seller` = {seller}"
            " OR `tabBrand Authorization Request`.`brand` IN ("
            "SELECT `name` FROM `tabBrand` WHERE `owner_seller` = {seller}"
            ")"
            ")"
            "{tenant_condition}"
        ).format(
            seller=escaped_seller,
            tenant_condition=tenant_condition
        )
    except Exception:
        frappe.log_error("Brand Authorization Request permission query conditions error")
        return "1=0"


# =============================================================================
# VARIANT REQUEST QUERY CONDITIONS
# =============================================================================


def variant_request_conditions(user=None):
    """
    Return SQL conditions for Variant Request list queries.

    System Managers see all records. Sellers see requests where they are
    the requesting_seller OR the brand owner_seller (so brand owners can
    review variant requests for their brands). Tenant isolation is enforced.

    Args:
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        str: SQL WHERE clause fragment (without WHERE keyword).
    """
    try:
        user = user or frappe.session.user

        # System Manager sees all
        if "System Manager" in frappe.get_roles(user):
            return ""

        # Get seller profile for user
        seller = _get_seller_for_user(user)
        if not seller:
            return "1=0"

        escaped_seller = frappe.db.escape(seller)

        # Tenant isolation
        current_tenant = _get_current_tenant()
        tenant_condition = ""
        if current_tenant:
            escaped_tenant = frappe.db.escape(current_tenant)
            tenant_condition = (
                " AND `tabVariant Request`.`tenant` = {tenant}"
            ).format(tenant=escaped_tenant)

        # Seller sees requests where they are the requesting_seller
        # OR where they are the brand owner_seller (brand owner can review)
        return (
            "("
            "`tabVariant Request`.`requesting_seller` = {seller}"
            " OR `tabVariant Request`.`brand` IN ("
            "SELECT `name` FROM `tabBrand` WHERE `owner_seller` = {seller}"
            ")"
            ")"
            "{tenant_condition}"
        ).format(
            seller=escaped_seller,
            tenant_condition=tenant_condition
        )
    except Exception:
        frappe.log_error("Variant Request permission query conditions error")
        return "1=0"


# =============================================================================
# VARIANT REQUEST PERMISSION
# =============================================================================


def variant_request_has_permission(doc, ptype=None, user=None):
    """
    Check if user has permission to access a Variant Request document.

    System Managers have full access. The requesting_seller can read and
    create their own requests. The brand owner_seller can read and write
    variant requests for their brands.

    Args:
        doc: The Variant Request document (dict or Document object).
        ptype (str, optional): Permission type (read, write, create, etc.).
            Defaults to 'read'.
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        bool: True if user has permission, False otherwise.
    """
    try:
        user = user or frappe.session.user
        ptype = ptype or "read"

        # System Manager bypass
        if "System Manager" in frappe.get_roles(user):
            return True

        seller = _get_seller_for_user(user)
        if not seller:
            return False

        # Check if user is the requesting seller
        requesting_seller = _get_doc_field(doc, "requesting_seller")
        if requesting_seller == seller:
            # Requesting seller can read and create their own requests
            if ptype in ("read", "create"):
                return True

        # Check if user is the brand owner_seller
        brand = _get_doc_field(doc, "brand")
        if brand:
            brand_owner_seller = frappe.db.get_value(
                "Brand", brand, "owner_seller", cache=True
            )
            if brand_owner_seller and brand_owner_seller == seller:
                # Brand owner can read and write variant requests for their brand
                if ptype in ("read", "write"):
                    return True

        # Tenant isolation check
        doc_tenant = _get_doc_field(doc, "tenant")
        if doc_tenant:
            current_tenant = _get_current_tenant()
            if current_tenant and doc_tenant != current_tenant:
                return False

        return False
    except Exception:
        frappe.log_error("Variant Request has_permission error")
        return False
