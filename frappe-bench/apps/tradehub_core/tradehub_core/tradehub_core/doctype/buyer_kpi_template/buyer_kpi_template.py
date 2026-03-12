# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class BuyerKPITemplate(Document):
	"""Buyer KPI Template DocType for defining buyer KPI metrics and evaluation criteria."""

	def validate(self):
		"""Validate buyer KPI template data."""
		self.validate_template_code()
		self.validate_default_template()
		self.validate_passing_score()
		self.validate_metrics()
		self.validate_weights()
		self.calculate_total_weight()
		self.set_display_name()

	def validate_template_code(self):
		"""Validate and format template code."""
		if self.template_code:
			import re
			# Auto-format to uppercase
			self.template_code = self.template_code.upper().replace(" ", "_").replace("-", "_")
			if not re.match(r'^[A-Z0-9_]+$', self.template_code):
				frappe.throw(_("Template code should contain only letters, numbers, and underscores"))

	def validate_default_template(self):
		"""Ensure only one template is marked as default."""
		if self.is_default:
			existing_default = frappe.db.get_value(
				"Buyer KPI Template",
				{
					"is_default": 1,
					"name": ("!=", self.name)
				},
				"name"
			)
			if existing_default:
				frappe.throw(
					_("Template '{0}' is already set as default. Only one Buyer KPI Template can be default.").format(
						existing_default
					)
				)

	def validate_passing_score(self):
		"""Validate passing score is within valid range."""
		if self.passing_score is not None:
			if self.passing_score < 0 or self.passing_score > 100:
				frappe.throw(_("Passing score must be between 0 and 100"))

	def validate_metrics(self):
		"""Validate KPI metrics."""
		if not self.metrics or len(self.metrics) == 0:
			frappe.throw(_("At least one buyer KPI metric is required"))

		# Check for duplicate metric codes
		metric_codes = [m.metric_code for m in self.metrics if m.metric_code]
		if len(metric_codes) != len(set(metric_codes)):
			frappe.throw(_("Metric codes must be unique within a template"))

	def validate_weights(self):
		"""Validate that active metric weights sum to 100 (tolerance 0.01)."""
		total = sum(m.weight or 0 for m in self.metrics if m.is_active)
		if abs(total - 100) > 0.01:
			frappe.throw(
				_("Total weight of active metrics must equal 100. Current total: {0}").format(
					round(total, 2)
				)
			)

	def calculate_total_weight(self):
		"""Calculate and set total weight from metrics."""
		self.total_weight = sum(m.weight or 0 for m in self.metrics if m.is_active)

	def set_display_name(self):
		"""Set display name if not provided."""
		if not self.display_name:
			self.display_name = self.template_name

	def before_save(self):
		"""Actions before saving."""
		self.modified_at = now_datetime()
		if not self.created_at:
			self.created_at = now_datetime()

	def on_update(self):
		"""Actions after update."""
		# Clear cache for buyer KPI template lookups
		frappe.cache().delete_key("buyer_kpi_templates_list")

	def on_trash(self):
		"""Prevent deletion of default templates."""
		if self.is_default:
			frappe.throw(_("Cannot delete a default Buyer KPI Template. Remove the default flag first."))

	def get_active_metrics(self):
		"""Get list of active KPI metrics."""
		return [m for m in self.metrics if m.is_active]

	def get_metric_by_code(self, metric_code):
		"""Get a specific metric by code."""
		for m in self.metrics:
			if m.metric_code == metric_code and m.is_active:
				return m
		return None

	def update_statistics(self, score):
		"""Update template statistics after evaluation."""
		self.usage_count = (self.usage_count or 0) + 1
		self.last_evaluated_at = now_datetime()

		# Update rolling average
		if self.average_score:
			self.average_score = (self.average_score * (self.usage_count - 1) + score) / self.usage_count
		else:
			self.average_score = score

		self.db_update()

	def clone_template(self, new_name=None):
		"""
		Create an independent copy of this template.

		Args:
			new_name: Optional new name for the clone

		Returns:
			BuyerKPITemplate: The cloned template
		"""
		new_template = frappe.copy_doc(self)
		new_template.template_name = new_name or "{0} (Copy)".format(self.template_name)
		new_template.is_default = 0
		new_template.cloned_from = self.name
		new_template.usage_count = 0
		new_template.average_score = 0
		new_template.last_evaluated_at = None
		new_template.status = "Draft"
		new_template.created_at = None
		new_template.modified_at = None

		if self.template_code:
			new_template.template_code = "{0}_COPY".format(self.template_code)

		new_template.insert()
		return new_template


@frappe.whitelist()
def clone_buyer_kpi_template(template_name, new_name=None):
	"""
	Clone a Buyer KPI Template.

	Args:
		template_name: Name of the template to clone
		new_name: Optional new name for the clone

	Returns:
		str: Name of the cloned template
	"""
	if not template_name:
		frappe.throw(_("Template name is required"))

	template = frappe.get_doc("Buyer KPI Template", template_name)
	new_template = template.clone_template(new_name)
	return new_template.name
