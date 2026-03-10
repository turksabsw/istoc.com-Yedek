# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class SellerBalanceTransaction(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		description: DF.Data | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		reference_name: DF.Data | None
		reference_type: DF.Data | None
		running_balance: DF.Currency
		transaction_date: DF.Datetime
		transaction_type: DF.Literal["", "Credit", "Debit", "Hold", "Release"]
	# end: auto-generated types

	pass
