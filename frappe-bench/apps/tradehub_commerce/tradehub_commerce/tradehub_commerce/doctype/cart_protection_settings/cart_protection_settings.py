# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class CartProtectionSettings(Document):
    """
    Cart Protection Settings Single DocType for TR-TradeHub.

    Global configuration for cart protection, stock reservation,
    payment deadlines, and abuse detection.
    """

    def validate(self):
        """Validate settings values."""
        self.validate_positive_integers()

    def validate_positive_integers(self):
        """Ensure numeric settings are positive."""
        int_fields = [
            "checkout_reservation_minutes",
            "payment_deadline_hours",
            "max_checkout_extensions",
            "extension_minutes",
            "abandonment_threshold",
        ]
        for field in int_fields:
            value = self.get(field)
            if value is not None and value < 0:
                frappe.throw(
                    _("{0} must be a non-negative integer.").format(
                        self.meta.get_label(field)
                    )
                )
