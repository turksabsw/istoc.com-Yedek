# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class MarketplacePaymentTermsTemplate(Document):
    """
    Marketplace Payment Terms Template DocType for TR-TradeHub.

    Defines payment terms templates for B2B marketplace transactions.
    Supports various term types including advance payment, net days,
    deposit-balance, COD, installment, escrow, and letter of credit.
    """

    def validate(self):
        """Validate payment terms template fields."""
        self.validate_percentages()
        self.validate_installment_fields()

    def validate_percentages(self):
        """Ensure percentage fields are within valid range."""
        if self.deposit_percentage and (self.deposit_percentage < 0 or self.deposit_percentage > 100):
            frappe.throw(_("Deposit Percentage must be between 0 and 100."))

        if self.late_penalty_rate and self.late_penalty_rate < 0:
            frappe.throw(_("Late Penalty Rate cannot be negative."))

    def validate_installment_fields(self):
        """Validate installment-specific fields when term type is Installment."""
        if self.term_type == "Installment":
            if not self.installment_count or self.installment_count < 2:
                frappe.throw(_("Installment Count must be at least 2 for Installment type."))
            if not self.installment_interval_days or self.installment_interval_days < 1:
                frappe.throw(_("Installment Interval Days must be at least 1 for Installment type."))
