# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SegmentRuleGroup(Document):
    """Segment Rule Group child table for defining logical groupings of segment conditions.

    Each group defines a set of conditions evaluated with AND/OR logic.
    Groups are direct children of User Segment and are referenced by
    Segment Rule Condition rows via the rule_group_idx field.
    """

    def validate(self):
        """Validate rule group configuration."""
        self.validate_group_name()

    def validate_group_name(self):
        """Ensure group_name is not empty after stripping whitespace."""
        if self.group_name:
            self.group_name = self.group_name.strip()
        if not self.group_name:
            frappe.throw(_("Group Name is required"))
