# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate, now_datetime, nowdate, add_days, date_diff
from datetime import datetime


class SellerFeedback(Document):
    """
    Seller Feedback DocType for tracking buyer feedback on sellers.

    Records feedback with:
    - Overall rating (1-5) and detailed category ratings
    - Feedback text and seller response
    - Anonymous submission option
    - DSR (Detailed Seller Rating) denormalization

    Business Rules:
    - One feedback per order per buyer-seller pair
    - 60-day submission window from order completion
    - 30-day revision window from original submission
    - Seller cannot leave feedback for themselves
    """

    # Maximum days after order completion to submit feedback
    SUBMISSION_WINDOW_DAYS = 60
    # Maximum days after original submission to revise feedback
    REVISION_WINDOW_DAYS = 30

    def before_insert(self):
        """Set default values before inserting a new feedback record."""
        if not self.created_by_user:
            self.created_by_user = frappe.session.user
        self.feedback_date = now_datetime()

        # Get tenant from seller if not set
        if not self.tenant and self.seller:
            self.tenant = frappe.db.get_value("Seller Profile", self.seller, "tenant")

        # Default status
        if not self.status:
            self.status = "Active"

    def validate(self):
        """Validate feedback data before saving."""
        self._guard_system_fields()
        self.validate_seller()
        self.validate_buyer()
        self.validate_seller_not_buyer()
        self.validate_overall_rating()
        self.validate_order_reference()
        self.validate_one_feedback_per_order()
        self.validate_submission_window()
        self.validate_revision_window()
        self.denormalize_detailed_ratings()

    def _guard_system_fields(self):
        """Prevent modification of system-generated fields after creation."""
        if self.is_new():
            return

        system_fields = [
            'feedback_date',
            'created_by_user',
            'product_accuracy_rating',
            'communication_rating',
            'shipping_speed_rating',
            'price_value_rating',
        ]
        for field in system_fields:
            if self.has_value_changed(field):
                frappe.throw(
                    _("Field '{0}' cannot be modified after creation").format(field),
                    frappe.PermissionError
                )

    def on_update(self):
        """Actions after feedback is updated."""
        # Track revision
        if not self.is_new() and (self.has_value_changed("feedback_text") or self.has_value_changed("overall_rating")):
            if self.status == "Active":
                self.db_set("revised_date", now_datetime())
                self.db_set("revised_by", frappe.session.user)

    def on_trash(self):
        """Prevent deletion of active feedback."""
        if self.status == "Active":
            frappe.throw(_("Cannot delete active feedback. Withdraw it first."))

    def validate_seller(self):
        """Validate seller exists and is valid."""
        if not self.seller:
            frappe.throw(_("Seller is required"))

        if not frappe.db.exists("Seller Profile", self.seller):
            frappe.throw(_("Invalid seller"))

    def validate_buyer(self):
        """Validate buyer exists and is valid."""
        if not self.buyer:
            frappe.throw(_("Buyer is required"))

        if not frappe.db.exists("Buyer Profile", self.buyer):
            frappe.throw(_("Invalid buyer"))

    def validate_seller_not_buyer(self):
        """Ensure seller and buyer are different entities."""
        if not self.seller or not self.buyer:
            return

        # Get the user linked to the seller profile
        seller_user = frappe.db.get_value("Seller Profile", self.seller, "user")
        # Get the user linked to the buyer profile
        buyer_user = frappe.db.get_value("Buyer Profile", self.buyer, "user")

        if seller_user and buyer_user and seller_user == buyer_user:
            frappe.throw(_("Seller cannot leave feedback for themselves"))

    def validate_overall_rating(self):
        """Validate overall rating is between 1 and 5."""
        if self.overall_rating is None:
            frappe.throw(_("Overall rating is required"))

        rating = cint(self.overall_rating)
        if rating < 1 or rating > 5:
            frappe.throw(_("Overall rating must be between 1 and 5, got {0}").format(rating))

        self.overall_rating = rating

    def validate_order_reference(self):
        """Validate order reference exists."""
        if not self.order_reference:
            frappe.throw(_("Order reference is required"))

        if self.order_reference_type and self.order_reference:
            if not frappe.db.exists(self.order_reference_type, self.order_reference):
                frappe.throw(_("Invalid order reference"))

    def validate_one_feedback_per_order(self):
        """Ensure only one feedback per order per buyer-seller pair."""
        if not self.is_new():
            return

        existing = frappe.db.exists(
            "Seller Feedback",
            {
                "seller": self.seller,
                "buyer": self.buyer,
                "order_reference": self.order_reference,
                "status": ["!=", "Withdrawn"],
                "name": ["!=", self.name or ""],
            }
        )

        if existing:
            frappe.throw(
                _("Feedback already exists for this order. Only one feedback per order is allowed.")
            )

    def validate_submission_window(self):
        """Validate feedback is within 60-day submission window."""
        if not self.is_new():
            return

        if not self.order_reference or not self.order_reference_type:
            return

        # Try to get order completion date
        order_date = self._get_order_completion_date()
        if not order_date:
            return

        today = getdate(nowdate())
        order_date = getdate(order_date)
        days_since_order = date_diff(today, order_date)

        if days_since_order > self.SUBMISSION_WINDOW_DAYS:
            frappe.throw(
                _("Feedback submission window has expired. Feedback must be submitted within {0} days of order completion. ({1} days have passed)").format(
                    self.SUBMISSION_WINDOW_DAYS, days_since_order
                )
            )

    def validate_revision_window(self):
        """Validate revision is within 30-day window from original submission."""
        if self.is_new():
            return

        if self.status != "Active":
            return

        # Check if content is being revised
        if not (self.has_value_changed("feedback_text") or
                self.has_value_changed("overall_rating") or
                self.has_value_changed("detailed_ratings")):
            return

        if not self.feedback_date:
            return

        today = getdate(nowdate())
        feedback_date = getdate(self.feedback_date)
        days_since_feedback = date_diff(today, feedback_date)

        if days_since_feedback > self.REVISION_WINDOW_DAYS:
            frappe.throw(
                _("Revision window has expired. Feedback can only be revised within {0} days of original submission. ({1} days have passed)").format(
                    self.REVISION_WINDOW_DAYS, days_since_feedback
                )
            )

    def denormalize_detailed_ratings(self):
        """Denormalize DSR category ratings to parent-level fields."""
        # Reset denormalized fields
        self.product_accuracy_rating = 0
        self.communication_rating = 0
        self.shipping_speed_rating = 0
        self.price_value_rating = 0

        # Map category names to field names
        category_field_map = {
            "Product Accuracy": "product_accuracy_rating",
            "Communication": "communication_rating",
            "Shipping Speed": "shipping_speed_rating",
            "Price Value": "price_value_rating",
        }

        if not self.detailed_ratings:
            return

        for row in self.detailed_ratings:
            field = category_field_map.get(row.rating_category)
            if field:
                setattr(self, field, cint(row.rating_value))

    def _get_order_completion_date(self):
        """Get the completion date of the referenced order."""
        if not self.order_reference or not self.order_reference_type:
            return None

        try:
            # Try common date fields for order completion
            for date_field in ["completion_date", "completed_on", "delivery_date", "modified"]:
                value = frappe.db.get_value(
                    self.order_reference_type,
                    self.order_reference,
                    date_field
                )
                if value:
                    return value
        except Exception:
            pass

        return None

    def withdraw(self):
        """Withdraw the feedback."""
        if self.status == "Withdrawn":
            frappe.throw(_("Feedback is already withdrawn"))

        self.status = "Withdrawn"
        self.save()
        frappe.msgprint(_("Feedback withdrawn successfully"))

    def revise(self, new_rating=None, new_text=None):
        """
        Revise the feedback within the revision window.

        Args:
            new_rating: New overall rating (1-5)
            new_text: New feedback text
        """
        if self.status != "Active":
            frappe.throw(_("Only active feedback can be revised"))

        if new_rating is not None:
            self.overall_rating = cint(new_rating)

        if new_text is not None:
            self.feedback_text = new_text

        self.status = "Revised"
        self.revised_date = now_datetime()
        self.revised_by = frappe.session.user
        self.save()

        frappe.msgprint(_("Feedback revised successfully"))

    def get_display_buyer(self):
        """Get buyer display info respecting anonymous flag."""
        if cint(self.is_anonymous):
            return {
                "buyer": None,
                "buyer_name": _("Anonymous Buyer"),
                "is_anonymous": True,
            }

        return {
            "buyer": self.buyer,
            "buyer_name": self.buyer_name,
            "is_anonymous": False,
        }

    def get_summary(self):
        """Get a summary for display."""
        display_buyer = self.get_display_buyer()

        return {
            "name": self.name,
            "seller": self.seller,
            "seller_name": self.seller_name,
            "buyer": display_buyer["buyer"],
            "buyer_name": display_buyer["buyer_name"],
            "is_anonymous": display_buyer["is_anonymous"],
            "order_reference": self.order_reference,
            "feedback_type": self.feedback_type,
            "overall_rating": self.overall_rating,
            "status": self.status,
            "feedback_date": self.feedback_date,
            "has_response": bool(self.seller_response),
            "detailed_ratings": {
                "product_accuracy": self.product_accuracy_rating,
                "communication": self.communication_rating,
                "shipping_speed": self.shipping_speed_rating,
                "price_value": self.price_value_rating,
            },
        }
