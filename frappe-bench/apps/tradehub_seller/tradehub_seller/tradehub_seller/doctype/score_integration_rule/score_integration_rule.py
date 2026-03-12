# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class ScoreIntegrationRule(Document):
	"""Child table DocType for score-based integration rules.

	Defines rules that trigger actions based on score thresholds
	at various system integration points.
	"""

	VALID_INTEGRATION_POINTS = [
		"Order Placement",
		"Listing Visibility",
		"Payment Processing",
		"Buybox Eligibility",
		"Commission Rate",
		"Account Status",
		"Tier Evaluation",
		"Notification Trigger",
	]

	VALID_ACTION_TYPES = [
		"Block",
		"Warn",
		"Limit",
		"Boost",
		"Discount",
		"Notify",
		"Escalate",
		"Log",
	]

	def validate(self):
		"""Validate integration rule data."""
		self.validate_integration_point()
		self.validate_action_type()
		self.validate_thresholds()

	def validate_integration_point(self):
		"""Ensure integration_point is a valid option."""
		if not self.integration_point:
			frappe.throw(_("Integration Point is required"))

		if self.integration_point not in self.VALID_INTEGRATION_POINTS:
			frappe.throw(
				_("Invalid integration point '{0}'. Must be one of: {1}").format(
					self.integration_point, ", ".join(self.VALID_INTEGRATION_POINTS)
				)
			)

	def validate_action_type(self):
		"""Ensure action_type is a valid option."""
		if not self.action_type:
			frappe.throw(_("Action Type is required"))

		if self.action_type not in self.VALID_ACTION_TYPES:
			frappe.throw(
				_("Invalid action type '{0}'. Must be one of: {1}").format(
					self.action_type, ", ".join(self.VALID_ACTION_TYPES)
				)
			)

	def validate_thresholds(self):
		"""Validate threshold min/max values are logically consistent."""
		if (
			self.score_threshold_min is not None
			and self.score_threshold_max is not None
			and self.score_threshold_min > 0
			and self.score_threshold_max > 0
			and self.score_threshold_min > self.score_threshold_max
		):
			frappe.throw(
				_("Score Threshold Min ({0}) cannot be greater than Score Threshold Max ({1})").format(
					self.score_threshold_min, self.score_threshold_max
				)
			)
