# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


# Numeric metric fields that support comparison operators
NUMERIC_METRIC_FIELDS = [
    "total_orders", "total_sales_amount", "avg_rating",
    "avg_response_time_hours", "cancellation_rate", "return_rate",
    "on_time_delivery_rate", "complaint_rate", "listing_count",
    "active_listing_count", "active_days", "total_reviews",
    "positive_review_rate", "repeat_customer_rate", "premium_seller"
]

# Non-numeric metric fields
NON_NUMERIC_METRIC_FIELDS = [
    "last_order_date", "verification_status"
]


class SellerTagRuleCondition(Document):
    """Seller Tag Rule Condition child table for defining tag assignment rules."""

    def validate(self):
        """Validate condition data."""
        self.validate_value_requirement()
        self.validate_numeric_fields()
        self.validate_in_operator_value()
        self.validate_weight()

    def validate_value_requirement(self):
        """Validate that value is provided when required by operator."""
        operators_requiring_value = ["=", "!=", ">", "<", ">=", "<=", "contains", "not contains", "in", "not in"]
        operators_not_requiring_value = ["is set", "is not set"]

        if self.operator in operators_requiring_value and not self.value and not self.threshold_value:
            frappe.throw(
                _("Value or Threshold Value is required for operator '{0}'").format(self.operator)
            )

        if self.operator in operators_not_requiring_value and self.value:
            frappe.msgprint(
                _("Value will be ignored for operator '{0}'").format(self.operator),
                alert=True
            )

    def validate_numeric_fields(self):
        """Validate that numeric operators are used with numeric fields."""
        numeric_operators = [">", "<", ">=", "<="]

        if self.operator in numeric_operators and self.metric_field not in NUMERIC_METRIC_FIELDS:
            frappe.msgprint(
                _("Numeric operator '{0}' may not work correctly with metric field '{1}'").format(
                    self.operator, self.metric_field
                ),
                alert=True
            )

        # Validate that value is numeric for numeric fields with comparison operators
        if self.metric_field in NUMERIC_METRIC_FIELDS and self.operator in numeric_operators:
            effective_value = self.threshold_value if self.threshold_value else self.value
            if effective_value:
                try:
                    float(effective_value)
                except (ValueError, TypeError):
                    frappe.throw(
                        _("Value must be a number for metric field '{0}' with operator '{1}'").format(
                            self.metric_field, self.operator
                        )
                    )

    def validate_in_operator_value(self):
        """Validate value format for 'in' and 'not in' operators."""
        if self.operator in ["in", "not in"] and self.value:
            # Value should be comma-separated for 'in' operators
            # Just ensure it's not empty after stripping
            values = [v.strip() for v in self.value.split(",") if v.strip()]
            if not values:
                frappe.throw(
                    _("At least one value is required for operator '{0}'").format(self.operator)
                )

    def validate_weight(self):
        """Validate that weight is a positive number."""
        if self.weight is not None and self.weight < 0:
            frappe.throw(_("Weight must be a positive number"))

    def evaluate(self, context):
        """
        Evaluate this condition against the given context.

        Args:
            context (dict): Dictionary containing metric field values to evaluate against.
                           Example: {"total_orders": 100, "avg_rating": 4.5}

        Returns:
            bool: True if condition is met, False otherwise.
        """
        if not self.metric_field or not self.operator:
            return False

        actual_value = context.get(self.metric_field)

        # Handle 'is set' and 'is not set' operators
        if self.operator == "is set":
            return actual_value is not None and actual_value != ""
        elif self.operator == "is not set":
            return actual_value is None or actual_value == ""

        # If actual value is None, condition is not met (except for 'is not set')
        if actual_value is None:
            return False

        # Use threshold_value for numeric comparisons if available, otherwise fall back to value
        expected_value = self.value
        if self.metric_field in NUMERIC_METRIC_FIELDS and self.threshold_value:
            expected_value = self.threshold_value

        # Convert values for comparison
        if self.operator in [">", "<", ">=", "<="]:
            try:
                actual_value = float(actual_value) if actual_value else 0
                expected_value = float(expected_value) if expected_value else 0
            except (ValueError, TypeError):
                return False

        # Evaluate based on operator
        if self.operator == "=":
            return str(actual_value) == str(expected_value)
        elif self.operator == "!=":
            return str(actual_value) != str(expected_value)
        elif self.operator == ">":
            return actual_value > expected_value
        elif self.operator == "<":
            return actual_value < expected_value
        elif self.operator == ">=":
            return actual_value >= expected_value
        elif self.operator == "<=":
            return actual_value <= expected_value
        elif self.operator == "contains":
            return str(expected_value).lower() in str(actual_value).lower()
        elif self.operator == "not contains":
            return str(expected_value).lower() not in str(actual_value).lower()
        elif self.operator == "in":
            values = [v.strip().lower() for v in str(expected_value).split(",")]
            return str(actual_value).lower() in values
        elif self.operator == "not in":
            values = [v.strip().lower() for v in str(expected_value).split(",")]
            return str(actual_value).lower() not in values

        return False
