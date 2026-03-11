# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Seller Tag DocType Controller

Manages tag definitions (badges, achievements) for sellers.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


# Mapping from legacy tag_type values to new tag_category values
TAG_TYPE_TO_CATEGORY_MAP = {
    "Achievement": "Performance",
    "Badge": "Performance",
    "Certification": "Identity",
    "Warning": "Performance",
    "Special": "Promotional",
}


class SellerTag(Document):
    """
    Controller for Seller Tag DocType.

    Tags are badges/labels that can be assigned to sellers
    either manually or automatically via rules.
    """

    def before_insert(self):
        """Set initial values."""
        if not self.created_by:
            self.created_by = frappe.session.user
        if not self.created_at:
            self.created_at = now_datetime()

    def validate(self):
        """Validate tag data."""
        self.validate_tag_code()
        self.map_tag_type_to_category()
        self.validate_tenant_global()

    def validate_tag_code(self):
        """Ensure tag code is uppercase and valid."""
        if self.tag_code:
            self.tag_code = self.tag_code.upper().replace(" ", "_")

            # Check for valid characters
            import re
            if not re.match(r'^[A-Z][A-Z0-9_]*$', self.tag_code):
                frappe.throw(
                    _("Tag Code must start with a letter and contain only "
                      "uppercase letters, numbers, and underscores.")
                )

    def map_tag_type_to_category(self):
        """Map legacy tag_type to tag_category if tag_category is not explicitly set."""
        if self.tag_type and not self.tag_category:
            mapped_category = TAG_TYPE_TO_CATEGORY_MAP.get(self.tag_type)
            if mapped_category:
                self.tag_category = mapped_category
            else:
                self.tag_category = "Performance"

    def validate_tenant_global(self):
        """Validate tenant and is_global consistency."""
        if self.is_global and self.tenant:
            frappe.msgprint(
                _("Global tags should not be assigned to a specific tenant. "
                  "Tenant will be ignored for global tags."),
                alert=True
            )

    def on_trash(self):
        """Prevent deletion if tag has assignments."""
        assignments = frappe.db.count(
            "Seller Tag Assignment",
            filters={"tag": self.name}
        )
        if assignments > 0:
            frappe.throw(
                _("Cannot delete tag with {0} existing assignments. "
                  "Remove assignments first or set status to Inactive.").format(assignments)
            )

        rules = frappe.db.count(
            "Seller Tag Rule",
            filters={"target_tag": self.name}
        )
        if rules > 0:
            frappe.throw(
                _("Cannot delete tag with {0} existing rules. "
                  "Remove rules first or set status to Inactive.").format(rules)
            )


def get_permission_query_conditions(user=None):
    """
    Return SQL conditions for Seller Tag list queries.

    System Managers see all records. Other users see global tags (is_global=1)
    and tags belonging to their current tenant. Enforces tenant isolation for
    non-global tags.

    Args:
        user (str, optional): The user to check permissions for.
            Defaults to current session user.

    Returns:
        str: SQL WHERE clause fragment (without WHERE keyword).
    """
    user = user or frappe.session.user

    # System Manager sees all
    if "System Manager" in frappe.get_roles(user):
        return ""

    # Tenant isolation: show global tags + tags for current tenant
    try:
        from tradehub_core.tradehub_core.utils.tenant import get_current_tenant
        current_tenant = get_current_tenant()
    except ImportError:
        current_tenant = None

    if current_tenant:
        escaped_tenant = frappe.db.escape(current_tenant)
        return (
            "(`tabSeller Tag`.`is_global` = 1"
            " OR `tabSeller Tag`.`tenant` = {tenant}"
            " OR `tabSeller Tag`.`tenant` IS NULL"
            " OR `tabSeller Tag`.`tenant` = '')"
        ).format(tenant=escaped_tenant)

    return ""


def get_active_tags():
    """Get all active tags for display."""
    return frappe.get_all(
        "Seller Tag",
        filters={"status": "Active"},
        fields=["name", "tag_name", "tag_code", "tag_type", "tag_category",
                "badge_icon", "badge_color", "badge_image", "display_priority"],
        order_by="display_priority asc"
    )


def get_seller_tags(seller_id):
    """
    Get all tags assigned to a seller.

    Args:
        seller_id: Seller Profile name

    Returns:
        List of tag details
    """
    assignments = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller_id},
        fields=["tag"]
    )

    if not assignments:
        return []

    tag_names = [a.tag for a in assignments]

    return frappe.get_all(
        "Seller Tag",
        filters={"name": ["in", tag_names], "status": "Active"},
        fields=["name", "tag_name", "tag_code", "tag_type", "tag_category",
                "badge_icon", "badge_color", "badge_image", "description"],
        order_by="display_priority asc"
    )
