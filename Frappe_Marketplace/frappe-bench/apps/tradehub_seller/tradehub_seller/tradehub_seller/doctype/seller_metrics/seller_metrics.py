# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Seller Metrics DocType Controller

Materialized view for seller KPIs used in rule evaluation.
Includes Account Health Score (AHS) calculation and status derivation.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt

from tradehub_core.tradehub_core.utils.safe_math import safe_divide


class SellerMetrics(Document):
    """
    Controller for Seller Metrics DocType.

    Stores calculated seller KPIs for efficient rule evaluation.
    Records are created/updated by scheduled tasks.

    Includes:
    - Rate field validation and clamping
    - Account Health Score (AHS) calculation (0-1000 scale)
    - Account health status derivation from AHS thresholds
    """

    def validate(self):
        """Validate metrics data and calculate derived fields."""
        self._guard_system_fields()
        self.validate_rates()
        self.calculate_account_health_score()
        self.derive_account_health_status()

    def _guard_system_fields(self):
        """Prevent modification of system-generated fields after creation."""
        if self.is_new():
            return

        system_fields = [
            'total_orders',
            'total_sales_amount',
            'last_order_date',
            'cancellation_rate',
            'return_rate',
            'on_time_delivery_rate',
            'listing_count',
            'active_listing_count',
            'avg_rating',
            'total_reviews',
            'positive_review_rate',
            'complaint_rate',
            'active_days',
            'avg_response_time_hours',
            'repeat_customer_rate',
            # Health and defect metric fields
            'order_defect_rate',
            'late_shipment_rate',
            'valid_tracking_rate',
            'positive_feedback_pct',
            'account_health_score',
            'account_health_status',
            'defect_count',
            'dispute_rate',
            'chargeback_rate',
            'order_fulfillment_rate',
        ]
        for field in system_fields:
            if self.has_value_changed(field):
                frappe.throw(
                    _("Field '{0}' cannot be modified after creation").format(field),
                    frappe.PermissionError
                )

    def validate_rates(self):
        """Ensure rate fields are within valid ranges."""
        rate_fields = [
            "cancellation_rate",
            "return_rate",
            "on_time_delivery_rate",
            "positive_review_rate",
            "complaint_rate",
            "repeat_customer_rate",
            # New rate fields
            "order_defect_rate",
            "late_shipment_rate",
            "valid_tracking_rate",
            "positive_feedback_pct",
            "dispute_rate",
            "chargeback_rate",
            "order_fulfillment_rate",
        ]

        for field in rate_fields:
            value = self.get(field) or 0
            if value < 0:
                self.set(field, 0)
            elif value > 100:
                self.set(field, 100)

        # Validate avg_rating
        if self.avg_rating:
            if self.avg_rating < 0:
                self.avg_rating = 0
            elif self.avg_rating > 5:
                self.avg_rating = 5

        # Validate defect_count is non-negative
        if cint(self.defect_count) < 0:
            self.defect_count = 0

    def calculate_account_health_score(self):
        """
        Calculate Account Health Score (AHS) using the standard formula.

        AHS = 1000
            - (order_defect_rate × 300)
            - (late_shipment_rate × 200)
            - (cancellation_rate × 150)
            - (defect_count × 50)
            - ((100 - valid_tracking_rate) × 1.5)

        All rate fields are percentages (0-100 scale). The result is
        clamped to [0, 1000] via max(0, AHS).
        """
        ahs = 1000.0
        ahs -= flt(self.order_defect_rate) * 300
        ahs -= flt(self.late_shipment_rate) * 200
        ahs -= flt(self.cancellation_rate) * 150
        ahs -= cint(self.defect_count) * 50
        ahs -= (100 - flt(self.valid_tracking_rate)) * 1.5

        # Clamp to minimum 0
        self.account_health_score = max(0, int(round(ahs)))

    def derive_account_health_status(self):
        """
        Derive account health status from AHS thresholds.

        Thresholds:
        - 600-1000: Healthy
        - 300-599:  At Risk
        - 1-299:    Critical
        - 0:        Suspended
        """
        ahs = cint(self.account_health_score)

        if ahs >= 600:
            self.account_health_status = "Healthy"
        elif ahs >= 300:
            self.account_health_status = "At Risk"
        elif ahs >= 1:
            self.account_health_status = "Critical"
        else:
            self.account_health_status = "Suspended"
