# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SellerPaymentMethod(Document):
	"""
	Seller Payment Method DocType for TR-TradeHub.

	Stores accepted payment methods for a seller.
	"""

	def validate(self):
		"""Validate the seller payment method configuration."""
		self.validate_accepted_methods()

	def validate_accepted_methods(self):
		"""Ensure at least one accepted payment method is configured."""
		if not self.accepted_methods:
			frappe.throw(_("Please add at least one accepted payment method."))
