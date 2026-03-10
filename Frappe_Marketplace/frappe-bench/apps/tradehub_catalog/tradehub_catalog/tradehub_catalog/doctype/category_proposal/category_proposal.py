# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Category Proposal DocType for Trade Hub B2B Marketplace.

This module implements the Category Proposal controller which allows sellers
to propose new product categories for admin review and approval.

Key Features:
- Permission query conditions: sellers see only their own proposals
- Validation: proposed_name length, justification length, duplicate check
- Rate-limiting: configurable daily/weekly/concurrent limits from Settings
- Seller eligibility: Active status + minimum 7-day account age
- Auto-create Product Category on approval with race condition guard
- Tenant auto-population from seller profile
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime, date_diff, getdate, add_days, get_datetime


class CategoryProposal(Document):
    """
    Category Proposal DocType controller.

    Allows sellers to propose new categories for admin approval.
    Enforces rate-limiting, seller eligibility, and auto-creates
    Product Category on approval.
    """

    def before_insert(self):
        """Actions before inserting a new category proposal."""
        self.auto_set_tenant()
        self.check_seller_eligibility()
        self.check_rate_limit()

    def validate(self):
        """Validate category proposal data before saving."""
        self.validate_proposed_name()
        self.validate_justification()
        self.validate_duplicate_proposal()
        self.validate_seller_active()

    def on_update(self):
        """Actions after proposal is updated."""
        if self.status == "Approved":
            self.set_review_info()
            self.create_category_from_proposal()
        elif self.status in ("Rejected",):
            self.set_review_info()

    # =========================================================================
    # BEFORE INSERT METHODS
    # =========================================================================

    def auto_set_tenant(self):
        """Auto-populate tenant from seller profile if not set."""
        if not self.get("tenant") and self.seller:
            tenant = frappe.db.get_value("Seller Profile", self.seller, "tenant")
            if tenant:
                self.tenant = tenant

    def check_seller_eligibility(self):
        """
        Check seller eligibility for creating proposals.

        Seller must have:
        - Active status
        - Account age >= 7 days
        """
        if not self.seller:
            return

        seller_data = frappe.db.get_value(
            "Seller Profile",
            self.seller,
            ["status", "creation"],
            as_dict=True
        )

        if not seller_data:
            frappe.throw(_("Seller Profile not found."))

        # Check active status
        if seller_data.status != "Active":
            frappe.throw(
                _("Only active sellers can submit category proposals. "
                  "Your seller account is currently '{0}'.").format(seller_data.status)
            )

        # Check account age (minimum 7 days)
        account_age = date_diff(getdate(), getdate(seller_data.creation))
        if account_age < 7:
            days_remaining = 7 - account_age
            frappe.throw(
                _("Your seller account must be at least 7 days old to submit category proposals. "
                  "Please wait {0} more day(s).").format(days_remaining)
            )

    def check_rate_limit(self):
        """
        Check rate limits for category proposals from Settings.

        Limits (configurable via TradeHub Catalog Settings):
        - Daily: max proposals per day (default: 5)
        - Weekly: max proposals per week (default: 15)
        - Concurrent pending: max unresolved proposals (default: 3)
        """
        if not self.seller:
            return

        settings = frappe.get_cached_doc("TradeHub Catalog Settings")

        # Check if rate limiting is enabled
        if not cint(settings.get("enable_proposal_rate_limit")):
            return

        max_daily = cint(settings.get("max_daily_category_proposals")) or 5
        max_weekly = cint(settings.get("max_weekly_category_proposals")) or 15
        max_pending = cint(settings.get("max_pending_proposals")) or 3

        # Check concurrent pending proposals
        pending_count = frappe.db.count(
            "Category Proposal",
            {
                "seller": self.seller,
                "status": ["in", ["Draft", "Pending Review"]]
            }
        )

        if pending_count >= max_pending:
            frappe.throw(
                _("You have reached the maximum limit of {0} pending category proposals. "
                  "Please wait for your existing proposals to be reviewed before "
                  "submitting new ones.").format(max_pending)
            )

        # Check daily limit
        today_start = getdate()
        daily_count = frappe.db.count(
            "Category Proposal",
            {
                "seller": self.seller,
                "creation": [">=", today_start]
            }
        )

        if daily_count >= max_daily:
            frappe.throw(
                _("You have reached the daily limit of {0} category proposals. "
                  "Please try again tomorrow.").format(max_daily)
            )

        # Check weekly limit
        week_start = add_days(getdate(), -7)
        weekly_count = frappe.db.count(
            "Category Proposal",
            {
                "seller": self.seller,
                "creation": [">=", week_start]
            }
        )

        if weekly_count >= max_weekly:
            frappe.throw(
                _("You have reached the weekly limit of {0} category proposals. "
                  "Please try again next week.").format(max_weekly)
            )

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def validate_proposed_name(self):
        """Validate proposed category name length and characters."""
        if not self.proposed_name:
            frappe.throw(_("Proposed Name is required"))

        proposed_name = self.proposed_name.strip()

        # Check minimum length
        if len(proposed_name) < 3:
            frappe.throw(
                _("Proposed Name must be at least 3 characters long.")
            )

        # Check maximum length
        if len(proposed_name) > 140:
            frappe.throw(
                _("Proposed Name cannot exceed 140 characters.")
            )

        # Check for invalid characters
        if any(char in proposed_name for char in ['<', '>', '"', '\\']):
            frappe.throw(_("Proposed Name contains invalid characters"))

    def validate_justification(self):
        """Validate justification text has minimum length."""
        if not self.justification:
            frappe.throw(_("Justification is required"))

        justification = self.justification.strip()

        if len(justification) < 20:
            frappe.throw(
                _("Justification must be at least 20 characters long. "
                  "Please provide a detailed reason for your category proposal.")
            )

    def validate_duplicate_proposal(self):
        """Check for duplicate proposals with the same proposed name."""
        if not self.proposed_name:
            return

        # Check for existing active proposals with the same name
        filters = {
            "proposed_name": self.proposed_name.strip(),
            "status": ["in", ["Draft", "Pending Review", "Approved"]]
        }

        # Exclude current document when updating
        if not self.is_new():
            filters["name"] = ("!=", self.name)

        existing_proposal = frappe.db.exists("Category Proposal", filters)
        if existing_proposal:
            frappe.throw(
                _("A category proposal with the name '{0}' already exists "
                  "and is currently {1}.").format(
                    self.proposed_name,
                    _("under review or approved")
                )
            )

        # Check if a Product Category with this name already exists
        existing_category = frappe.db.exists(
            "Product Category",
            {"category_name": self.proposed_name.strip()}
        )
        if existing_category:
            frappe.throw(
                _("A Product Category with the name '{0}' already exists. "
                  "Please propose a different category name.").format(
                    self.proposed_name
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
                _("Only active sellers can manage category proposals.")
            )

    # =========================================================================
    # ON UPDATE METHODS
    # =========================================================================

    def set_review_info(self):
        """Set reviewer and review_date when proposal is reviewed."""
        if self.status in ("Approved", "Rejected"):
            if not self.reviewer:
                self.reviewer = frappe.session.user
                self.db_set("reviewer", self.reviewer)

            if not self.review_date:
                self.review_date = now_datetime()
                self.db_set("review_date", self.review_date)

    def create_category_from_proposal(self):
        """
        Auto-create a Product Category when proposal is approved.

        Includes race condition guard: if created_category is already set,
        skip creation to prevent duplicates.
        """
        # Race condition guard: check if category was already created
        if self.created_category:
            return

        # Double-check from database to prevent race conditions
        db_created_category = frappe.db.get_value(
            "Category Proposal",
            self.name,
            "created_category"
        )
        if db_created_category:
            self.created_category = db_created_category
            return

        try:
            # Create new Product Category from proposal data
            new_category = frappe.get_doc({
                "doctype": "Product Category",
                "category_name": self.proposed_name.strip(),
                "parent_product_category": self.parent_category,
                "enabled": 1,
                "is_group": 0,
            })

            # Inherit tenant from the proposal if available
            if self.get("tenant"):
                new_category.tenant = self.tenant

            new_category.insert(ignore_permissions=True)

            # Update proposal with created category reference
            self.db_set("created_category", new_category.name)
            self.created_category = new_category.name

            frappe.msgprint(
                _("Product Category '{0}' has been created successfully.").format(
                    new_category.category_name
                ),
                indicator="green"
            )
        except Exception:
            frappe.log_error(
                title=_("Category Proposal - Auto-Create Error"),
                message=frappe.get_traceback()
            )
            frappe.throw(
                _("Failed to create Product Category from proposal. "
                  "Please check the error log for details.")
            )


def get_permission_query_conditions(user=None):
    """
    Return SQL conditions for Category Proposal list queries.

    System Managers see all records. Sellers see only their own proposals.
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
            return "`tabCategory Proposal`.seller = {seller}".format(
                seller=frappe.db.escape(seller)
            )

        return "1=0"
    except Exception:
        frappe.log_error("Category Proposal permission query error")
        return "1=0"


def has_permission(doc, ptype=None, user=None):
    """
    Check if user has permission to access a specific Category Proposal record.

    System Managers have full access. Sellers can only access their own proposals.

    Args:
        doc: The Category Proposal document
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
        frappe.log_error("Category Proposal has_permission error")
        return False


def remind_pending_proposals():
    """
    Daily scheduler job: remind System Managers about proposals pending >48 hours.

    Sends a system notification for each Category Proposal that has been in
    'Pending Review' status for more than 48 hours without being actioned.
    """
    threshold = add_days(getdate(), -2)

    pending_proposals = frappe.get_all(
        "Category Proposal",
        filters={
            "status": "Pending Review",
            "modified": ["<=", threshold]
        },
        fields=["name", "proposed_name", "seller", "creation"]
    )

    if not pending_proposals:
        return

    # Get all System Manager users
    system_managers = frappe.get_all(
        "Has Role",
        filters={"role": "System Manager", "parenttype": "User"},
        fields=["parent"],
        distinct=True
    )

    if not system_managers:
        return

    for proposal in pending_proposals:
        for manager in system_managers:
            try:
                frappe.sendmail(
                    recipients=[manager.parent],
                    subject=_("Category Proposal Pending Review: {0}").format(
                        proposal.proposed_name
                    ),
                    message=_(
                        "The category proposal '{0}' (ID: {1}) has been pending review "
                        "for more than 48 hours. Please review it at your earliest convenience."
                    ).format(proposal.proposed_name, proposal.name),
                    now=True
                )
            except Exception:
                frappe.log_error(
                    title=_("Category Proposal Reminder Error"),
                    message=frappe.get_traceback()
                )
