# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime, nowdate, date_diff


class BuyerFeedback(Document):
    """
    Buyer Feedback DocType for tracking seller feedback on buyers.

    Records feedback with:
    - Overall rating (1-5)
    - Payment promptness, communication quality, return reasonableness ratings (1-5)
    - Feedback text and buyer response

    Business Rules:
    - One feedback per order per seller-buyer pair
    - Seller cannot leave feedback for themselves
    """

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
        self.validate_buyer()
        self.validate_seller()
        self.validate_seller_not_buyer()
        self.validate_overall_rating()
        self.validate_buyer_ratings()
        self.validate_order_reference()
        self.validate_one_feedback_per_order()

    def _guard_system_fields(self):
        """Prevent modification of system-generated fields after creation."""
        if self.is_new():
            return

        system_fields = [
            'feedback_date',
            'created_by_user',
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

    def validate_buyer(self):
        """Validate buyer exists and is valid."""
        if not self.buyer:
            frappe.throw(_("Buyer is required"))

        if not frappe.db.exists("Buyer Profile", self.buyer):
            frappe.throw(_("Invalid buyer"))

    def validate_seller(self):
        """Validate seller exists and is valid."""
        if not self.seller:
            frappe.throw(_("Seller is required"))

        if not frappe.db.exists("Seller Profile", self.seller):
            frappe.throw(_("Invalid seller"))

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

    def validate_buyer_ratings(self):
        """Validate individual buyer ratings are between 1 and 5 when provided."""
        rating_fields = {
            "payment_promptness": "Payment Promptness",
            "communication_quality": "Communication Quality",
            "return_reasonableness": "Return Reasonableness",
        }

        for field, label in rating_fields.items():
            value = getattr(self, field, None)
            if value is not None and cint(value) != 0:
                rating = cint(value)
                if rating < 1 or rating > 5:
                    frappe.throw(
                        _("{0} rating must be between 1 and 5, got {1}").format(label, rating)
                    )
                setattr(self, field, rating)

    def validate_order_reference(self):
        """Validate order reference exists."""
        if not self.order_reference:
            frappe.throw(_("Order reference is required"))

        if self.order_reference_type and self.order_reference:
            if not frappe.db.exists(self.order_reference_type, self.order_reference):
                frappe.throw(_("Invalid order reference"))

    def validate_one_feedback_per_order(self):
        """Ensure only one feedback per order per seller-buyer pair."""
        if not self.is_new():
            return

        existing = frappe.db.exists(
            "Buyer Feedback",
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

    def withdraw(self):
        """Withdraw the feedback."""
        if self.status == "Withdrawn":
            frappe.throw(_("Feedback is already withdrawn"))

        self.status = "Withdrawn"
        self.save()
        frappe.msgprint(_("Feedback withdrawn successfully"))

    def revise(self, new_rating=None, new_text=None):
        """
        Revise the feedback.

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

    def get_summary(self):
        """Get a summary for display."""
        return {
            "name": self.name,
            "buyer": self.buyer,
            "buyer_name": self.buyer_name,
            "seller": self.seller,
            "seller_name": self.seller_name,
            "order_reference": self.order_reference,
            "feedback_type": self.feedback_type,
            "overall_rating": self.overall_rating,
            "status": self.status,
            "feedback_date": self.feedback_date,
            "has_response": bool(self.buyer_response),
            "buyer_ratings": {
                "payment_promptness": self.payment_promptness,
                "communication_quality": self.communication_quality,
                "return_reasonableness": self.return_reasonableness,
            },
        }
