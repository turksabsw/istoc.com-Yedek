# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Brand DocType for Trade Hub B2B Marketplace.

This module implements the Brand DocType with logo, description, and verification
status management. Brands can be global or tenant-specific, and require verification
before being fully trusted in the marketplace.

Key Features:
- Logo and branding information management
- Verification workflow (Pending -> Under Review -> Verified/Rejected)
- Multi-tenant support (brands can be global or tenant-specific)
- SEO metadata for brand pages
- URL slug generation for SEO-friendly URLs
- Product count tracking
- Brand ownership management (owner_seller linkage)
- Brand profile and catalog APIs for marketplace pages
"""

import re
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, today, getdate


class Brand(Document):
    """
    Brand DocType with verification workflow and multi-tenant support.

    Brands represent product manufacturers or labels. They can be registered
    by sellers and require verification before being marked as trusted.
    """

    def before_insert(self):
        """Set default values before inserting a new brand."""
        self.set_registration_info()
        self.generate_url_slug()
        self.set_tenant_from_user()

    def validate(self):
        """Validate brand data before saving."""
        self.validate_brand_name()
        self.validate_brand_values()
        self.validate_owner_seller()
        self.validate_verification_status()
        self.validate_tenant_consistency()
        self.validate_seo_fields()
        self.validate_year_established()
        self.generate_url_slug()

    def on_update(self):
        """Actions after brand is updated."""
        self.clear_brand_cache()

    def on_trash(self):
        """Prevent deletion of brand with linked products."""
        self.check_linked_products()

    # =========================================================================
    # INITIALIZATION METHODS
    # =========================================================================

    def set_registration_info(self):
        """Set registration information for new brands."""
        if not self.registered_by:
            self.registered_by = frappe.session.user
        if not self.registration_date:
            self.registration_date = today()

    def set_tenant_from_user(self):
        """Set tenant from current user if not already set."""
        if not self.tenant and not self.is_global:
            user_tenant = frappe.db.get_value("User", frappe.session.user, "tenant")
            if user_tenant:
                self.tenant = user_tenant

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def validate_brand_name(self):
        """Validate brand name is not empty and follows naming conventions."""
        if not self.brand_name:
            frappe.throw(_("Brand Name is required"))

        # Check for invalid characters
        if any(char in self.brand_name for char in ['<', '>', '"', '\\']):
            frappe.throw(_("Brand Name contains invalid characters"))

        # Check length
        if len(self.brand_name) > 140:
            frappe.throw(_("Brand Name cannot exceed 140 characters"))

        # Trim whitespace
        self.brand_name = self.brand_name.strip()

    def validate_brand_values(self):
        """Validate brand_values field does not exceed maximum length."""
        if self.brand_values and len(self.brand_values) > 500:
            frappe.throw(
                _("Brand Values cannot exceed 500 characters")
            )

    def validate_owner_seller(self):
        """Validate owner_seller link is a valid and active Seller Profile."""
        if not self.owner_seller:
            return

        seller_data = frappe.db.get_value(
            "Seller Profile",
            self.owner_seller,
            ["status", "verification_status"],
            as_dict=True
        )

        if not seller_data:
            frappe.throw(_("Owner Seller Profile not found"))

        if seller_data.status == "Deactivated":
            frappe.throw(
                _("Cannot assign deactivated seller as brand owner")
            )

        if seller_data.verification_status != "Verified":
            frappe.msgprint(
                _("Warning: Owner Seller {0} is not verified").format(
                    self.owner_seller
                ),
                indicator="orange",
                alert=True
            )

        # Set ownership date if not already set
        if not self.ownership_date:
            self.ownership_date = today()

    def validate_verification_status(self):
        """Validate verification status transitions."""
        if self.has_value_changed("verification_status"):
            old_status = self.get_doc_before_save()
            old_status = old_status.verification_status if old_status else "Pending"
            new_status = self.verification_status

            # Define valid transitions
            valid_transitions = {
                "Pending": ["Under Review", "Verified", "Rejected"],
                "Under Review": ["Verified", "Rejected", "Pending"],
                "Verified": ["Rejected", "Pending"],
                "Rejected": ["Pending", "Under Review"]
            }

            if new_status not in valid_transitions.get(old_status, []):
                # Allow System Manager to override
                if not frappe.has_permission("Brand", "write", user=frappe.session.user):
                    frappe.throw(
                        _("Invalid status transition from {0} to {1}").format(
                            old_status, new_status
                        )
                    )

            # Set verification info when status changes to Verified or Rejected
            if new_status in ["Verified", "Rejected"]:
                self.verified_by = frappe.session.user
                self.verification_date = today()
            elif new_status == "Pending":
                # Reset verification info when going back to Pending
                self.verified_by = None
                self.verification_date = None

    def validate_tenant_consistency(self):
        """Ensure tenant consistency for brands."""
        # Global brands should not have tenant
        if self.is_global and self.tenant:
            self.tenant = None
            self.tenant_name = None

        # Non-global brands need tenant
        if not self.is_global and not self.tenant:
            # Only admin can create global brands
            if not frappe.has_permission("Tenant", "write"):
                frappe.throw(
                    _("Please select a tenant or mark the brand as global")
                )

    def validate_seo_fields(self):
        """Validate SEO field lengths."""
        if self.seo_title and len(self.seo_title) > 60:
            frappe.msgprint(
                _("SEO Title exceeds recommended length of 60 characters"),
                indicator="orange"
            )

        if self.seo_description and len(self.seo_description) > 160:
            frappe.msgprint(
                _("SEO Description exceeds recommended length of 160 characters"),
                indicator="orange"
            )

    def validate_year_established(self):
        """Validate year established is reasonable."""
        if self.year_established:
            current_year = getdate(today()).year
            if self.year_established < 1800 or self.year_established > current_year:
                frappe.throw(
                    _("Year Established must be between 1800 and {0}").format(
                        current_year
                    )
                )

    # =========================================================================
    # URL SLUG GENERATION
    # =========================================================================

    def generate_url_slug(self):
        """Generate SEO-friendly URL slug from brand name."""
        if not self.url_slug and self.brand_name:
            # Convert to lowercase and replace special characters
            slug = self.brand_name.lower()

            # Turkish character replacements
            turkish_map = {
                'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
                'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'
            }
            for tr_char, en_char in turkish_map.items():
                slug = slug.replace(tr_char, en_char)

            # Replace spaces and special chars with hyphens
            slug = re.sub(r'[^a-z0-9\-]', '-', slug)
            # Remove consecutive hyphens
            slug = re.sub(r'-+', '-', slug)
            # Remove leading/trailing hyphens
            slug = slug.strip('-')

            # Ensure uniqueness
            base_slug = slug
            counter = 1
            while frappe.db.exists("Brand", {"url_slug": slug, "name": ("!=", self.name or "")}):
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.url_slug = slug

    # =========================================================================
    # LINKED DOCUMENT CHECKS
    # =========================================================================

    def check_linked_products(self):
        """Check for linked products before allowing deletion."""
        product_count = frappe.db.count("SKU Product", {"brand": self.name})
        if product_count > 0:
            frappe.throw(
                _("Cannot delete brand with {0} linked product(s). "
                  "Please reassign products to another brand first.").format(
                    product_count
                )
            )

    # =========================================================================
    # PRODUCT COUNT METHODS
    # =========================================================================

    def update_product_count(self):
        """Update the product count for this brand."""
        count = frappe.db.count(
            "SKU Product",
            filters={"brand": self.name, "status": "Active"}
        )
        self.db_set("product_count", count, update_modified=False)

    def get_active_product_count(self):
        """
        Get count of active products for this brand.

        Returns:
            int: Number of active products
        """
        return frappe.db.count(
            "SKU Product",
            filters={"brand": self.name, "status": "Active"}
        )

    # =========================================================================
    # CACHE MANAGEMENT
    # =========================================================================

    def clear_brand_cache(self):
        """Clear cached brand data."""
        cache_keys = [
            "brand_list",
            f"brand:{self.name}",
        ]
        if self.tenant:
            cache_keys.append(f"brand_list:{self.tenant}")

        for key in cache_keys:
            frappe.cache().delete_value(key)


# =============================================================================
# WHITELISTED API FUNCTIONS
# =============================================================================


@frappe.whitelist()
def get_brand_list(tenant=None, include_disabled=False, verified_only=False):
    """
    Get list of brands.

    Args:
        tenant: Optional tenant filter (None = global brands only)
        include_disabled: Include disabled brands
        verified_only: Only include verified brands

    Returns:
        list: List of brand documents
    """
    filters = {}

    if not include_disabled:
        filters["enabled"] = 1

    if verified_only:
        filters["verification_status"] = "Verified"

    if tenant:
        # Include tenant-specific and global brands
        brands = frappe.get_all(
            "Brand",
            or_filters=[
                ["tenant", "=", tenant],
                ["is_global", "=", 1]
            ],
            filters=filters,
            fields=[
                "name", "brand_name", "logo", "verification_status",
                "url_slug", "display_order", "product_count"
            ],
            order_by="display_order asc, brand_name asc"
        )
    else:
        # Only global brands
        filters["is_global"] = 1
        brands = frappe.get_all(
            "Brand",
            filters=filters,
            fields=[
                "name", "brand_name", "logo", "verification_status",
                "url_slug", "display_order", "product_count"
            ],
            order_by="display_order asc, brand_name asc"
        )

    return brands


@frappe.whitelist()
def get_brand_by_slug(slug):
    """
    Get brand by URL slug.

    Args:
        slug: The URL slug of the brand

    Returns:
        dict: Brand data
    """
    brand = frappe.db.get_value(
        "Brand",
        {"url_slug": slug, "enabled": 1},
        ["name", "brand_name", "description", "logo",
         "verification_status", "website", "country_of_origin",
         "year_established", "seo_title", "seo_description",
         "seo_keywords", "product_count"],
        as_dict=True
    )

    if not brand:
        frappe.throw(_("Brand not found"))

    return brand


@frappe.whitelist()
def verify_brand(brand_name, status, notes=None):
    """
    Verify or reject a brand.

    Args:
        brand_name: Name of the brand to verify
        status: New verification status (Verified or Rejected)
        notes: Optional verification notes

    Returns:
        dict: Updated brand data
    """
    # Check permission
    if not frappe.has_permission("Brand", "write"):
        frappe.throw(_("Insufficient permissions to verify brands"))

    if status not in ["Verified", "Rejected"]:
        frappe.throw(_("Status must be 'Verified' or 'Rejected'"))

    brand = frappe.get_doc("Brand", brand_name)
    brand.verification_status = status
    if notes:
        brand.verification_notes = notes
    brand.save(ignore_permissions=True)

    return {
        "name": brand.name,
        "brand_name": brand.brand_name,
        "verification_status": brand.verification_status,
        "verified_by_name": brand.verified_by_name,
        "verification_date": brand.verification_date
    }


@frappe.whitelist()
def get_brand_products(brand_name, limit=20, offset=0):
    """
    Get products for a brand.

    Args:
        brand_name: Name of the brand
        limit: Number of products to return
        offset: Pagination offset

    Returns:
        dict: Products list and total count
    """
    if not frappe.db.exists("Brand", brand_name):
        frappe.throw(_("Brand {0} not found").format(brand_name))

    filters = {"brand": brand_name, "status": "Active"}

    total = frappe.db.count("SKU Product", filters=filters)
    products = frappe.get_all(
        "SKU Product",
        filters=filters,
        fields=[
            "name", "sku_code", "product_name", "base_price", "currency",
            "thumbnail", "url_slug", "seller_name"
        ],
        limit_page_length=cint(limit),
        limit_start=cint(offset),
        order_by="modified desc"
    )

    return {
        "products": products,
        "total": total,
        "limit": cint(limit),
        "offset": cint(offset)
    }


@frappe.whitelist()
def submit_for_verification(brand_name):
    """
    Submit a brand for verification review.

    Args:
        brand_name: Name of the brand to submit

    Returns:
        dict: Updated brand data
    """
    brand = frappe.get_doc("Brand", brand_name)

    # Check if user owns or can edit this brand
    if brand.registered_by != frappe.session.user and not frappe.has_permission("Brand", "write"):
        frappe.throw(_("You can only submit brands you registered"))

    if brand.verification_status != "Pending":
        frappe.throw(_("Only pending brands can be submitted for verification"))

    brand.verification_status = "Under Review"
    brand.save()

    return {
        "name": brand.name,
        "brand_name": brand.brand_name,
        "verification_status": brand.verification_status
    }


@frappe.whitelist()
def update_product_counts():
    """
    Update product counts for all brands.
    Intended to be called via scheduler or manually.

    Returns:
        dict: Number of brands updated
    """
    brands = frappe.get_all("Brand", fields=["name"])
    updated = 0

    for brand_data in brands:
        brand = frappe.get_doc("Brand", brand_data.name)
        old_count = brand.product_count or 0
        brand.update_product_count()
        if brand.product_count != old_count:
            updated += 1

    frappe.db.commit()

    return {"updated_count": updated, "total_brands": len(brands)}


# =============================================================================
# BRAND OWNERSHIP & PROFILE API FUNCTIONS
# =============================================================================


@frappe.whitelist(allow_guest=True)
def get_brand_page(brand_name):
    """
    Get full brand page data for public-facing brand pages.

    Returns brand profile information including branding, social media links,
    ownership details, and product summary for rendering brand pages.

    Args:
        brand_name: Name of the brand

    Returns:
        dict: Brand page data including profile, social links, and product summary
    """
    if not frappe.db.exists("Brand", brand_name):
        frappe.throw(_("Brand {0} not found").format(brand_name))

    brand = frappe.get_doc("Brand", brand_name)

    if not brand.enabled:
        frappe.throw(_("Brand {0} is not available").format(brand_name))

    # Build brand page data
    page_data = {
        "name": brand.name,
        "brand_name": brand.brand_name,
        "description": brand.description,
        "logo": brand.logo,
        "cover_image": brand.cover_image,
        "founding_story": brand.founding_story,
        "brand_values": brand.brand_values,
        "website": brand.website,
        "country_of_origin": brand.country_of_origin,
        "year_established": brand.year_established,
        "verification_status": brand.verification_status,
        "url_slug": brand.url_slug,
        "product_count": brand.product_count or 0,
        "seo_title": brand.seo_title,
        "seo_description": brand.seo_description,
        "seo_keywords": brand.seo_keywords,
        "owner_seller": brand.owner_seller,
        "owner_seller_name": brand.owner_seller_name,
    }

    # Include social media links
    social_links = []
    if brand.social_media_links:
        for link in brand.social_media_links:
            if link.is_active:
                social_links.append({
                    "platform": link.platform,
                    "url": link.url
                })
    page_data["social_media_links"] = social_links

    return page_data


@frappe.whitelist()
def get_brand_authorized_sellers(brand_name, include_pending=False):
    """
    Get all authorized sellers for a brand.

    Args:
        brand_name: Name of the brand
        include_pending: Whether to include pending authorizations

    Returns:
        list: List of authorized sellers with authorization details
    """
    if not frappe.db.exists("Brand", brand_name):
        frappe.throw(_("Brand {0} not found").format(brand_name))

    filters = {"brand": brand_name}

    if not cint(include_pending):
        filters["authorization_status"] = "Approved"
        filters["is_active"] = 1

    authorizations = frappe.get_all(
        "Brand Gating",
        filters=filters,
        fields=[
            "name", "seller", "seller_name", "seller_company",
            "authorization_type", "authorization_status", "is_exclusive",
            "priority_level", "valid_from", "valid_to",
            "authorized_by_name", "authorization_date"
        ],
        order_by="priority_level desc, authorization_date asc"
    )

    return authorizations


@frappe.whitelist()
def update_brand_profile(brand_name, **kwargs):
    """
    Update brand profile fields. Only the brand owner or System Manager
    can update profile fields.

    Allowed fields: cover_image, founding_story, brand_values, website,
    description, seo_title, seo_description, seo_keywords.

    Args:
        brand_name: Name of the brand to update
        **kwargs: Field values to update

    Returns:
        dict: Updated brand data
    """
    brand = frappe.get_doc("Brand", brand_name)

    # Permission check: only brand owner or System Manager
    is_system_manager = "System Manager" in frappe.get_roles()
    is_owner = (
        brand.owner_seller
        and frappe.db.get_value(
            "Seller Profile", brand.owner_seller, "user"
        ) == frappe.session.user
    )

    if not is_system_manager and not is_owner:
        frappe.throw(_("Only the brand owner or System Manager can update brand profile"))

    # Allowed fields for profile update
    allowed_fields = [
        "cover_image", "founding_story", "brand_values", "website",
        "description", "seo_title", "seo_description", "seo_keywords"
    ]

    updated_fields = []
    for field in allowed_fields:
        if field in kwargs:
            setattr(brand, field, kwargs[field])
            updated_fields.append(field)

    if not updated_fields:
        frappe.throw(_("No valid fields provided for update"))

    brand.save()

    return {
        "name": brand.name,
        "brand_name": brand.brand_name,
        "updated_fields": updated_fields,
        "message": _("Brand profile updated successfully")
    }


@frappe.whitelist()
def revoke_brand_ownership(brand_name, reason=None):
    """
    Revoke brand ownership, clearing the owner_seller and ownership_date fields.

    Only System Manager can revoke brand ownership.

    Args:
        brand_name: Name of the brand
        reason: Optional reason for revocation

    Returns:
        dict: Updated brand data
    """
    # Only System Manager can revoke ownership
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can revoke brand ownership"))

    brand = frappe.get_doc("Brand", brand_name)

    if not brand.owner_seller:
        frappe.throw(_("Brand {0} does not have an owner").format(brand_name))

    previous_owner = brand.owner_seller
    previous_owner_name = brand.owner_seller_name

    # Clear ownership fields
    brand.owner_seller = None
    brand.owner_seller_name = None
    brand.ownership_date = None
    brand.save(ignore_permissions=True)

    return {
        "name": brand.name,
        "brand_name": brand.brand_name,
        "previous_owner": previous_owner,
        "previous_owner_name": previous_owner_name,
        "reason": reason,
        "message": _("Brand ownership revoked successfully")
    }


@frappe.whitelist()
def report_brand_misuse(brand_name, report_type, description, evidence=None):
    """
    Report brand misuse or unauthorized use.

    Creates a log entry for brand misuse reports that can be reviewed
    by administrators.

    Args:
        brand_name: Name of the brand being misused
        report_type: Type of misuse (e.g., "Counterfeit", "Unauthorized Use",
                     "Trademark Violation", "Other")
        description: Detailed description of the misuse
        evidence: Optional attachment or URL as evidence

    Returns:
        dict: Report confirmation
    """
    if not frappe.db.exists("Brand", brand_name):
        frappe.throw(_("Brand {0} not found").format(brand_name))

    if not report_type:
        frappe.throw(_("Report type is required"))

    if not description:
        frappe.throw(_("Description is required"))

    valid_report_types = [
        "Counterfeit", "Unauthorized Use", "Trademark Violation", "Other"
    ]
    if report_type not in valid_report_types:
        frappe.throw(
            _("Report type must be one of: {0}").format(
                ", ".join(valid_report_types)
            )
        )

    # Log the report using frappe's Comment system
    brand = frappe.get_doc("Brand", brand_name)
    comment_text = (
        f"Brand Misuse Report\n"
        f"Type: {report_type}\n"
        f"Description: {description}"
    )
    if evidence:
        comment_text += f"\nEvidence: {evidence}"

    brand.add_comment("Comment", comment_text)

    # Also log for admin review
    frappe.log_error(
        title=_("Brand Misuse Report: {0}").format(brand_name),
        message=(
            f"Brand: {brand_name}\n"
            f"Report Type: {report_type}\n"
            f"Description: {description}\n"
            f"Evidence: {evidence or 'N/A'}\n"
            f"Reported By: {frappe.session.user}\n"
            f"Date: {today()}"
        )
    )

    return {
        "brand_name": brand_name,
        "report_type": report_type,
        "reported_by": frappe.session.user,
        "message": _("Brand misuse report submitted successfully")
    }


@frappe.whitelist()
def get_brand_owner_dashboard(brand_name):
    """
    Get dashboard data for brand owner, including authorization statistics,
    product counts, and recent activity.

    Args:
        brand_name: Name of the brand

    Returns:
        dict: Dashboard data including stats and recent activity
    """
    brand = frappe.get_doc("Brand", brand_name)

    # Permission check: only brand owner or System Manager
    is_system_manager = "System Manager" in frappe.get_roles()
    is_owner = (
        brand.owner_seller
        and frappe.db.get_value(
            "Seller Profile", brand.owner_seller, "user"
        ) == frappe.session.user
    )

    if not is_system_manager and not is_owner:
        frappe.throw(_("Only the brand owner or System Manager can access the dashboard"))

    # Product statistics
    active_products = frappe.db.count(
        "SKU Product",
        filters={"brand": brand_name, "status": "Active"}
    )
    total_products = frappe.db.count(
        "SKU Product",
        filters={"brand": brand_name}
    )

    # Authorization statistics
    authorizations = frappe.get_all(
        "Brand Gating",
        filters={"brand": brand_name},
        fields=["authorization_status", "is_exclusive"]
    )

    auth_status_counts = {}
    exclusive_count = 0
    for auth in authorizations:
        status = auth.authorization_status
        auth_status_counts[status] = auth_status_counts.get(status, 0) + 1
        if auth.is_exclusive:
            exclusive_count += 1

    # Ownership claim statistics
    pending_claims = frappe.db.count(
        "Brand Ownership Claim",
        filters={
            "brand": brand_name,
            "status": ("in", ["Pending", "Under Review"])
        }
    )

    return {
        "brand_name": brand.brand_name,
        "verification_status": brand.verification_status,
        "owner_seller": brand.owner_seller,
        "owner_seller_name": brand.owner_seller_name,
        "ownership_date": brand.ownership_date,
        "products": {
            "active": active_products,
            "total": total_products
        },
        "authorizations": {
            "total": len(authorizations),
            "by_status": auth_status_counts,
            "approved": auth_status_counts.get("Approved", 0),
            "pending": (
                auth_status_counts.get("Pending", 0)
                + auth_status_counts.get("Under Review", 0)
            ),
            "exclusive_count": exclusive_count
        },
        "pending_ownership_claims": pending_claims
    }


@frappe.whitelist(allow_guest=True)
def get_brand_catalog(brand_name, limit=20, offset=0, category=None,
                      sort_by="modified", sort_order="desc"):
    """
    Get product catalog for a brand with filtering and sorting.

    Public-facing API for brand catalog pages with pagination,
    category filtering, and flexible sorting.

    Args:
        brand_name: Name of the brand
        limit: Number of products per page (default 20)
        offset: Pagination offset
        category: Optional category filter
        sort_by: Sort field (default "modified")
        sort_order: Sort direction - "asc" or "desc" (default "desc")

    Returns:
        dict: Catalog data with products, total count, and pagination info
    """
    if not frappe.db.exists("Brand", brand_name):
        frappe.throw(_("Brand {0} not found").format(brand_name))

    brand = frappe.db.get_value(
        "Brand", brand_name,
        ["brand_name", "enabled", "logo", "url_slug"],
        as_dict=True
    )

    if not brand.enabled:
        frappe.throw(_("Brand {0} is not available").format(brand_name))

    filters = {"brand": brand_name, "status": "Active"}

    if category:
        filters["category"] = category

    # Validate sort parameters
    allowed_sort_fields = ["modified", "product_name", "base_price", "creation"]
    if sort_by not in allowed_sort_fields:
        sort_by = "modified"

    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"

    total = frappe.db.count("SKU Product", filters=filters)
    products = frappe.get_all(
        "SKU Product",
        filters=filters,
        fields=[
            "name", "sku_code", "product_name", "base_price", "currency",
            "thumbnail", "url_slug", "seller_name", "category"
        ],
        limit_page_length=cint(limit),
        limit_start=cint(offset),
        order_by=f"{sort_by} {sort_order}"
    )

    return {
        "brand": {
            "name": brand_name,
            "brand_name": brand.brand_name,
            "logo": brand.logo,
            "url_slug": brand.url_slug
        },
        "products": products,
        "total": total,
        "limit": cint(limit),
        "offset": cint(offset),
        "has_more": (cint(offset) + cint(limit)) < total
    }
