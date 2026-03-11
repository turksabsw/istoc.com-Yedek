# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document
from frappe.utils import flt


class ProformaInvoiceItem(Document):
    """Proforma Invoice Item - Child table for proforma invoice line items."""

    def validate(self):
        """Calculate amount from qty and rate."""
        self.amount = flt(self.rate) * flt(self.qty)
