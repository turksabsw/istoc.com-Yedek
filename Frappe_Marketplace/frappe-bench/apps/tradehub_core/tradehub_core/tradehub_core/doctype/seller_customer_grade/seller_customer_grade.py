# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import hashlib

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, now_datetime, nowdate

from tradehub_core.tradehub_core.utils.safe_math import safe_divide


# Default salt for anonymous customer ID generation
DEFAULT_SALT = "tradehub-grade-salt"


def generate_anonymous_customer_id(buyer, seller, salt=None):
    """Generate a deterministic anonymous customer ID using SHA-256.

    Creates a privacy-preserving identifier for a buyer-seller pair
    by hashing buyer:seller:salt. The same inputs always produce the
    same output, but the original buyer/seller cannot be derived from
    the hash.

    Args:
        buyer: Buyer identifier (e.g., Buyer Profile name).
        seller: Seller identifier (e.g., Seller Profile name).
        salt: Optional salt override. If not provided, reads from
            site config (customer_grade_salt) or falls back to default.

    Returns:
        str: 64-character hexadecimal SHA-256 hash.
    """
    if salt is None:
        try:
            salt = frappe.get_conf().get("customer_grade_salt", DEFAULT_SALT)
        except Exception:
            salt = DEFAULT_SALT

    raw = f"{buyer}:{seller}:{salt}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class SellerCustomerGrade(Document):
    """
    Seller Customer Grade DocType for per-seller customer grading.

    Enables sellers to view and optionally customize grades for their
    customers. Each record links a seller to a buyer via an anonymous
    customer ID (SHA-256 hash) for privacy preservation.

    Features:
    - Platform grade (A-F) computed by the scoring engine
    - Seller grade (A-F) optionally customized by the seller
    - Custom grading criteria via Grading Criterion child table
    - Order and payment statistics per buyer-seller pair
    - Anonymous customer identification via SHA-256 hashing
    """

    def before_insert(self):
        """Set default values before inserting a new record."""
        if not self.created_by:
            self.created_by = frappe.session.user
        self.created_at = now_datetime()

        if not self.calculation_date:
            self.calculation_date = nowdate()

        # Get tenant from seller if not set
        if not self.tenant and self.seller:
            self.tenant = frappe.db.get_value("Seller Profile", self.seller, "tenant")

        # Generate anonymous customer ID
        if not self.anonymous_customer_id and self.buyer and self.seller:
            self.anonymous_customer_id = generate_anonymous_customer_id(
                self.buyer, self.seller
            )

        # Set previous scores for comparison
        self._set_previous_scores()

    def validate(self):
        """Validate data before saving."""
        self._guard_system_fields()
        self.validate_seller()
        self.validate_buyer()
        self.validate_scores()
        self.validate_grades()
        self.validate_custom_criteria()
        self._ensure_anonymous_id()
        self._calculate_score_changes()
        self.updated_at = now_datetime()
        self.updated_by = frappe.session.user

    def _guard_system_fields(self):
        """Prevent modification of system-generated fields after creation."""
        if self.is_new():
            return

        system_fields = [
            "anonymous_customer_id",
            "platform_grade",
            "platform_score",
            "previous_platform_score",
            "platform_score_change",
            "previous_seller_score",
            "seller_score_change",
            "total_orders",
            "total_spend",
            "average_order_value",
            "first_order_date",
            "last_order_date",
            "order_frequency",
            "on_time_payment_rate",
            "return_rate",
            "dispute_rate",
            "cancellation_rate",
            "created_at",
            "created_by",
        ]
        for field in system_fields:
            if self.has_value_changed(field):
                frappe.throw(
                    _("Field '{0}' cannot be modified after creation").format(field),
                    frappe.PermissionError,
                )

    def on_trash(self):
        """Prevent deletion of active records."""
        if self.status == "Active":
            frappe.throw(_("Cannot delete active seller customer grade records"))

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

    def validate_scores(self):
        """Validate score values are within 0-100 range."""
        score_fields = ["platform_score", "seller_score"]

        for field in score_fields:
            value = flt(getattr(self, field, 0))
            if value < 0 or value > 100:
                frappe.throw(
                    _("{0} must be between 0 and 100").format(
                        field.replace("_", " ").title()
                    )
                )

    def validate_grades(self):
        """Validate grade values are valid letter grades."""
        valid_grades = ["A", "B", "C", "D", "E", "F"]
        for field in ["platform_grade", "seller_grade"]:
            value = getattr(self, field, None)
            if value and value not in valid_grades:
                frappe.throw(
                    _("{0} must be one of: {1}").format(
                        field.replace("_", " ").title(),
                        ", ".join(valid_grades),
                    )
                )

    def validate_custom_criteria(self):
        """Validate custom criteria weights sum to 100 when enabled."""
        if not cint(self.use_custom_criteria):
            return

        if not self.criteria:
            frappe.msgprint(
                _("Custom criteria is enabled but no criteria are defined"),
                indicator="orange",
            )
            return

        from tradehub_core.tradehub_core.doctype.grading_criterion.grading_criterion import (
            GradingCriterion,
        )

        GradingCriterion.validate_weight_sum(self.criteria, tolerance=0.01)

    def _ensure_anonymous_id(self):
        """Ensure anonymous customer ID is set."""
        if not self.anonymous_customer_id and self.buyer and self.seller:
            self.anonymous_customer_id = generate_anonymous_customer_id(
                self.buyer, self.seller
            )

    def _set_previous_scores(self):
        """Get previous scores from the most recent record for this buyer-seller pair."""
        if not self.buyer or not self.seller:
            return

        prev_record = frappe.db.get_value(
            "Seller Customer Grade",
            {
                "seller": self.seller,
                "buyer": self.buyer,
                "status": "Active",
                "name": ["!=", self.name or ""],
            },
            ["platform_score", "seller_score"],
            order_by="calculation_date desc",
        )

        if prev_record:
            self.previous_platform_score = flt(prev_record[0])
            self.previous_seller_score = flt(prev_record[1])

    def _calculate_score_changes(self):
        """Calculate score changes from previous values."""
        self.platform_score_change = round(
            flt(self.platform_score) - flt(self.previous_platform_score), 2
        )
        self.seller_score_change = round(
            flt(self.seller_score) - flt(self.previous_seller_score), 2
        )

    def update_from_platform_grade(self, customer_grade_doc):
        """Update platform grade and score from a Customer Grade document.

        Args:
            customer_grade_doc: Customer Grade document with grade and score.
        """
        self.platform_grade = customer_grade_doc.grade
        self.platform_score = flt(customer_grade_doc.overall_score)

        # If not using custom criteria, sync seller grade with platform grade
        if not cint(self.use_custom_criteria):
            self.seller_grade = customer_grade_doc.grade
            self.seller_score = flt(customer_grade_doc.overall_score)

    def update_order_stats(self, stats):
        """Update order and payment statistics.

        Args:
            stats: Dict containing order/payment statistics with keys:
                total_orders, total_spend, average_order_value,
                first_order_date, last_order_date, order_frequency,
                on_time_payment_rate, return_rate, dispute_rate,
                cancellation_rate.
        """
        self.total_orders = cint(stats.get("total_orders", 0))
        self.total_spend = flt(stats.get("total_spend", 0))
        self.average_order_value = flt(stats.get("average_order_value", 0))
        self.first_order_date = stats.get("first_order_date")
        self.last_order_date = stats.get("last_order_date")
        self.order_frequency = flt(stats.get("order_frequency", 0))
        self.on_time_payment_rate = flt(stats.get("on_time_payment_rate", 0))
        self.return_rate = flt(stats.get("return_rate", 0))
        self.dispute_rate = flt(stats.get("dispute_rate", 0))
        self.cancellation_rate = flt(stats.get("cancellation_rate", 0))

    def get_summary(self):
        """Get a summary for display.

        Returns:
            dict: Summary of the seller customer grade record.
        """
        return {
            "name": self.name,
            "seller": self.seller,
            "anonymous_customer_id": self.anonymous_customer_id,
            "platform_grade": self.platform_grade,
            "platform_score": self.platform_score,
            "seller_grade": self.seller_grade,
            "seller_score": self.seller_score,
            "use_custom_criteria": cint(self.use_custom_criteria),
            "total_orders": self.total_orders,
            "total_spend": self.total_spend,
            "average_order_value": self.average_order_value,
            "order_frequency": self.order_frequency,
            "status": self.status,
            "calculation_date": self.calculation_date,
        }
