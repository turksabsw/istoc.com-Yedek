# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class BuyerAbuseLog(Document):
	"""
	Buyer Abuse Log DocType for TR-TradeHub.

	Tracks buyer abuse patterns such as excessive cart abandonment,
	repeated checkout timeouts, suspicious order patterns, and
	payment fraud attempts.
	"""

	def before_insert(self):
		"""Set default values before creating a new log entry."""
		if not self.flagged_at:
			self.flagged_at = now_datetime()

	def validate(self):
		"""Validate the abuse log entry."""
		self.validate_review_fields()

	def validate_review_fields(self):
		"""Ensure reviewed_by and reviewed_at are set when reviewed."""
		if self.reviewed:
			if not self.reviewed_by:
				self.reviewed_by = frappe.session.user
			if not self.reviewed_at:
				self.reviewed_at = now_datetime()
		else:
			self.reviewed_by = None
			self.reviewed_at = None
