# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Seller Tag Assignment DocType Controller

Manages seller-tag relationships with manual override support,
status lifecycle, scoring, and grace period tracking.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, getdate


VALID_STATUSES = ["Active", "Warning", "Grace Period", "Expired", "Revoked", "Pending"]
VALID_SOURCES = ["Manual", "Rule", "Application", "Program"]


class SellerTagAssignment(Document):
    """
    Controller for Seller Tag Assignment DocType.

    Links sellers to tags, tracks assignment source and overrides.
    Supports 6-state status lifecycle: Active, Warning, Grace Period,
    Expired, Revoked, Pending.
    Priority: Manual > Rule
    """

    def before_insert(self):
        """Set initial values."""
        if not self.assigned_at:
            self.assigned_at = now_datetime()

        if self.source == "Manual" and not self.assigned_by:
            self.assigned_by = frappe.session.user

        if not self.status:
            self.status = "Active"

    def validate(self):
        """Validate assignment data."""
        self.check_duplicate()
        self.validate_override()
        self.validate_status()
        self.validate_grace_period()
        self.validate_revocation()

    def check_duplicate(self):
        """Check for duplicate assignments."""
        existing = frappe.db.exists(
            "Seller Tag Assignment",
            {
                "seller": self.seller,
                "tag": self.tag,
                "name": ["!=", self.name]
            }
        )
        if existing:
            frappe.throw(
                _("Tag '{0}' is already assigned to this seller").format(self.tag)
            )

    def validate_override(self):
        """Validate override state logic."""
        if self.override_state == "ForcedOff" and self.source == "Manual":
            frappe.throw(
                _("Cannot set ForcedOff override on manual assignments. "
                  "Delete the assignment instead.")
            )

        if self.override_state == "ForcedOn" and self.source == "Rule":
            # This is valid - keeps the tag even if rule no longer matches
            pass

    def validate_status(self):
        """Validate status field and transitions."""
        if self.status and self.status not in VALID_STATUSES:
            frappe.throw(
                _("Invalid status '{0}'. Must be one of: {1}").format(
                    self.status, ", ".join(VALID_STATUSES)
                )
            )

    def validate_grace_period(self):
        """Validate grace period date consistency."""
        if self.grace_period_start and self.grace_period_end:
            if getdate(self.grace_period_end) < getdate(self.grace_period_start):
                frappe.throw(
                    _("Grace Period End cannot be before Grace Period Start")
                )

        if self.status == "Grace Period":
            if not self.grace_period_start or not self.grace_period_end:
                frappe.throw(
                    _("Grace Period Start and End dates are required "
                      "when status is 'Grace Period'")
                )

    def validate_revocation(self):
        """Validate revocation fields when status is Revoked."""
        if self.status == "Revoked":
            if not self.revoked_at:
                self.revoked_at = now_datetime()
            if not self.revoked_by:
                self.revoked_by = frappe.session.user

    def on_update(self):
        """Handle assignment updates."""
        # Update tag assignment count
        self.update_tag_stats()

    def on_trash(self):
        """Handle assignment deletion."""
        # Check if forced on
        if self.override_state == "ForcedOn":
            frappe.throw(
                _("Cannot delete a ForcedOn assignment. "
                  "Set override to None first.")
            )

    def update_tag_stats(self):
        """Update statistics on the tag."""
        # This could trigger recalculation of tag statistics
        pass

    @frappe.whitelist()
    def set_override(self, override_state):
        """
        Set the override state for this assignment.

        Args:
            override_state: "None", "ForcedOn", or "ForcedOff"
        """
        if override_state not in ["None", "ForcedOn", "ForcedOff"]:
            frappe.throw(_("Invalid override state"))

        if override_state == "ForcedOff" and self.source == "Manual":
            frappe.throw(
                _("Cannot force off a manual assignment. Delete it instead.")
            )

        self.override_state = override_state
        self.save(ignore_permissions=True)

        return {"success": True, "override_state": self.override_state}

    @frappe.whitelist()
    def set_status(self, status, reason=None):
        """
        Set the status for this assignment.

        Args:
            status: One of Active, Warning, Grace Period, Expired, Revoked, Pending
            reason: Optional reason (used for revocation)
        """
        if status not in VALID_STATUSES:
            frappe.throw(
                _("Invalid status '{0}'. Must be one of: {1}").format(
                    status, ", ".join(VALID_STATUSES)
                )
            )

        self.status = status

        if status == "Revoked" and reason:
            self.revocation_reason = reason

        self.save(ignore_permissions=True)

        return {"success": True, "status": self.status}


def assign_tag_to_seller(seller, tag, source="Manual", notes=None, status="Active"):
    """
    Helper function to assign a tag to a seller.

    Args:
        seller: Seller Profile name
        tag: Seller Tag name
        source: "Manual", "Rule", "Application", or "Program"
        notes: Optional notes
        status: Initial status (default: "Active")

    Returns:
        Seller Tag Assignment document
    """
    # Check if already assigned
    existing = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller, "tag": tag},
        limit=1
    )

    if existing:
        return frappe.get_doc("Seller Tag Assignment", existing[0].name)

    doc = frappe.get_doc({
        "doctype": "Seller Tag Assignment",
        "seller": seller,
        "tag": tag,
        "source": source,
        "status": status,
        "notes": notes
    })
    doc.insert(ignore_permissions=True)

    return doc


def remove_tag_from_seller(seller, tag, force=False):
    """
    Remove a tag from a seller.

    Args:
        seller: Seller Profile name
        tag: Seller Tag name
        force: If True, remove even ForcedOn assignments

    Returns:
        True if removed, False if not found
    """
    assignment = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller, "tag": tag},
        fields=["name", "override_state"],
        limit=1
    )

    if not assignment:
        return False

    if assignment[0].override_state == "ForcedOn" and not force:
        frappe.throw(_("Cannot remove ForcedOn assignment without force=True"))

    frappe.delete_doc("Seller Tag Assignment", assignment[0].name, ignore_permissions=True)
    return True


def get_seller_tags_with_details(seller):
    """
    Get all tags for a seller with full details.

    Args:
        seller: Seller Profile name

    Returns:
        List of tag assignments with tag details
    """
    assignments = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller},
        fields=[
            "name", "tag", "source", "status", "override_state",
            "assigned_at", "expires_at", "expiry_date",
            "composite_score", "consecutive_failures"
        ]
    )

    result = []
    for assignment in assignments:
        tag = frappe.get_doc("Seller Tag", assignment.tag)
        if tag.status != "Active":
            continue

        result.append({
            "assignment_name": assignment.name,
            "tag_name": tag.tag_name,
            "tag_code": tag.tag_code,
            "tag_type": tag.tag_type,
            "badge_icon": tag.badge_icon,
            "badge_color": tag.badge_color,
            "badge_image": tag.badge_image,
            "description": tag.description,
            "source": assignment.source,
            "status": assignment.status,
            "override_state": assignment.override_state,
            "assigned_at": assignment.assigned_at,
            "expires_at": assignment.expires_at,
            "expiry_date": assignment.expiry_date,
            "composite_score": assignment.composite_score,
            "consecutive_failures": assignment.consecutive_failures
        })

    # Sort by tag display priority
    return sorted(result, key=lambda x: x.get("display_priority", 10))
