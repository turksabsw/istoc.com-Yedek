# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Variant Request DocType for Trade Hub B2B Marketplace.

This module implements the Variant Request DocType for managing seller requests
to create new product variants. Includes demand aggregation across sellers,
automatic Product Variant creation on approval, and bulk operations.

Key Features:
- Variant request workflow (Pending -> Under Review -> Approved/Rejected)
- Seller authorization validation (Brand Gating Approved + active + valid dates)
- Product-brand consistency validation
- Demand aggregation via normalized demand_group_key
- Turkish character transliteration in key normalization
- Auto Product Variant creation on approval with attribute mapping
- Duplicate variant detection before creation
- Demand group member linking on approval
- Bulk approve/reject operations
- Demand group approval (approve all requests in a group at once)
- Multi-tenant data isolation via Seller Profile's tenant (fetch_from)

Attribute Mapping (Variant Request -> Product Variant):
- requested_color -> color
- requested_size -> size
- requested_material -> material
- requested_packaging -> packaging
- custom_attribute_1_label/value -> attribute_1_label/value
- custom_attribute_2_label/value -> attribute_2_label/value
"""

import re
import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import today, cint, getdate, nowdate


class VariantRequest(Document):
    """
    Variant Request DocType for managing product variant requests.

    Each request represents a seller's petition to create a new product variant
    for a specific parent product. Requests are grouped by normalized attribute
    keys for demand aggregation, and approval triggers automatic Product Variant
    creation.
    """

    def before_insert(self):
        """Validate and set defaults before inserting a new request."""
        self.validate_duplicate_request()
        self.compute_demand_group_key()
        self.generate_request_title()
        self.auto_fill_brand_gating()

    def validate(self):
        """Validate request data before saving."""
        self.validate_status_transition()
        self.validate_seller_authorization()
        self.validate_product_brand_match()
        self.validate_parent_product_status()
        self.validate_at_least_one_attribute()
        self.validate_rejection_reason()
        self.validate_tenant_consistency()
        self.generate_request_title()

    def on_update(self):
        """Actions after request is updated."""
        self.compute_demand_group_key()
        self.update_demand_aggregation()
        self.handle_approval()

    # =========================================================================
    # BEFORE INSERT METHODS
    # =========================================================================

    def validate_duplicate_request(self):
        """
        Ensure no duplicate active request exists for the same seller,
        parent product, and attribute combination.

        A seller cannot have multiple active (Pending or Under Review) requests
        for the same product with the same attribute combination.
        """
        # Compute the key for this request
        key = _compute_demand_group_key(self)

        existing = frappe.db.get_value(
            "Variant Request",
            {
                "requesting_seller": self.requesting_seller,
                "demand_group_key": key,
                "status": ("in", ["Pending", "Under Review"]),
                "name": ("!=", self.name or "")
            },
            "name"
        )

        if existing:
            frappe.throw(
                _("An active variant request with the same attributes already exists "
                  "for this seller: {0}").format(existing)
            )

    def auto_fill_brand_gating(self):
        """
        Auto-fill brand_gating field from active Brand Gating record.

        Finds the active, approved Brand Gating record for this seller+brand
        combination and sets it on the request.
        """
        if not self.requesting_seller or not self.brand:
            return

        brand_gating = frappe.db.get_value(
            "Brand Gating",
            {
                "seller": self.requesting_seller,
                "brand": self.brand,
                "authorization_status": "Approved",
                "is_active": 1
            },
            "name"
        )

        if brand_gating:
            self.brand_gating = brand_gating

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def validate_status_transition(self):
        """
        Validate status transitions for variant requests.

        Valid transitions:
        - Pending -> Under Review, Approved, Rejected
        - Under Review -> Approved, Rejected, Pending
        - Approved -> (terminal, no transitions allowed)
        - Rejected -> Pending
        """
        if self.has_value_changed("status"):
            old_doc = self.get_doc_before_save()
            old_status = old_doc.status if old_doc else "Pending"
            new_status = self.status

            valid_transitions = {
                "Pending": ["Under Review", "Approved", "Rejected"],
                "Under Review": ["Approved", "Rejected", "Pending"],
                "Approved": [],
                "Rejected": ["Pending"]
            }

            if new_status not in valid_transitions.get(old_status, []):
                if "System Manager" not in frappe.get_roles():
                    frappe.throw(
                        _("Invalid status transition from {0} to {1}").format(
                            old_status, new_status
                        )
                    )

            # Set review info when status changes to Approved or Rejected
            if new_status in ["Approved", "Rejected"] and old_status not in ["Approved", "Rejected"]:
                self.reviewed_by = frappe.session.user
                self.review_date = today()

            # Clear review info when going back to Pending
            if new_status == "Pending":
                self.reviewed_by = None
                self.review_date = None
                self.rejection_reason = None

    def validate_seller_authorization(self):
        """
        Validate that the requesting seller is authorized for this brand.

        Checks:
        - Brand Gating record exists with authorization_status = 'Approved'
        - Brand Gating is_active = 1
        - Brand Gating valid dates (valid_from <= today <= valid_to)
        - System Manager bypasses all checks
        """
        # System Manager bypasses authorization check
        if "System Manager" in frappe.get_roles():
            return

        if not self.requesting_seller or not self.brand:
            return

        # Check if brand is gated at all
        gating_exists = frappe.db.exists(
            "Brand Gating",
            {"brand": self.brand}
        )

        if not gating_exists:
            # Brand is not gated, no authorization needed
            return

        # Check for active, approved Brand Gating for this seller+brand
        gating_data = frappe.db.get_value(
            "Brand Gating",
            {
                "seller": self.requesting_seller,
                "brand": self.brand,
                "authorization_status": "Approved",
                "is_active": 1
            },
            ["name", "valid_from", "valid_to"],
            as_dict=True
        )

        if not gating_data:
            frappe.throw(
                _("Seller is not authorized to request variants for brand {0}. "
                  "An approved and active Brand Gating record is required.").format(self.brand)
            )

        # Validate date range
        current_date = getdate(nowdate())

        if gating_data.valid_from and getdate(gating_data.valid_from) > current_date:
            frappe.throw(
                _("Brand authorization for {0} is not yet active. "
                  "Valid from: {1}").format(self.brand, gating_data.valid_from)
            )

        if gating_data.valid_to and getdate(gating_data.valid_to) < current_date:
            frappe.throw(
                _("Brand authorization for {0} has expired. "
                  "Valid to: {1}").format(self.brand, gating_data.valid_to)
            )

    def validate_product_brand_match(self):
        """
        Validate that the parent product's brand matches the request's brand.

        The brand field on the variant request must match the brand field
        on the parent SKU Product.
        """
        if not self.parent_product or not self.brand:
            return

        product_brand = frappe.db.get_value(
            "SKU Product",
            self.parent_product,
            "brand"
        )

        if product_brand and product_brand != self.brand:
            frappe.throw(
                _("Brand mismatch: Parent product {0} belongs to brand {1}, "
                  "but request specifies brand {2}").format(
                    self.parent_product, product_brand, self.brand
                )
            )

    def validate_parent_product_status(self):
        """
        Validate that the parent product is not archived.

        Cannot create variant requests for archived products.
        """
        if not self.parent_product:
            return

        product_status = frappe.db.get_value(
            "SKU Product",
            self.parent_product,
            "status"
        )

        if product_status == "Archive":
            frappe.throw(
                _("Cannot create variant request for archived product {0}").format(
                    self.parent_product
                )
            )

    def validate_at_least_one_attribute(self):
        """
        Validate that at least one variant attribute is specified.

        At least one of the standard attributes (color, size, material, packaging)
        or custom attributes must be provided.
        """
        has_attribute = (
            self.requested_color
            or self.requested_size
            or self.requested_material
            or self.requested_packaging
            or (self.custom_attribute_1_label and self.custom_attribute_1_value)
            or (self.custom_attribute_2_label and self.custom_attribute_2_value)
        )

        if not has_attribute:
            frappe.throw(
                _("At least one variant attribute must be specified "
                  "(color, size, material, packaging, or custom attributes)")
            )

    def validate_rejection_reason(self):
        """
        Validate that rejection reason is provided when rejecting.

        A rejection reason is required when status is set to Rejected.
        """
        if self.has_value_changed("status") and self.status == "Rejected":
            if not self.rejection_reason:
                frappe.throw(
                    _("Rejection reason is required when rejecting a variant request")
                )

    def validate_tenant_consistency(self):
        """
        Validate tenant isolation for the variant request.

        Inherits tenant from Requesting Seller's Seller Profile via fetch_from.
        Ensures the request belongs to the user's tenant.
        """
        if not self.tenant:
            return

        # System Manager can access all tenants
        if "System Manager" in frappe.get_roles():
            return

        # Get current user's tenant
        try:
            from tradehub_core.tradehub_core.utils.tenant import get_current_tenant
            current_tenant = get_current_tenant()

            if current_tenant and self.tenant != current_tenant:
                frappe.throw(
                    _("Access denied: You can only manage variant requests in your tenant")
                )
        except ImportError:
            pass

    # =========================================================================
    # REQUEST TITLE & DEMAND GROUP KEY
    # =========================================================================

    def generate_request_title(self):
        """
        Generate a descriptive request title from product and attributes.

        Format: "{product_name} - {attribute_summary}"
        """
        if not self.parent_product:
            return

        product_name = frappe.db.get_value(
            "SKU Product", self.parent_product, "product_name"
        ) or self.parent_product

        attributes = []
        if self.requested_color:
            attributes.append(self.requested_color)
        if self.requested_size:
            attributes.append(self.requested_size)
        if self.requested_material:
            attributes.append(self.requested_material)
        if self.requested_packaging:
            attributes.append(self.requested_packaging)

        if attributes:
            self.request_title = f"{product_name} - {' / '.join(attributes)}"
        else:
            # Use custom attributes if no standard attributes
            custom_parts = []
            if self.custom_attribute_1_label and self.custom_attribute_1_value:
                custom_parts.append(f"{self.custom_attribute_1_label}: {self.custom_attribute_1_value}")
            if self.custom_attribute_2_label and self.custom_attribute_2_value:
                custom_parts.append(f"{self.custom_attribute_2_label}: {self.custom_attribute_2_value}")
            if custom_parts:
                self.request_title = f"{product_name} - {' / '.join(custom_parts)}"
            else:
                self.request_title = product_name

    def compute_demand_group_key(self):
        """
        Compute the demand group key for this request.

        Uses _compute_demand_group_key() helper to create a normalized key
        from the parent product and variant attributes.
        """
        if not self.parent_product:
            return

        self.demand_group_key = _compute_demand_group_key(self)

    # =========================================================================
    # DEMAND AGGREGATION
    # =========================================================================

    def update_demand_aggregation(self):
        """
        Update demand aggregation fields across all requests in the same group.

        Recalculates demand_request_count, demand_sellers_summary, and
        demand_first_requested for all requests sharing the same demand_group_key.
        """
        if not self.demand_group_key:
            return

        # Get all requests in this demand group
        group_requests = frappe.db.get_all(
            "Variant Request",
            filters={
                "demand_group_key": self.demand_group_key,
                "status": ("in", ["Pending", "Under Review", "Approved"])
            },
            fields=["name", "requesting_seller", "creation"],
            order_by="creation asc"
        )

        if not group_requests:
            return

        # Calculate aggregation values
        request_count = len(group_requests)
        sellers = list(set(r.requesting_seller for r in group_requests))
        sellers_summary = ", ".join(sellers[:10])
        if len(sellers) > 10:
            sellers_summary += f" (+{len(sellers) - 10} more)"

        first_requested = group_requests[0].creation.date() if group_requests[0].creation else today()

        # Update all requests in the group (including this one)
        for req in group_requests:
            frappe.db.set_value(
                "Variant Request",
                req.name,
                {
                    "demand_request_count": request_count,
                    "demand_sellers_summary": sellers_summary,
                    "demand_first_requested": first_requested
                },
                update_modified=False
            )

    # =========================================================================
    # ON UPDATE — APPROVAL HANDLING
    # =========================================================================

    def handle_approval(self):
        """
        Handle actions when variant request is approved.

        On approval:
        1. Find or create a Product Variant with the requested attributes
        2. Set created_variant link on this request
        3. Link all demand group members to the same variant
        """
        if not self.has_value_changed("status"):
            return

        if self.status != "Approved":
            return

        self.create_product_variant()

    def create_product_variant(self):
        """
        Create a Product Variant from the approved variant request.

        Maps attributes from the request to the Product Variant fields:
        - requested_color -> color
        - requested_size -> size
        - requested_material -> material
        - requested_packaging -> packaging
        - custom_attribute_1_label/value -> attribute_1_label/value
        - custom_attribute_2_label/value -> attribute_2_label/value

        Checks for existing variants with the same attributes before creating.
        Links demand group members to the created/found variant.
        """
        if not self.parent_product:
            return

        log_entries = []

        # Check for existing variant with same attributes
        existing_variant = self._find_existing_variant()

        if existing_variant:
            variant_name = existing_variant
            log_entries.append(
                f"Found existing variant: {existing_variant}"
            )
        else:
            # Create new Product Variant
            try:
                variant_doc = frappe.new_doc("Product Variant")
                variant_doc.sku_product = self.parent_product

                # Map standard attributes
                variant_doc.color = self.requested_color or ""
                variant_doc.size = self.requested_size or ""
                variant_doc.material = self.requested_material or ""
                variant_doc.packaging = self.requested_packaging or ""

                # Map custom attributes
                if self.custom_attribute_1_label and self.custom_attribute_1_value:
                    variant_doc.attribute_1_label = self.custom_attribute_1_label
                    variant_doc.attribute_1_value = self.custom_attribute_1_value

                if self.custom_attribute_2_label and self.custom_attribute_2_value:
                    variant_doc.attribute_2_label = self.custom_attribute_2_label
                    variant_doc.attribute_2_value = self.custom_attribute_2_value

                variant_doc.status = "Active"
                variant_doc.flags.ignore_permissions = True
                variant_doc.insert(ignore_permissions=True)

                variant_name = variant_doc.name
                log_entries.append(
                    f"Created new variant: {variant_name}"
                )
            except Exception as e:
                log_entries.append(
                    f"Error creating variant: {str(e)}"
                )
                self.db_set("auto_creation_log", "\n".join(log_entries), update_modified=False)
                return

        # Set created_variant on this request
        self.db_set("created_variant", variant_name, update_modified=False)
        log_entries.append(f"Linked variant to request: {self.name}")

        # Link all demand group members to the same variant
        if self.demand_group_key:
            group_members = frappe.db.get_all(
                "Variant Request",
                filters={
                    "demand_group_key": self.demand_group_key,
                    "status": "Approved",
                    "name": ("!=", self.name),
                    "created_variant": ("is", "not set")
                },
                pluck="name"
            )

            for member_name in group_members:
                frappe.db.set_value(
                    "Variant Request",
                    member_name,
                    "created_variant",
                    variant_name,
                    update_modified=False
                )
                log_entries.append(f"Linked variant to group member: {member_name}")

        self.db_set("auto_creation_log", "\n".join(log_entries), update_modified=False)

    def _find_existing_variant(self):
        """
        Find an existing Product Variant with the same attributes.

        Searches for a variant under the same parent product with matching
        standard attribute values (color, size, material, packaging).

        Returns:
            str or None: Name of existing variant if found, None otherwise
        """
        filters = {
            "sku_product": self.parent_product,
            "color": self.requested_color or "",
            "size": self.requested_size or "",
            "material": self.requested_material or "",
            "packaging": self.requested_packaging or ""
        }

        existing = frappe.db.get_value(
            "Product Variant",
            filters,
            "name"
        )

        return existing


# =============================================================================
# DEMAND GROUP KEY HELPERS
# =============================================================================


def _normalize_key_part(value):
    """
    Normalize a value for demand group key.

    Steps:
    1. Strip whitespace
    2. Convert to uppercase
    3. Transliterate Turkish characters to ASCII
    4. Remove all non-alphanumeric characters

    Args:
        value: The string value to normalize

    Returns:
        str: Normalized string for use in demand group key
    """
    if not value:
        return ""

    value = value.strip().upper()

    # Turkish character transliteration
    turkish_map = {
        '\u011e': 'G', '\u00dc': 'U', '\u015e': 'S', '\u00d6': 'O',
        '\u00c7': 'C', '\u0130': 'I',
        '\u011f': 'G', '\u00fc': 'U', '\u015f': 'S', '\u00f6': 'O',
        '\u00e7': 'C', '\u0131': 'I'
    }
    for tr, en in turkish_map.items():
        value = value.replace(tr, en)

    # Remove non-alphanumeric characters
    value = re.sub(r'[^A-Z0-9]', '', value)

    return value


def _compute_demand_group_key(doc):
    """
    Compute the demand group key from parent product and attributes.

    Format: {parent_product}:C={color}|S={size}|M={material}|P={packaging}

    Uses _normalize_key_part to normalize each attribute value for
    consistent grouping across sellers with minor input variations.

    Args:
        doc: The Variant Request document

    Returns:
        str: The computed demand group key
    """
    parts = [
        f"C={_normalize_key_part(doc.requested_color)}",
        f"S={_normalize_key_part(doc.requested_size)}",
        f"M={_normalize_key_part(doc.requested_material)}",
        f"P={_normalize_key_part(doc.requested_packaging)}"
    ]
    return f"{doc.parent_product}:{('|').join(parts)}"


# =============================================================================
# WHITELISTED API FUNCTIONS
# =============================================================================


@frappe.whitelist()
def bulk_approve_variant_requests(request_names, review_notes=None):
    """
    Bulk approve multiple variant requests.

    Creates Product Variants for each approved request and links demand
    group members. Processes each request individually to handle errors
    gracefully.

    Args:
        request_names: JSON list of Variant Request names to approve
        review_notes: Optional review notes to add to all requests

    Returns:
        dict: Summary of bulk approval results
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can bulk approve variant requests"))

    if isinstance(request_names, str):
        request_names = json.loads(request_names)

    if not request_names:
        frappe.throw(_("No requests specified for bulk approval"))

    results = {
        "approved": [],
        "failed": [],
        "skipped": []
    }

    for request_name in request_names:
        try:
            doc = frappe.get_doc("Variant Request", request_name)

            if doc.status not in ["Pending", "Under Review"]:
                results["skipped"].append({
                    "name": request_name,
                    "reason": f"Status is {doc.status}, not eligible for approval"
                })
                continue

            doc.status = "Approved"
            if review_notes:
                doc.review_notes = review_notes

            doc.save(ignore_permissions=True)

            results["approved"].append({
                "name": request_name,
                "created_variant": doc.created_variant
            })
        except Exception as e:
            results["failed"].append({
                "name": request_name,
                "error": str(e)
            })

    frappe.db.commit()

    return {
        "success": True,
        "total": len(request_names),
        "approved_count": len(results["approved"]),
        "failed_count": len(results["failed"]),
        "skipped_count": len(results["skipped"]),
        "details": results
    }


@frappe.whitelist()
def bulk_reject_variant_requests(request_names, rejection_reason, review_notes=None):
    """
    Bulk reject multiple variant requests.

    Args:
        request_names: JSON list of Variant Request names to reject
        rejection_reason: Reason for rejection (required)
        review_notes: Optional review notes to add to all requests

    Returns:
        dict: Summary of bulk rejection results
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can bulk reject variant requests"))

    if isinstance(request_names, str):
        request_names = json.loads(request_names)

    if not request_names:
        frappe.throw(_("No requests specified for bulk rejection"))

    if not rejection_reason:
        frappe.throw(_("Rejection reason is required for bulk rejection"))

    results = {
        "rejected": [],
        "failed": [],
        "skipped": []
    }

    for request_name in request_names:
        try:
            doc = frappe.get_doc("Variant Request", request_name)

            if doc.status not in ["Pending", "Under Review"]:
                results["skipped"].append({
                    "name": request_name,
                    "reason": f"Status is {doc.status}, not eligible for rejection"
                })
                continue

            doc.status = "Rejected"
            doc.rejection_reason = rejection_reason
            if review_notes:
                doc.review_notes = review_notes

            doc.save(ignore_permissions=True)

            results["rejected"].append({
                "name": request_name
            })
        except Exception as e:
            results["failed"].append({
                "name": request_name,
                "error": str(e)
            })

    frappe.db.commit()

    return {
        "success": True,
        "total": len(request_names),
        "rejected_count": len(results["rejected"]),
        "failed_count": len(results["failed"]),
        "skipped_count": len(results["skipped"]),
        "details": results
    }


@frappe.whitelist()
def approve_demand_group(demand_group_key, review_notes=None):
    """
    Approve all pending/under review requests in a demand group.

    Finds all active requests with the given demand_group_key and approves
    them. A single Product Variant is created and linked to all members.

    Args:
        demand_group_key: The demand group key to approve
        review_notes: Optional review notes

    Returns:
        dict: Summary of demand group approval
    """
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can approve demand groups"))

    if not demand_group_key:
        frappe.throw(_("Demand group key is required"))

    # Get all eligible requests in the group
    group_requests = frappe.db.get_all(
        "Variant Request",
        filters={
            "demand_group_key": demand_group_key,
            "status": ("in", ["Pending", "Under Review"])
        },
        pluck="name"
    )

    if not group_requests:
        frappe.throw(
            _("No pending or under review requests found for demand group: {0}").format(
                demand_group_key
            )
        )

    # Approve all requests in the group
    result = bulk_approve_variant_requests(
        json.dumps(group_requests),
        review_notes=review_notes
    )

    result["demand_group_key"] = demand_group_key
    result["message"] = _("Demand group approved: {0} requests processed").format(
        len(group_requests)
    )

    return result


@frappe.whitelist()
def get_variant_request_summary(brand=None, parent_product=None, status=None):
    """
    Get variant request summary with optional filters.

    Args:
        brand: Optional Brand filter
        parent_product: Optional SKU Product filter
        status: Optional status filter

    Returns:
        dict: Summary with request counts, demand groups, and recent requests
    """
    filters = {}

    if brand:
        if not frappe.db.exists("Brand", brand):
            frappe.throw(_("Brand {0} not found").format(brand))
        filters["brand"] = brand

    if parent_product:
        if not frappe.db.exists("SKU Product", parent_product):
            frappe.throw(_("SKU Product {0} not found").format(parent_product))
        filters["parent_product"] = parent_product

    if status:
        filters["status"] = status

    # Get all matching requests
    requests = frappe.get_all(
        "Variant Request",
        filters=filters,
        fields=[
            "name", "requesting_seller", "brand", "parent_product",
            "request_title", "status", "demand_group_key",
            "demand_request_count", "created_variant", "creation"
        ],
        order_by="creation desc"
    )

    # Count by status
    status_counts = {}
    for req in requests:
        s = req.status
        status_counts[s] = status_counts.get(s, 0) + 1

    # Count unique demand groups
    demand_groups = set(r.demand_group_key for r in requests if r.demand_group_key)

    return {
        "total_requests": len(requests),
        "requests_by_status": status_counts,
        "pending_count": status_counts.get("Pending", 0),
        "under_review_count": status_counts.get("Under Review", 0),
        "approved_count": status_counts.get("Approved", 0),
        "rejected_count": status_counts.get("Rejected", 0),
        "unique_demand_groups": len(demand_groups),
        "recent_requests": requests[:20]
    }


@frappe.whitelist()
def get_demand_groups(brand=None, parent_product=None, min_count=1):
    """
    Get demand groups with aggregated request information.

    Returns demand groups sorted by request count (descending) for
    prioritizing which variants to create.

    Args:
        brand: Optional Brand filter
        parent_product: Optional SKU Product filter
        min_count: Minimum request count to include (default: 1)

    Returns:
        list: List of demand groups with aggregation data
    """
    min_count = cint(min_count) or 1

    filters = {
        "demand_group_key": ("is", "set"),
        "status": ("in", ["Pending", "Under Review"])
    }

    if brand:
        filters["brand"] = brand

    if parent_product:
        filters["parent_product"] = parent_product

    # Get all active requests with demand group keys
    requests = frappe.db.get_all(
        "Variant Request",
        filters=filters,
        fields=[
            "name", "requesting_seller", "brand", "parent_product",
            "request_title", "demand_group_key", "demand_request_count",
            "demand_sellers_summary", "demand_first_requested",
            "requested_color", "requested_size", "requested_material",
            "requested_packaging", "creation"
        ],
        order_by="creation asc"
    )

    # Group by demand_group_key
    groups = {}
    for req in requests:
        key = req.demand_group_key
        if key not in groups:
            groups[key] = {
                "demand_group_key": key,
                "brand": req.brand,
                "parent_product": req.parent_product,
                "request_title": req.request_title,
                "requested_color": req.requested_color,
                "requested_size": req.requested_size,
                "requested_material": req.requested_material,
                "requested_packaging": req.requested_packaging,
                "request_count": 0,
                "sellers": [],
                "first_requested": req.creation,
                "request_names": []
            }

        groups[key]["request_count"] += 1
        if req.requesting_seller not in groups[key]["sellers"]:
            groups[key]["sellers"].append(req.requesting_seller)
        groups[key]["request_names"].append(req.name)

    # Filter by min_count and sort by request_count descending
    result = [
        g for g in groups.values()
        if g["request_count"] >= min_count
    ]

    result.sort(key=lambda x: x["request_count"], reverse=True)

    # Format sellers as summary string
    for group in result:
        sellers = group["sellers"]
        if len(sellers) > 5:
            group["sellers_summary"] = ", ".join(sellers[:5]) + f" (+{len(sellers) - 5} more)"
        else:
            group["sellers_summary"] = ", ".join(sellers)
        group["unique_seller_count"] = len(sellers)

    return result
