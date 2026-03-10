# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Seller Custom Category DocType for Trade Hub B2B Marketplace.

This module implements the Seller Custom Category controller which allows sellers
to create custom sub-categories under marketplace (Product Category) categories.

Key Features:
- Permission query conditions: sellers see only their own records
- Uniqueness validation: name + seller + marketplace_category must be unique
- 50-category limit per seller
- Inactive marketplace category guard
- Tenant auto-population from seller profile
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

# Maximum number of custom categories a seller can create
MAX_CATEGORIES_PER_SELLER = 50


class SellerCustomCategory(Document):
    """
    Seller Custom Category DocType controller.

    Allows sellers to create custom sub-categories under marketplace categories.
    Enforces uniqueness, category limits, and marketplace category activity checks.
    """

    def before_insert(self):
        """Actions before inserting a new seller custom category."""
        self.auto_set_tenant()
        self.validate_category_limit()

    def validate(self):
        """Validate seller custom category data before saving."""
        self.validate_custom_category_name()
        self.validate_uniqueness()
        self.validate_marketplace_category_active()
        self.validate_seller_active()

    def auto_set_tenant(self):
        """Auto-populate tenant from seller profile if not set."""
        if not self.tenant and self.seller:
            tenant = frappe.db.get_value("Seller Profile", self.seller, "tenant")
            if tenant:
                self.tenant = tenant

    def validate_custom_category_name(self):
        """Validate custom category name is not empty and follows conventions."""
        if not self.custom_category_name:
            frappe.throw(_("Custom Category Name is required"))

        # Check for invalid characters
        if any(char in self.custom_category_name for char in ['<', '>', '"', '\\']):
            frappe.throw(_("Custom Category Name contains invalid characters"))

        # Check length
        if len(self.custom_category_name) > 140:
            frappe.throw(_("Custom Category Name cannot exceed 140 characters"))

    def validate_uniqueness(self):
        """Ensure custom_category_name + seller + marketplace_category is unique."""
        filters = {
            "custom_category_name": self.custom_category_name,
            "seller": self.seller,
            "marketplace_category": self.marketplace_category,
        }

        # Exclude current document when updating
        if not self.is_new():
            filters["name"] = ("!=", self.name)

        existing = frappe.db.exists("Seller Custom Category", filters)
        if existing:
            frappe.throw(
                _("A custom category with name '{0}' already exists for this seller "
                  "under the selected marketplace category.").format(
                    self.custom_category_name
                )
            )

    def validate_category_limit(self):
        """Ensure seller does not exceed the maximum number of custom categories."""
        if not self.seller:
            return

        current_count = frappe.db.count(
            "Seller Custom Category",
            {"seller": self.seller}
        )

        if current_count >= MAX_CATEGORIES_PER_SELLER:
            frappe.throw(
                _("You have reached the maximum limit of {0} custom categories per seller. "
                  "Please remove unused categories before creating new ones.").format(
                    MAX_CATEGORIES_PER_SELLER
                )
            )

    def validate_marketplace_category_active(self):
        """Ensure the linked marketplace category (Product Category) is active."""
        if not self.marketplace_category:
            return

        is_enabled = frappe.db.get_value(
            "Product Category",
            self.marketplace_category,
            "enabled"
        )

        if not cint(is_enabled):
            frappe.throw(
                _("Cannot create a custom category under inactive marketplace category '{0}'. "
                  "Please select an active marketplace category.").format(
                    self.marketplace_category
                )
            )

    def validate_seller_active(self):
        """Ensure the seller profile is active."""
        if not self.seller:
            return

        seller_status = frappe.db.get_value(
            "Seller Profile",
            self.seller,
            "status"
        )

        if seller_status and seller_status != "Active":
            frappe.throw(
                _("Only active sellers can manage custom categories.")
            )


def get_permission_query_conditions(user=None):
    """
    Return SQL conditions for Seller Custom Category list queries.

    System Managers see all records. Sellers see only their own records.
    Other users see nothing.

    Args:
        user: The user to check permissions for (defaults to current session user)

    Returns:
        str: SQL WHERE clause fragment or empty string
    """
    try:
        if not user:
            user = frappe.session.user

        if "System Manager" in frappe.get_roles(user):
            return ""

        # Seller sees only own records
        seller = frappe.db.get_value("Seller Profile", {"user": user}, "name")
        if seller:
            return "`tabSeller Custom Category`.seller = {seller}".format(
                seller=frappe.db.escape(seller)
            )

        return "1=0"
    except Exception:
        frappe.log_error("Seller Custom Category permission query error")
        return "1=0"


def has_permission(doc, ptype=None, user=None):
    """
    Check if user has permission to access a specific Seller Custom Category record.

    System Managers have full access. Sellers can only access their own records.

    Args:
        doc: The Seller Custom Category document
        ptype: Permission type (read, write, create, etc.)
        user: The user to check permissions for (defaults to current session user)

    Returns:
        bool: True if user has permission, False otherwise
    """
    try:
        if not user:
            user = frappe.session.user

        if "System Manager" in frappe.get_roles(user):
            return True

        # Check ownership via seller profile
        seller = frappe.db.get_value("Seller Profile", {"user": user}, "name")
        return doc.seller == seller
    except Exception:
        frappe.log_error("Seller Custom Category has_permission error")
        return False
