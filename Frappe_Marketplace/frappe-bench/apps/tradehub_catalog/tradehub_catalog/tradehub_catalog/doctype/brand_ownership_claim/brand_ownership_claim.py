# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Brand Ownership Claim DocType for Trade Hub B2B Marketplace.

This module implements the Brand Ownership Claim DocType for managing brand
ownership requests by sellers. Sellers can claim ownership of brands by
providing supporting documents (trademark certificates, trade registry docs).

Key Features:
- Ownership claim workflow (Pending -> Under Review -> Approved/Rejected)
- Seller eligibility validation (Active + Verified status required)
- Single active claim per seller+brand combination
- Competing claim detection and automatic flagging
- On approval: sets Brand.owner_seller, auto-rejects competing claims
- Multi-tenant data isolation via Seller Profile's tenant (fetch_from)

Ownership Types:
- Brand Owner: Direct owner of the brand
- Licensed Manufacturer: Licensed to manufacture brand products
- Authorized Distributor: Authorized distribution rights holder
- Trademark Holder: Legal trademark registration holder
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import today


class BrandOwnershipClaim(Document):
    """
    Brand Ownership Claim DocType for managing brand ownership requests.

    Each claim represents a seller's request to be recognized as the owner
    of a brand. Claims go through a review process and, upon approval,
    update the Brand's owner_seller field.
    """

    def before_insert(self):
        """Set defaults and detect competing claims before inserting."""
        self.validate_single_active_claim()
        self.detect_competing_claims()

    def validate(self):
        """Validate claim data before saving."""
        self.validate_status_transition()
        self.validate_seller_eligibility()
        self.validate_brand()
        self.validate_tenant_consistency()

    def on_update(self):
        """Actions after claim is updated."""
        self.handle_approval()

    # =========================================================================
    # BEFORE INSERT METHODS
    # =========================================================================

    def validate_single_active_claim(self):
        """
        Ensure only one active claim exists per seller+brand combination.

        A seller cannot have multiple active (Pending or Under Review)
        claims for the same brand.
        """
        existing = frappe.db.get_value(
            "Brand Ownership Claim",
            {
                "claiming_seller": self.claiming_seller,
                "brand": self.brand,
                "status": ("in", ["Pending", "Under Review"]),
                "name": ("!=", self.name or "")
            },
            "name"
        )

        if existing:
            frappe.throw(
                _("An active ownership claim for this seller-brand combination already exists: {0}").format(
                    existing
                )
            )

    def detect_competing_claims(self):
        """
        Detect competing claims for the same brand from other sellers.

        If another seller already has an active claim for this brand,
        mark this claim as a competing claim.
        """
        competing = frappe.db.get_value(
            "Brand Ownership Claim",
            {
                "brand": self.brand,
                "status": ("in", ["Pending", "Under Review"]),
                "claiming_seller": ("!=", self.claiming_seller),
                "name": ("!=", self.name or "")
            },
            "name"
        )

        if competing:
            self.is_competing_claim = 1

            # Also flag the existing claim as competing if not already
            existing_is_competing = frappe.db.get_value(
                "Brand Ownership Claim", competing, "is_competing_claim"
            )
            if not existing_is_competing:
                frappe.db.set_value(
                    "Brand Ownership Claim", competing,
                    "is_competing_claim", 1,
                    update_modified=False
                )

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def validate_status_transition(self):
        """Validate status transitions for ownership claims."""
        if self.has_value_changed("status"):
            old_doc = self.get_doc_before_save()
            old_status = old_doc.status if old_doc else "Pending"
            new_status = self.status

            # Define valid transitions
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
                self.rejection_details = None

    def validate_seller_eligibility(self):
        """
        Validate that the claiming seller is eligible to submit ownership claims.

        Seller must have:
        - status = 'Active'
        - verification_status = 'Verified'
        """
        if not self.claiming_seller:
            frappe.throw(_("Claiming Seller is required"))

        seller_data = frappe.db.get_value(
            "Seller Profile",
            self.claiming_seller,
            ["status", "verification_status"],
            as_dict=True
        )

        if not seller_data:
            frappe.throw(_("Seller Profile not found"))

        if seller_data.status != "Active":
            frappe.throw(
                _("Only sellers with Active status can submit ownership claims. "
                  "Current status: {0}").format(seller_data.status)
            )

        if seller_data.verification_status != "Verified":
            frappe.throw(
                _("Only verified sellers can submit ownership claims. "
                  "Current verification status: {0}").format(seller_data.verification_status)
            )

    def validate_brand(self):
        """Validate Brand link exists and is valid."""
        if not self.brand:
            frappe.throw(_("Brand is required"))

        brand_exists = frappe.db.exists("Brand", self.brand)
        if not brand_exists:
            frappe.throw(_("Brand not found"))

    def validate_tenant_consistency(self):
        """
        Validate tenant isolation for the ownership claim.

        Inherits tenant from Claiming Seller's Seller Profile via fetch_from.
        Ensures the claim belongs to the user's tenant.
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
                    _("Access denied: You can only manage ownership claims in your tenant")
                )
        except ImportError:
            pass

    # =========================================================================
    # ON UPDATE METHODS
    # =========================================================================

    def handle_approval(self):
        """
        Handle actions when claim is approved.

        On approval:
        1. Set Brand.owner_seller to the claiming seller
        2. Auto-reject all competing claims for the same brand
        3. Notify previous owner (if any)
        """
        if not self.has_value_changed("status"):
            return

        if self.status != "Approved":
            return

        # 1. Update Brand's owner_seller
        brand = frappe.get_doc("Brand", self.brand)
        previous_owner = brand.owner_seller

        brand.owner_seller = self.claiming_seller
        brand.ownership_date = today()
        brand.save(ignore_permissions=True)

        # 2. Auto-reject competing claims for the same brand
        competing_claims = frappe.get_all(
            "Brand Ownership Claim",
            filters={
                "brand": self.brand,
                "status": ("in", ["Pending", "Under Review"]),
                "name": ("!=", self.name)
            },
            fields=["name"]
        )

        for claim in competing_claims:
            competing_doc = frappe.get_doc("Brand Ownership Claim", claim.name)
            competing_doc.status = "Rejected"
            competing_doc.reviewed_by = frappe.session.user
            competing_doc.review_date = today()
            competing_doc.rejection_reason = _("Another claim was approved")
            competing_doc.rejection_details = _(
                "Brand ownership was granted to another seller. "
                "Approved claim: {0}"
            ).format(self.name)
            competing_doc.flags.ignore_permissions = True
            competing_doc.save(ignore_permissions=True)

        # 3. Notify previous owner (placeholder for notification system)
        if previous_owner and previous_owner != self.claiming_seller:
            self._notify_previous_owner(previous_owner)

    def _notify_previous_owner(self, previous_owner):
        """
        Notify the previous brand owner that ownership has been transferred.

        Args:
            previous_owner: The previous owner's Seller Profile name
        """
        # Placeholder for notification system integration
        # Will be connected to email/notification when notification templates are designed
        pass


# =============================================================================
# WHITELISTED API FUNCTIONS
# =============================================================================


@frappe.whitelist()
def submit_ownership_claim(brand, claiming_seller, ownership_type="Brand Owner",
                           justification=None, trademark_certificate=None,
                           trade_registry_document=None):
    """
    Submit a new brand ownership claim.

    Args:
        brand: The Brand name
        claiming_seller: The Seller Profile name
        ownership_type: Type of ownership claim
        justification: Justification text for the claim
        trademark_certificate: Attachment for trademark certificate
        trade_registry_document: Attachment for trade registry document

    Returns:
        dict: Created claim data
    """
    # Check for existing active claim
    existing = frappe.get_all(
        "Brand Ownership Claim",
        filters={
            "brand": brand,
            "claiming_seller": claiming_seller,
            "status": ("in", ["Pending", "Under Review"])
        },
        limit=1
    )

    if existing:
        frappe.throw(
            _("An active ownership claim already exists for this brand-seller combination")
        )

    doc = frappe.new_doc("Brand Ownership Claim")
    doc.brand = brand
    doc.claiming_seller = claiming_seller
    doc.ownership_type = ownership_type

    if justification:
        doc.justification = justification
    if trademark_certificate:
        doc.trademark_certificate = trademark_certificate
    if trade_registry_document:
        doc.trade_registry_document = trade_registry_document

    doc.insert()

    return {
        "success": True,
        "name": doc.name,
        "brand": doc.brand,
        "claiming_seller": doc.claiming_seller,
        "status": doc.status,
        "is_competing_claim": doc.is_competing_claim,
        "message": _("Ownership claim submitted successfully")
    }


@frappe.whitelist()
def get_claims_for_brand(brand, include_rejected=False):
    """
    Get all ownership claims for a brand.

    Args:
        brand: The Brand name
        include_rejected: Whether to include rejected claims

    Returns:
        list: List of ownership claims for the brand
    """
    if not frappe.db.exists("Brand", brand):
        frappe.throw(_("Brand {0} not found").format(brand))

    filters = {"brand": brand}

    if not include_rejected:
        filters["status"] = ("in", ["Pending", "Under Review", "Approved"])

    claims = frappe.get_all(
        "Brand Ownership Claim",
        filters=filters,
        fields=[
            "name", "claiming_seller", "ownership_type",
            "status", "is_competing_claim", "reviewed_by",
            "review_date", "creation"
        ],
        order_by="creation desc"
    )

    return claims


@frappe.whitelist()
def review_ownership_claim(claim_name, action, rejection_reason=None,
                           rejection_details=None, admin_notes=None):
    """
    Review a brand ownership claim (approve or reject).

    Args:
        claim_name: The Brand Ownership Claim name
        action: Review action - 'Approve' or 'Reject'
        rejection_reason: Reason for rejection (required if rejecting)
        rejection_details: Detailed rejection explanation
        admin_notes: Internal admin notes

    Returns:
        dict: Updated claim data
    """
    # Check permission
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can review ownership claims"))

    if action not in ["Approve", "Reject"]:
        frappe.throw(_("Action must be 'Approve' or 'Reject'"))

    doc = frappe.get_doc("Brand Ownership Claim", claim_name)

    if doc.status not in ["Pending", "Under Review"]:
        frappe.throw(
            _("Only Pending or Under Review claims can be reviewed. Current status: {0}").format(
                doc.status
            )
        )

    if action == "Approve":
        doc.status = "Approved"
    else:
        doc.status = "Rejected"
        if rejection_reason:
            doc.rejection_reason = rejection_reason
        if rejection_details:
            doc.rejection_details = rejection_details

    if admin_notes:
        doc.admin_notes = admin_notes

    doc.save(ignore_permissions=True)

    result = {
        "success": True,
        "name": doc.name,
        "status": doc.status,
        "reviewed_by": doc.reviewed_by,
        "review_date": doc.review_date,
        "message": _("Ownership claim {0}").format(
            "approved" if action == "Approve" else "rejected"
        )
    }

    if action == "Approve":
        result["brand_owner_seller"] = doc.claiming_seller

    return result


@frappe.whitelist()
def get_my_ownership_claims(claiming_seller=None):
    """
    Get ownership claims for the current user's seller profile.

    Args:
        claiming_seller: Optional Seller Profile name. If not provided,
                         attempts to find seller profile for current user.

    Returns:
        list: List of ownership claims for the seller
    """
    if not claiming_seller:
        claiming_seller = frappe.db.get_value(
            "Seller Profile",
            {"user": frappe.session.user},
            "name"
        )

    if not claiming_seller:
        return []

    claims = frappe.get_all(
        "Brand Ownership Claim",
        filters={"claiming_seller": claiming_seller},
        fields=[
            "name", "brand", "ownership_type", "status",
            "is_competing_claim", "reviewed_by", "review_date",
            "rejection_reason", "creation"
        ],
        order_by="creation desc"
    )

    return claims


@frappe.whitelist()
def compare_competing_claims(brand):
    """
    Compare all competing ownership claims for a brand.

    Returns a summary of all active claims, including seller details,
    ownership type, and supporting document status.

    Args:
        brand: The Brand name

    Returns:
        dict: Comparison data for competing claims
    """
    # Check permission
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can compare competing claims"))

    if not frappe.db.exists("Brand", brand):
        frappe.throw(_("Brand {0} not found").format(brand))

    # Get current brand owner
    brand_data = frappe.db.get_value(
        "Brand", brand,
        ["brand_name", "owner_seller", "owner_seller_name", "ownership_date"],
        as_dict=True
    )

    # Get all active claims
    claims = frappe.get_all(
        "Brand Ownership Claim",
        filters={
            "brand": brand,
            "status": ("in", ["Pending", "Under Review"])
        },
        fields=[
            "name", "claiming_seller", "ownership_type",
            "status", "is_competing_claim", "justification",
            "trademark_certificate", "trade_registry_document",
            "creation"
        ],
        order_by="creation asc"
    )

    # Enrich with seller details
    enriched_claims = []
    for claim in claims:
        seller_data = frappe.db.get_value(
            "Seller Profile",
            claim.claiming_seller,
            ["seller_name", "company_name", "verification_status", "status"],
            as_dict=True
        )

        enriched_claims.append({
            "claim_name": claim.name,
            "claiming_seller": claim.claiming_seller,
            "seller_name": seller_data.seller_name if seller_data else None,
            "company_name": seller_data.company_name if seller_data else None,
            "seller_verification": seller_data.verification_status if seller_data else None,
            "seller_status": seller_data.status if seller_data else None,
            "ownership_type": claim.ownership_type,
            "status": claim.status,
            "has_trademark_certificate": bool(claim.trademark_certificate),
            "has_trade_registry_document": bool(claim.trade_registry_document),
            "has_justification": bool(claim.justification),
            "claim_date": claim.creation
        })

    return {
        "brand": brand,
        "brand_name": brand_data.brand_name,
        "current_owner": brand_data.owner_seller,
        "current_owner_name": brand_data.owner_seller_name,
        "ownership_date": brand_data.ownership_date,
        "total_competing_claims": len(enriched_claims),
        "claims": enriched_claims
    }
