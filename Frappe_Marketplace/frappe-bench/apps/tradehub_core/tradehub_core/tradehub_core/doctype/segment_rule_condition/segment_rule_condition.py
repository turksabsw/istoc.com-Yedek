# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


# Operators that require a value
OPERATORS_REQUIRING_VALUE = ["=", "!=", ">", "<", ">=", "<=", "contains", "not contains", "in", "not in"]

# Operators that do not require a value
OPERATORS_NOT_REQUIRING_VALUE = ["is set", "is not set"]

# Numeric comparison operators
NUMERIC_OPERATORS = [">", "<", ">=", "<="]


class SegmentRuleCondition(Document):
    """Segment Rule Condition child table for defining individual segmentation conditions.

    Each condition is a DIRECT child of User Segment (not nested under Segment Rule Group)
    because Frappe does not support nested child tables. The rule_group_idx field
    references the idx of the parent Segment Rule Group row for logical grouping.
    """

    def validate(self):
        """Validate condition configuration."""
        self.validate_rule_group_idx()
        self.validate_value_requirement()
        self.validate_in_operator_value()
        self.validate_numeric_value()

    def validate_rule_group_idx(self):
        """Ensure rule_group_idx is a positive integer."""
        if self.rule_group_idx is not None and self.rule_group_idx < 1:
            frappe.throw(_("Rule Group Idx must be a positive integer (references idx of a Rule Group row)"))

    def validate_value_requirement(self):
        """Validate that value is provided when required by operator."""
        if self.operator in OPERATORS_REQUIRING_VALUE and not self.value:
            frappe.throw(
                _("Value is required for operator '{0}'").format(self.operator)
            )

        if self.operator in OPERATORS_NOT_REQUIRING_VALUE and self.value:
            frappe.msgprint(
                _("Value will be ignored for operator '{0}'").format(self.operator),
                alert=True
            )

    def validate_in_operator_value(self):
        """Validate value format for 'in' and 'not in' operators."""
        if self.operator in ["in", "not in"] and self.value:
            values = [v.strip() for v in self.value.split(",") if v.strip()]
            if not values:
                frappe.throw(
                    _("At least one value is required for operator '{0}'").format(self.operator)
                )

    def validate_numeric_value(self):
        """Validate that value is numeric for numeric comparison operators."""
        if self.operator in NUMERIC_OPERATORS and self.value:
            try:
                float(self.value)
            except (ValueError, TypeError):
                frappe.throw(
                    _("Value must be a number for operator '{0}'").format(self.operator)
                )

    def evaluate(self, context):
        """
        Evaluate this condition against the given context.

        Args:
            context (dict): Dictionary containing field values to evaluate against.
                           Example: {"buyer_score": 85, "return_rate": 0.05}

        Returns:
            bool: True if condition is met, False otherwise.
        """
        if not self.field_name or not self.operator:
            return False

        actual_value = context.get(self.field_name)

        # Handle 'is set' and 'is not set' operators
        if self.operator == "is set":
            return actual_value is not None and actual_value != ""
        elif self.operator == "is not set":
            return actual_value is None or actual_value == ""

        # If actual value is None, condition is not met
        if actual_value is None:
            return False

        expected_value = self.value

        # Convert values for numeric comparison
        if self.operator in NUMERIC_OPERATORS:
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
