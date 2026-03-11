# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class CartSellerSummary(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		item_count: DF.Int
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		seller: DF.Link | None
		seller_name: DF.Data | None
		subtotal: DF.Currency
	# end: auto-generated types

	pass
