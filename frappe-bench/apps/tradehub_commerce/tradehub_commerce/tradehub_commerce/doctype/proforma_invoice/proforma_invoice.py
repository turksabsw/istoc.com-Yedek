# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class ProformaInvoice(Document):
	"""
	Proforma Invoice DocType for TR-TradeHub.

	Represents a preliminary invoice sent by a seller to a buyer
	before goods are shipped or services are rendered.
	"""

	def validate(self):
		"""Validate proforma invoice data before saving."""
		self.validate_sub_order()
		self.calculate_totals()

	def validate_sub_order(self):
		"""Ensure sub_order is valid and fetch related fields."""
		if not self.sub_order:
			return

		sub_order_data = frappe.db.get_value(
			"Sub Order", self.sub_order,
			["marketplace_order", "seller", "buyer"],
			as_dict=True
		)
		if sub_order_data:
			self.marketplace_order = sub_order_data.marketplace_order
			if not self.seller:
				self.seller = sub_order_data.seller
			if not self.buyer:
				self.buyer = sub_order_data.buyer

		# Fetch seller name
		if self.seller:
			self.seller_name = frappe.db.get_value(
				"Seller Profile", self.seller, "seller_name"
			)

		# Fetch buyer name
		if self.buyer:
			self.buyer_name = frappe.db.get_value("User", self.buyer, "full_name")

	def calculate_totals(self):
		"""Calculate subtotal, tax_amount, and grand_total from items."""
		self.subtotal = flt(0)

		for item in self.get("items", []):
			item.amount = flt(item.qty) * flt(item.rate)
			self.subtotal += flt(item.amount)

		self.tax_amount = flt(self.tax_amount)
		self.grand_total = flt(self.subtotal) + flt(self.tax_amount)
