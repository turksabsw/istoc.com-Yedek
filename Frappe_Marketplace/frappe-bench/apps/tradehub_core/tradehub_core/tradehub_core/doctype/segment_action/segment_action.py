# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


# Valid action types and their required fields
ACTION_TYPE_CONFIG = {
    "Update Field": {"requires_target": True, "requires_value": True},
    "Add Tag": {"requires_target": True, "requires_value": False},
    "Remove Tag": {"requires_target": True, "requires_value": False},
    "Send Notification": {"requires_target": True, "requires_value": False},
    "Add to Campaign": {"requires_target": True, "requires_value": False},
    "Custom": {"requires_target": False, "requires_value": False},
}


class SegmentAction(Document):
    """Segment Action child table for defining actions triggered by segment events.

    Actions are executed when segment membership changes (member added/removed)
    or when a segment is refreshed. Each action defines a trigger event, action type,
    and optional target/value configuration.
    """

    def validate(self):
        """Validate action configuration."""
        self.validate_action_config()

    def validate_action_config(self):
        """Validate that action_target and action_value are provided when required."""
        config = ACTION_TYPE_CONFIG.get(self.action_type, {})

        if config.get("requires_target") and not self.action_target:
            frappe.throw(
                _("Action Target is required for action type '{0}'").format(self.action_type)
            )

        if config.get("requires_value") and not self.action_value:
            frappe.throw(
                _("Action Value is required for action type '{0}'").format(self.action_type)
            )
