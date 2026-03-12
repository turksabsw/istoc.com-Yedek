# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class GradingCriterion(Document):
    """Child table for Customer Grade grading criteria.

    Each row defines a criterion with a weight, thresholds, and inversion flag.
    The sum of all criterion weights in the parent must equal 100 (tolerance 0.01).
    """

    def validate(self):
        """Validate criterion data."""
        self.validate_weight()
        self.validate_thresholds()
        self.validate_criterion_code()

    def validate_weight(self):
        """Validate that weight is a positive number not exceeding 100."""
        if self.weight is None or self.weight <= 0:
            frappe.throw(
                _("Weight for criterion {0} must be greater than 0").format(
                    self.criterion_name or self.criterion_code
                )
            )
        if self.weight > 100:
            frappe.throw(
                _("Weight for criterion {0} cannot exceed 100").format(
                    self.criterion_name or self.criterion_code
                )
            )

    def validate_thresholds(self):
        """Validate threshold values are consistent."""
        if self.is_inverted:
            # For inverted criteria (lower is better), threshold_good should be <= threshold_poor
            if self.threshold_good > self.threshold_poor:
                frappe.msgprint(
                    _("For inverted criterion {0}, Threshold Good should be less than or equal to Threshold Poor").format(
                        self.criterion_name or self.criterion_code
                    ),
                    indicator="orange",
                    alert=True,
                )
        else:
            # For normal criteria (higher is better), threshold_good should be >= threshold_poor
            if self.threshold_good < self.threshold_poor:
                frappe.msgprint(
                    _("For criterion {0}, Threshold Good should be greater than or equal to Threshold Poor").format(
                        self.criterion_name or self.criterion_code
                    ),
                    indicator="orange",
                    alert=True,
                )

    def validate_criterion_code(self):
        """Validate and auto-format criterion code to uppercase."""
        if self.criterion_code:
            import re

            cleaned = self.criterion_code.upper().replace(" ", "_")
            if not re.match(r"^[A-Z0-9_]+$", cleaned):
                frappe.throw(
                    _("Criterion code should contain only letters, numbers, and underscores")
                )
            self.criterion_code = cleaned

    @staticmethod
    def validate_weight_sum(criteria, tolerance=0.01):
        """Validate that the sum of all criterion weights equals 100.

        Args:
            criteria: List of criterion rows (child table rows with .weight attribute)
            tolerance: Acceptable deviation from 100 (default 0.01)

        Raises:
            frappe.ValidationError: If weight sum is outside tolerance
        """
        if not criteria:
            return

        total_weight = sum(float(c.weight or 0) for c in criteria)

        if abs(total_weight - 100.0) > tolerance:
            frappe.throw(
                _("Sum of criterion weights must equal 100. Current sum: {0}").format(
                    round(total_weight, 2)
                )
            )
