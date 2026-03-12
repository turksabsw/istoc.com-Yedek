# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class BuyerKPIMetric(Document):
	"""Buyer KPI Metric child DocType for defining individual buyer KPI metrics."""

	def validate(self):
		"""Validate buyer KPI metric data."""
		self.validate_metric_code()
		self.validate_weight()
		self.validate_thresholds()
		self.validate_scoring()

	def validate_metric_code(self):
		"""Validate and format metric code."""
		if self.metric_code:
			import re
			# Auto-format to uppercase with underscores
			self.metric_code = self.metric_code.upper().replace(" ", "_").replace("-", "_")
			if not re.match(r'^[A-Z0-9_]+$', self.metric_code):
				frappe.throw(_("Metric code should contain only letters, numbers, and underscores"))

	def validate_weight(self):
		"""Validate weight is positive."""
		if self.weight is not None and self.weight < 0:
			frappe.throw(_("Weight cannot be negative"))

		if self.weight == 0:
			frappe.msgprint(
				_("Metric '{0}' has weight of 0 and will not contribute to the overall score").format(
					self.metric_name
				),
				indicator="orange",
				alert=True
			)

	def validate_thresholds(self):
		"""Validate threshold values based on threshold type."""
		if self.threshold_type == "Higher is Better":
			if self.critical_threshold and self.target_value:
				if self.critical_threshold >= self.target_value:
					frappe.msgprint(
						_("Warning: Critical threshold should be less than target value for 'Higher is Better' metrics"),
						indicator="orange",
						alert=True
					)

			if self.warning_threshold:
				if self.critical_threshold and self.warning_threshold <= self.critical_threshold:
					frappe.msgprint(
						_("Warning threshold should be greater than critical threshold"),
						indicator="orange",
						alert=True
					)
				if self.target_value and self.warning_threshold >= self.target_value:
					frappe.msgprint(
						_("Warning threshold should be less than target value"),
						indicator="orange",
						alert=True
					)

		elif self.threshold_type == "Lower is Better":
			if self.critical_threshold and self.target_value:
				if self.critical_threshold <= self.target_value:
					frappe.msgprint(
						_("Warning: Critical threshold should be greater than target value for 'Lower is Better' metrics"),
						indicator="orange",
						alert=True
					)

			if self.warning_threshold:
				if self.critical_threshold and self.warning_threshold >= self.critical_threshold:
					frappe.msgprint(
						_("Warning threshold should be less than critical threshold"),
						indicator="orange",
						alert=True
					)
				if self.target_value and self.warning_threshold <= self.target_value:
					frappe.msgprint(
						_("Warning threshold should be greater than target value"),
						indicator="orange",
						alert=True
					)

	def validate_scoring(self):
		"""Validate scoring settings."""
		if self.max_score is not None and self.max_score < 0:
			frappe.throw(_("Max score cannot be negative"))
