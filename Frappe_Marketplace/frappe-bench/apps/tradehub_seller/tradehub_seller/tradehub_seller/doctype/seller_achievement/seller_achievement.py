# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class SellerAchievement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		achievement_name: DF.Data
		achievement_type: DF.Literal["", "Top Performer", "Fastest Delivery", "Best Rating", "Most Sales", "Customer Favorite", "High Volume", "Zero Returns", "Quick Responder", "Other"]
		achieved_date: DF.Date | None
		badge_icon: DF.Data | None
		description: DF.Data | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
	# end: auto-generated types

	pass
