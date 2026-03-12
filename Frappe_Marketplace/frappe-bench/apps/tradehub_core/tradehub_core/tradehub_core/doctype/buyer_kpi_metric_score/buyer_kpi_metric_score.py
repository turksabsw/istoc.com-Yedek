# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class BuyerKPIMetricScore(Document):
	"""Buyer KPI Metric Score child table for recording individual metric scores."""

	def validate(self):
		"""Validate metric score data."""
		self.validate_metric_code()
		self.validate_scores()
		self.validate_weight()
		self.calculate_weighted_score()
		self.determine_threshold_level()

	def validate_metric_code(self):
		"""Validate metric code is provided and properly formatted."""
		if not self.metric_code:
			frappe.throw(_("Metric code is required"))

		import re
		self.metric_code = self.metric_code.upper().replace(" ", "_").replace("-", "_")
		if not re.match(r'^[A-Z0-9_]+$', self.metric_code):
			frappe.throw(_("Metric code should contain only letters, numbers, and underscores"))

	def validate_scores(self):
		"""Validate score values are within valid ranges."""
		if flt(self.normalized_score) < 0 or flt(self.normalized_score) > 100:
			frappe.throw(
				_("Normalized score for '{0}' must be between 0 and 100").format(self.metric_name)
			)

		if flt(self.weighted_score) < 0:
			frappe.throw(
				_("Weighted score for '{0}' cannot be negative").format(self.metric_name)
			)

	def validate_weight(self):
		"""Validate weight is non-negative."""
		if flt(self.weight) < 0:
			frappe.throw(
				_("Weight for '{0}' cannot be negative").format(self.metric_name)
			)

	def calculate_weighted_score(self):
		"""Calculate weighted score from normalized score and weight."""
		self.weighted_score = round(flt(self.normalized_score) * flt(self.weight) / 100, 2)

	def determine_threshold_level(self):
		"""Determine threshold level based on normalized score."""
		score = flt(self.normalized_score)
		if score >= 90:
			self.threshold_level = "Excellent"
		elif score >= 70:
			self.threshold_level = "Good"
		elif score >= 50:
			self.threshold_level = "Normal"
		elif score >= 30:
			self.threshold_level = "Warning"
		else:
			self.threshold_level = "Critical"
