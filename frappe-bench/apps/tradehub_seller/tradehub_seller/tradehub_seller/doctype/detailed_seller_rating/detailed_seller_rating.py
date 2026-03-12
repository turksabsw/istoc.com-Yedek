# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class DetailedSellerRating(Document):
	"""Child table DocType for detailed seller ratings by category."""

	VALID_CATEGORIES = [
		"Product Accuracy",
		"Communication",
		"Shipping Speed",
		"Price Value",
	]

	def validate(self):
		"""Validate rating value and category."""
		self.validate_rating_value()
		self.validate_rating_category()
		self.validate_unique_category()

	def validate_rating_value(self):
		"""Ensure rating_value is between 1 and 5."""
		if self.rating_value is None:
			frappe.throw(_("Rating value is required"))

		if not isinstance(self.rating_value, int):
			try:
				self.rating_value = int(self.rating_value)
			except (ValueError, TypeError):
				frappe.throw(_("Rating value must be an integer"))

		if self.rating_value < 1 or self.rating_value > 5:
			frappe.throw(
				_("Rating value must be between 1 and 5, got {0}").format(self.rating_value)
			)

	def validate_rating_category(self):
		"""Ensure rating_category is a valid option."""
		if not self.rating_category:
			frappe.throw(_("Rating category is required"))

		if self.rating_category not in self.VALID_CATEGORIES:
			frappe.throw(
				_("Invalid rating category '{0}'. Must be one of: {1}").format(
					self.rating_category, ", ".join(self.VALID_CATEGORIES)
				)
			)

	def validate_unique_category(self):
		"""Ensure each category appears only once per parent document."""
		if not self.parentfield or not self.parent:
			return

		parent_doc = self.get_parent_doc()
		if not parent_doc:
			return

		categories_seen = []
		for row in parent_doc.get(self.parentfield):
			if row.name == self.name:
				continue
			if row.rating_category == self.rating_category:
				frappe.throw(
					_("Duplicate rating category '{0}'. Each category can only appear once per feedback.").format(
						self.rating_category
					)
				)
			categories_seen.append(row.rating_category)

	def get_parent_doc(self):
		"""Get the parent document for unique category validation."""
		if hasattr(self, "_parent_doc") and self._parent_doc:
			return self._parent_doc

		if self.parent and self.parenttype:
			try:
				return frappe.get_doc(self.parenttype, self.parent)
			except frappe.DoesNotExistError:
				return None
		return None
