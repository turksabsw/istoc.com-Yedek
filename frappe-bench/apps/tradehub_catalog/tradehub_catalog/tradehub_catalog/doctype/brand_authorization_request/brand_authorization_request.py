# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Brand Authorization Request DocType for Trade Hub B2B Marketplace.

This module implements the Brand Authorization Request DocType for managing
seller requests to be authorized to sell products from specific brands.
Sellers submit authorization requests with supporting documents, which are
reviewed and either approved or rejected by administrators.

Key Features:
- Authorization request workflow (Pending -> Under Review -> Approved/Rejected)
- Seller eligibility validation (Active + Verified status required)
- Brand enabled validation
- Single active request per seller+brand combination
- Document requirements enforcement by status
- Rejection reason required on reject
- On approval: auto-creates/updates Brand Gating record with exact field mapping
- Brand Gating back-reference stored on approval
- Approved status is TERMINAL (revocation via Brand Gating directly)
- Multi-tenant data isolation via Seller Profile's tenant (fetch_from)

Authorization Types:
- Standard Reseller: Basic authorization to sell brand products
- Authorized Distributor: Verified distributor with enhanced privileges
- Exclusive Distributor: Exclusive rights in a region/category
- Official Partner: Brand-recognized official partner
- Manufacturer Direct: Direct manufacturer selling their own brand
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import today, cint


class BrandAuthorizationRequest(Document):
    """
    Brand Authorization Request DocType for managing brand authorization requests.

    Each request represents a seller's petition to be authorized to sell
    products from a specific brand. Requests go through a review process
    and, upon approval, create or update a Brand Gating record.
    """

    def before_insert(self):
        """Validate uniqueness before inserting a new request."""
        self.validate_single_active_request()

    def validate(self):
        """Validate request data before saving."""
        self.validate_status_transition()
        self.validate_seller_eligibility()
        self.validate_brand()
        self.validate_document_requirements()
        self.validate_rejection_reason()
        self.validate_tenant_consistency()

    def on_update(self):
        """Actions after request is updated."""
        self.handle_approval()

    # =========================================================================
    # BEFORE INSERT METHODS
    # =========================================================================

    def validate_single_active_request(self):
        """
        Ensure only one active request exists per seller+brand combination.

        A seller cannot have multiple active (Pending, Under Review, or Approved)
        requests for the same brand. Approved is included because it is terminal
        and revocation happens via Brand Gating directly.
        """
        existing = frappe.db.get_value(
            "Brand Authorization Request",
            {
                "requesting_seller": self.requesting_seller,
                "brand": self.brand,
                "status": ("in", ["Pending", "Under Review", "Approved"]),
                "name": ("!=", self.name or "")
            },
            "name"
        )

        if existing:
            frappe.throw(
                _("An active authorization request for this seller-brand combination "
                  "already exists: {0}").format(existing)
            )

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def validate_status_transition(self):
        """
        Validate status transitions for authorization requests.

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

            # Define valid transitions - Approved is TERMINAL
            valid_transitions = {
                "Pending": ["Under Review", "Approved", "Rejected"],
                "Under Review": ["Approved", "Rejected", "Pending"],
                "Approved": [],
                "Rejected": ["Pending"]
            }

            if new_status not in valid_transitions.get(old_status, []):
                # Allow System Manager to override
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

    def validate_seller_eligibility(self):
        """
        Validate that the requesting seller is eligible to submit authorization requests.

        Seller must have:
        - status = 'Active'
        - verification_status = 'Verified'
        """
        if not self.requesting_seller:
            frappe.throw(_("Requesting Seller is required"))

        seller_data = frappe.db.get_value(
            "Seller Profile",
            self.requesting_seller,
            ["status", "verification_status"],
            as_dict=True
        )

        if not seller_data:
            frappe.throw(_("Seller Profile not found"))

        if seller_data.status != "Active":
            frappe.throw(
                _("Only sellers with Active status can submit authorization requests. "
                  "Current status: {0}").format(seller_data.status)
            )

        if seller_data.verification_status != "Verified":
            frappe.throw(
                _("Only verified sellers can submit authorization requests. "
                  "Current verification status: {0}").format(seller_data.verification_status)
            )

    def validate_brand(self):
        """
        Validate Brand link exists and is enabled.

        Brand must exist and be enabled for authorization requests.
        """
        if not self.brand:
            frappe.throw(_("Brand is required"))

        brand_data = frappe.db.get_value(
            "Brand",
            self.brand,
            ["enabled"],
            as_dict=True
        )

        if not brand_data:
            frappe.throw(_("Brand not found"))

        if not brand_data.enabled:
            frappe.throw(
                _("Cannot create authorization request for disabled brand")
            )

    def validate_document_requirements(self):
        """
        Validate document requirements based on current status.

        When moving to Under Review or Approved, at least one supporting
        document should be attached.
        """
        if not self.has_value_changed("status"):
            return

        new_status = self.status

        if new_status in ["Under Review", "Approved"]:
            has_documents = (
                self.authorization_letter
                or self.distribution_agreement
                or self.additional_document_1
                or self.additional_document_2
            )

            if not has_documents:
                frappe.msgprint(
                    _("Warning: No supporting documents attached for this authorization request"),
                    indicator='orange',
                    alert=True
                )

    def validate_rejection_reason(self):
        """
        Validate that rejection reason is provided when rejecting.

        A rejection reason is required when status is set to Rejected.
        """
        if self.has_value_changed("status") and self.status == "Rejected":
            if not self.rejection_reason:
                frappe.throw(
                    _("Rejection reason is required when rejecting an authorization request")
                )

    def validate_tenant_consistency(self):
        """
        Validate tenant isolation for the authorization request.

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
                    _("Access denied: You can only manage authorization requests in your tenant")
                )
        except ImportError:
            pass

    # =========================================================================
    # ON UPDATE METHODS
    # =========================================================================

    def handle_approval(self):
        """
        Handle actions when authorization request is approved.

        On approval:
        1. Check for existing Brand Gating record for this brand+seller
        2. Create new or update existing Brand Gating record
        3. Set brand_gating back-reference on this request

        Field mapping (BAR → Brand Gating):
        - requesting_seller → seller
        - brand → brand
        - authorization_type → authorization_type
        - authorization_status = 'Approved'
        - authorization_letter → authorization_document (if present)
        """
        if not self.has_value_changed("status"):
            return

        if self.status != "Approved":
            return

        # Check for existing Brand Gating record for this brand+seller
        existing_gating = frappe.db.get_value(
            "Brand Gating",
            {
                "brand": self.brand,
                "seller": self.requesting_seller,
            },
            ["name", "authorization_status"],
            as_dict=True
        )

        if existing_gating:
            self._update_existing_brand_gating(existing_gating)
        else:
            self._create_brand_gating()

    def _update_existing_brand_gating(self, existing_gating):
        """
        Update an existing Brand Gating record on approval.

        Handles all 7 Brand Gating statuses:
        - Pending/Under Review/Rejected: Transition to Approved
        - Approved: Already approved, just update back-reference
        - Suspended/Expired: Reactivate to Approved
        - Revoked: Reactivate to Approved

        Args:
            existing_gating: Dict with 'name' and 'authorization_status'
        """
        gating_doc = frappe.get_doc("Brand Gating", existing_gating.name)
        old_status = gating_doc.authorization_status

        # If already Approved, just set back-reference
        if old_status == "Approved":
            self.db_set("brand_gating", gating_doc.name, update_modified=False)
            return

        # Update authorization fields
        gating_doc.authorization_type = self.authorization_type
        gating_doc.authorization_status = "Approved"

        # Copy authorization document if present
        if self.authorization_letter:
            gating_doc.authorization_document = self.authorization_letter

        gating_doc.flags.ignore_permissions = True
        gating_doc.save(ignore_permissions=True)

        # Set back-reference
        self.db_set("brand_gating", gating_doc.name, update_modified=False)

    def _create_brand_gating(self):
        """
        Create a new Brand Gating record on approval.

        Maps fields from Brand Authorization Request to Brand Gating:
        - requesting_seller → seller
        - brand → brand
        - authorization_type → authorization_type
        - authorization_status = 'Approved'
        - authorization_letter → authorization_document
        """
        gating_doc = frappe.new_doc("Brand Gating")
        gating_doc.brand = self.brand
        gating_doc.seller = self.requesting_seller
        gating_doc.authorization_type = self.authorization_type
        gating_doc.authorization_status = "Approved"

        # Copy authorization document if present
        if self.authorization_letter:
            gating_doc.authorization_document = self.authorization_letter

        gating_doc.flags.ignore_permissions = True
        gating_doc.insert(ignore_permissions=True)

        # Set back-reference
        self.db_set("brand_gating", gating_doc.name, update_modified=False)


# =============================================================================
# WHITELISTED API FUNCTIONS
# =============================================================================


@frappe.whitelist()
def get_brand_authorization_requests(brand=None, requesting_seller=None,
                                      status=None, include_rejected=False):
    """
    Get brand authorization requests with optional filters.

    Args:
        brand: Optional Brand filter
        requesting_seller: Optional Seller Profile filter
        status: Optional status filter
        include_rejected: Whether to include rejected requests

    Returns:
        list: List of authorization requests
    """
    filters = {}

    if brand:
        if not frappe.db.exists("Brand", brand):
            frappe.throw(_("Brand {0} not found").format(brand))
        filters["brand"] = brand

    if requesting_seller:
        if not frappe.db.exists("Seller Profile", requesting_seller):
            frappe.throw(_("Seller Profile {0} not found").format(requesting_seller))
        filters["requesting_seller"] = requesting_seller

    if status:
        filters["status"] = status
    elif not cint(include_rejected):
        filters["status"] = ("in", ["Pending", "Under Review", "Approved"])

    requests = frappe.get_all(
        "Brand Authorization Request",
        filters=filters,
        fields=[
            "name", "requesting_seller", "requesting_seller_name",
            "brand", "brand_name", "authorization_type",
            "status", "reviewed_by", "review_date",
            "brand_gating", "creation"
        ],
        order_by="creation desc"
    )

    return requests


@frappe.whitelist()
def review_authorization_request(request_name, action, rejection_reason=None,
                                  review_notes=None):
    """
    Review a brand authorization request (approve or reject).

    Args:
        request_name: The Brand Authorization Request name
        action: Review action - 'Approve' or 'Reject'
        rejection_reason: Reason for rejection (required if rejecting)
        review_notes: Internal review notes

    Returns:
        dict: Updated request data
    """
    # Check permission
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can review authorization requests"))

    if action not in ["Approve", "Reject"]:
        frappe.throw(_("Action must be 'Approve' or 'Reject'"))

    doc = frappe.get_doc("Brand Authorization Request", request_name)

    if doc.status not in ["Pending", "Under Review"]:
        frappe.throw(
            _("Only Pending or Under Review requests can be reviewed. "
              "Current status: {0}").format(doc.status)
        )

    if action == "Approve":
        doc.status = "Approved"
    else:
        if not rejection_reason:
            frappe.throw(_("Rejection reason is required when rejecting"))
        doc.status = "Rejected"
        doc.rejection_reason = rejection_reason

    if review_notes:
        doc.review_notes = review_notes

    doc.save(ignore_permissions=True)

    result = {
        "success": True,
        "name": doc.name,
        "status": doc.status,
        "reviewed_by": doc.reviewed_by,
        "review_date": doc.review_date,
        "message": _("Authorization request {0}").format(
            "approved" if action == "Approve" else "rejected"
        )
    }

    if action == "Approve":
        result["brand_gating"] = doc.brand_gating

    return result


@frappe.whitelist()
def get_brand_owner_dashboard(brand):
    """
    Get brand owner dashboard data including authorization requests.

    Returns summary of all authorization requests for a brand,
    including request counts by status and active authorizations.

    Args:
        brand: The Brand name

    Returns:
        dict: Dashboard data for the brand owner
    """
    if not frappe.db.exists("Brand", brand):
        frappe.throw(_("Brand {0} not found").format(brand))

    # Get brand info
    brand_data = frappe.db.get_value(
        "Brand", brand,
        ["brand_name", "owner_seller", "owner_seller_name"],
        as_dict=True
    )

    # Get authorization requests by status
    requests = frappe.get_all(
        "Brand Authorization Request",
        filters={"brand": brand},
        fields=["name", "requesting_seller", "requesting_seller_name",
                "authorization_type", "status", "creation", "review_date"]
    )

    # Count by status
    status_counts = {}
    for req in requests:
        status = req.status
        status_counts[status] = status_counts.get(status, 0) + 1

    # Get active Brand Gating records
    active_authorizations = frappe.get_all(
        "Brand Gating",
        filters={
            "brand": brand,
            "authorization_status": "Approved",
            "is_active": 1
        },
        fields=["name", "seller", "seller_name", "authorization_type",
                "authorization_date", "valid_to"]
    )

    return {
        "brand": brand,
        "brand_name": brand_data.brand_name,
        "owner_seller": brand_data.owner_seller,
        "owner_seller_name": brand_data.owner_seller_name,
        "total_requests": len(requests),
        "requests_by_status": status_counts,
        "pending_count": status_counts.get("Pending", 0) + status_counts.get("Under Review", 0),
        "approved_count": status_counts.get("Approved", 0),
        "rejected_count": status_counts.get("Rejected", 0),
        "active_authorizations": active_authorizations,
        "recent_requests": requests[:10]
    }


@frappe.whitelist()
def get_authorized_brands_for_seller(requesting_seller=None):
    """
    Get all brands a seller is authorized to sell.

    Returns approved authorization requests with their corresponding
    Brand Gating records.

    Args:
        requesting_seller: Optional Seller Profile name. If not provided,
                          attempts to find seller profile for current user.

    Returns:
        list: List of authorized brands for the seller
    """
    if not requesting_seller:
        requesting_seller = frappe.db.get_value(
            "Seller Profile",
            {"user": frappe.session.user},
            "name"
        )

    if not requesting_seller:
        return []

    # Get approved authorization requests
    approved_requests = frappe.get_all(
        "Brand Authorization Request",
        filters={
            "requesting_seller": requesting_seller,
            "status": "Approved"
        },
        fields=["name", "brand", "brand_name", "authorization_type",
                "brand_gating", "review_date"]
    )

    # Enrich with Brand Gating details
    result = []
    for req in approved_requests:
        entry = {
            "request_name": req.name,
            "brand": req.brand,
            "brand_name": req.brand_name,
            "authorization_type": req.authorization_type,
            "approved_date": req.review_date,
            "brand_gating": req.brand_gating
        }

        # Get Brand Gating status if exists
        if req.brand_gating:
            gating_data = frappe.db.get_value(
                "Brand Gating",
                req.brand_gating,
                ["authorization_status", "is_active", "valid_from",
                 "valid_to", "product_scope", "max_products",
                 "current_product_count"],
                as_dict=True
            )

            if gating_data:
                entry["gating_status"] = gating_data.authorization_status
                entry["is_active"] = gating_data.is_active
                entry["valid_from"] = gating_data.valid_from
                entry["valid_to"] = gating_data.valid_to
                entry["product_scope"] = gating_data.product_scope
                entry["max_products"] = gating_data.max_products
                entry["current_product_count"] = gating_data.current_product_count

        result.append(entry)

    # Also include direct Brand Gating records not linked to BAR
    direct_gatings = frappe.get_all(
        "Brand Gating",
        filters={
            "seller": requesting_seller,
            "authorization_status": "Approved",
            "is_active": 1,
            "name": ("not in", [r.get("brand_gating") for r in result if r.get("brand_gating")])
        },
        fields=["name", "brand", "brand_name", "authorization_type",
                "authorization_date", "valid_from", "valid_to",
                "product_scope", "max_products", "current_product_count"]
    )

    for gating in direct_gatings:
        result.append({
            "request_name": None,
            "brand": gating.brand,
            "brand_name": gating.brand_name,
            "authorization_type": gating.authorization_type,
            "approved_date": gating.authorization_date,
            "brand_gating": gating.name,
            "gating_status": "Approved",
            "is_active": 1,
            "valid_from": gating.valid_from,
            "valid_to": gating.valid_to,
            "product_scope": gating.product_scope,
            "max_products": gating.max_products,
            "current_product_count": gating.current_product_count
        })

    return result
