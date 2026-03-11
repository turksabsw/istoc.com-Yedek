# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class CheckoutSellerGroup(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		discount_amount: DF.Currency
		grand_total: DF.Currency
		item_count: DF.Int
		marketplace_order: DF.Link | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		payment_method: DF.Link | None
		payment_status: DF.Literal["Pending", "Processing", "Paid", "Failed"]
		payment_terms_template: DF.Link | None
		seller: DF.Link | None
		seller_name: DF.Data | None
		shipping_amount: DF.Currency
		subtotal: DF.Currency
		tax_amount: DF.Currency
	# end: auto-generated types

	pass
