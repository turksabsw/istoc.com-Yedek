# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class SellerTierBenefit(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		benefit_name: DF.Data
		benefit_type: DF.Literal["", "Discount", "Feature Access", "Priority", "Credit", "Limit Increase", "Support", "Visibility", "Other"]
		benefit_value: DF.Data | None
		description: DF.Data | None
		is_active: DF.Check
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		sort_order: DF.Int
	# end: auto-generated types

	pass
