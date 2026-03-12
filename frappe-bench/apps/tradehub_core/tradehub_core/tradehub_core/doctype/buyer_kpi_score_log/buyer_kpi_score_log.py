# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate, now_datetime, nowdate


class BuyerKPIScoreLog(Document):
	"""
	Buyer KPI Score Log DocType for tracking buyer KPI performance scores.

	Records individual KPI score calculations with:
	- Individual metric scores (via Buyer KPI Metric Score child table)
	- Raw metrics (spending, payment, returns, engagement, disputes)
	- Overall score with trend analysis and percentile ranking
	- Finalize/appeal/revise workflow
	"""

	def before_insert(self):
		"""Set default values before inserting a new score record."""
		if not self.created_by:
			self.created_by = frappe.session.user
		self.created_at = now_datetime()

		if not self.calculation_date:
			self.calculation_date = nowdate()

		# Get tenant from buyer if not set
		if not self.tenant and self.buyer:
			self.tenant = frappe.db.get_value("Buyer Profile", self.buyer, "tenant")

		# Get previous score for comparison
		self.set_previous_score()

		# Get buyer level at calculation time
		if self.buyer:
			self.buyer_level_at_calculation = frappe.db.get_value(
				"Buyer Profile", self.buyer, "buyer_level"
			)

	def validate(self):
		"""Validate score data before saving."""
		self._guard_system_fields()
		self.validate_buyer()
		self.validate_scores()
		self.validate_metric_scores()
		self.calculate_overall_score()
		self.calculate_score_change()
		self.determine_trend()
		self.determine_grade()
		self.determine_passing_status()
		self.calculate_metric_summary()

	def _guard_system_fields(self):
		"""Prevent modification of system-generated fields after creation."""
		if self.is_new():
			return
		# Allow programmatic lifecycle transitions (finalize, appeal, revise)
		if self.flags.get("ignore_guard"):
			return

		system_fields = [
			'previous_score',
			'score_change',
			'score_trend',
			'percentile_rank',
			'grade',
			'passing_status',
			'buyer_level_at_calculation',
			'total_weighted_score',
			'metrics_evaluated',
			'metrics_passing',
			'metrics_warning',
			'metrics_critical',
			'highest_metric',
			'lowest_metric',
			'created_at',
			'created_by',
			'finalized_at',
			'finalized_by',
		]
		for field in system_fields:
			if self.has_value_changed(field):
				frappe.throw(
					_("Field '{0}' cannot be modified after creation").format(field),
					frappe.PermissionError
				)

	def on_update(self):
		"""Actions after score is updated."""
		if self.status == "Finalized":
			self.update_buyer_score()

	def on_trash(self):
		"""Prevent deletion of finalized scores."""
		if self.status == "Finalized":
			frappe.throw(_("Cannot delete finalized KPI score records"))

	def validate_buyer(self):
		"""Validate buyer exists and is valid."""
		if not self.buyer:
			frappe.throw(_("Buyer is required"))

		if not frappe.db.exists("Buyer Profile", self.buyer):
			frappe.throw(_("Invalid buyer"))

	def validate_scores(self):
		"""Validate all score values are within valid ranges."""
		score_fields = ["overall_score"]

		for field in score_fields:
			value = flt(getattr(self, field, 0))
			if value < 0 or value > 100:
				frappe.throw(_("{0} must be between 0 and 100").format(
					field.replace("_", " ").title()
				))

		# Validate non-negative integers
		int_fields = [
			"order_count", "period_order_count", "return_count",
			"cancellation_count", "late_payment_count", "total_payment_count",
			"feedback_count", "dispute_count", "resolved_dispute_count",
			"open_dispute_count", "account_age_days", "last_activity_days",
			"metrics_evaluated", "metrics_passing", "metrics_warning",
			"metrics_critical"
		]

		for field in int_fields:
			if cint(getattr(self, field, 0)) < 0:
				frappe.throw(_("{0} cannot be negative").format(
					field.replace("_", " ").title()
				))

		# Validate percentage fields
		percentage_fields = [
			"payment_on_time_rate", "return_rate", "cancellation_rate",
			"feedback_rate", "dispute_rate"
		]

		for field in percentage_fields:
			value = flt(getattr(self, field, 0))
			if value < 0 or value > 100:
				frappe.throw(_("{0} must be between 0 and 100").format(
					field.replace("_", " ").title()
				))

	def validate_metric_scores(self):
		"""Validate individual metric scores in child table."""
		if not self.metric_scores:
			return

		# Check for duplicate metric codes
		metric_codes = [m.metric_code for m in self.metric_scores if m.metric_code]
		if len(metric_codes) != len(set(metric_codes)):
			frappe.throw(_("Duplicate metric codes found in metric scores"))

	def set_previous_score(self):
		"""Get the previous score for comparison."""
		if not self.buyer:
			return

		# Find the most recent finalized score for this buyer
		prev_score = frappe.db.get_value(
			"Buyer KPI Score Log",
			{
				"buyer": self.buyer,
				"status": "Finalized",
				"name": ["!=", self.name or ""],
				"calculation_date": ["<", self.calculation_date or nowdate()]
			},
			"overall_score",
			order_by="calculation_date desc"
		)

		if prev_score:
			self.previous_score = flt(prev_score)

	def calculate_overall_score(self):
		"""Calculate the overall score from metric scores and adjustments."""
		if self.metric_scores:
			# Sum weighted scores from child table
			total_weighted = sum(flt(m.weighted_score) for m in self.metric_scores)
			self.total_weighted_score = round(total_weighted, 2)

			base_score = total_weighted
		else:
			base_score = flt(self.total_weighted_score)

		# Apply bonuses and penalties
		final_score = base_score + flt(self.bonus_points) - flt(self.penalty_deduction)

		# Clamp to 0-100 range
		self.overall_score = max(0, min(100, round(final_score, 2)))

	def calculate_score_change(self):
		"""Calculate the change from the previous score."""
		self.score_change = round(flt(self.overall_score) - flt(self.previous_score), 2)

	def determine_trend(self):
		"""Determine score trend based on recent history."""
		if not self.buyer:
			self.score_trend = "Stable"
			return

		# Get last 5 scores
		recent_scores = frappe.db.sql("""
			SELECT overall_score
			FROM `tabBuyer KPI Score Log`
			WHERE buyer = %s
			AND status = 'Finalized'
			AND name != %s
			ORDER BY calculation_date DESC
			LIMIT 5
		""", (self.buyer, self.name or ""), as_dict=True)

		if len(recent_scores) < 2:
			self.score_trend = "Stable"
			return

		scores = [s.overall_score for s in recent_scores]
		avg_change = (scores[0] - scores[-1]) / len(scores)

		if avg_change > 1:
			self.score_trend = "Rising"
		elif avg_change < -1:
			self.score_trend = "Declining"
		else:
			self.score_trend = "Stable"

	def determine_grade(self):
		"""Determine letter grade from overall score."""
		score = round(flt(self.overall_score), 2)
		if score >= 85:
			self.grade = "A"
		elif score >= 70:
			self.grade = "B"
		elif score >= 55:
			self.grade = "C"
		elif score >= 40:
			self.grade = "D"
		elif score >= 25:
			self.grade = "E"
		else:
			self.grade = "F"

	def determine_passing_status(self):
		"""Determine if the buyer passed the KPI threshold."""
		passing_threshold = flt(self.passing_score) or 60
		if flt(self.overall_score) >= passing_threshold:
			self.passing_status = "Passed"
		else:
			self.passing_status = "Failed"

	def calculate_metric_summary(self):
		"""Calculate summary statistics from metric scores."""
		if not self.metric_scores:
			return

		self.metrics_evaluated = len(self.metric_scores)

		passing_count = 0
		warning_count = 0
		critical_count = 0
		highest_score = -1
		lowest_score = 101
		highest_name = ""
		lowest_name = ""

		for m in self.metric_scores:
			level = m.threshold_level
			if level in ("Excellent", "Good"):
				passing_count += 1
			elif level == "Warning":
				warning_count += 1
			elif level == "Critical":
				critical_count += 1

			if flt(m.normalized_score) > highest_score:
				highest_score = flt(m.normalized_score)
				highest_name = m.metric_name
			if flt(m.normalized_score) < lowest_score:
				lowest_score = flt(m.normalized_score)
				lowest_name = m.metric_name

		self.metrics_passing = passing_count
		self.metrics_warning = warning_count
		self.metrics_critical = critical_count
		self.highest_metric = highest_name
		self.lowest_metric = lowest_name

	def calculate_percentile_rank(self):
		"""Calculate buyer's percentile rank among all buyers."""
		if not self.buyer:
			return

		# Count buyers with lower scores
		lower_count = frappe.db.count("Buyer Profile",
			{"buyer_score": ["<", self.overall_score], "status": "Active"}
		)

		total_count = frappe.db.count("Buyer Profile", {"status": "Active"})

		if total_count > 0:
			self.percentile_rank = round((lower_count / total_count) * 100, 1)
		else:
			self.percentile_rank = 50

	def finalize(self, user=None):
		"""Finalize the KPI score record."""
		if self.status == "Finalized":
			frappe.throw(_("KPI score is already finalized"))

		self.status = "Finalized"
		self.finalized_at = now_datetime()
		self.finalized_by = user or frappe.session.user
		self.flags.ignore_guard = True
		self.save()

		# Update buyer's current score
		self.update_buyer_score()

		frappe.msgprint(_("KPI score finalized successfully"))

	def update_buyer_score(self):
		"""Update the buyer's current score in Buyer Profile."""
		if self.status != "Finalized":
			return

		# Only update if this is the most recent finalized score
		latest_score = frappe.db.get_value(
			"Buyer KPI Score Log",
			{
				"buyer": self.buyer,
				"status": "Finalized"
			},
			"name",
			order_by="calculation_date desc"
		)

		if latest_score == self.name:
			update_values = {
				"buyer_score": self.overall_score,
				"last_score_date": self.calculation_date,
			}

			# Map score_trend to buyer_score_trend
			trend_map = {
				"Rising": "Up",
				"Declining": "Down",
				"Stable": "Stable"
			}
			update_values["buyer_score_trend"] = trend_map.get(self.score_trend, "Stable")

			frappe.db.set_value("Buyer Profile", self.buyer, update_values)

	def appeal(self, reason):
		"""
		Submit an appeal for this KPI score.

		Args:
			reason: Reason for appeal
		"""
		if self.status != "Finalized":
			frappe.throw(_("Only finalized KPI scores can be appealed"))

		self.status = "Appealed"
		self.appeal_status = "Pending"
		self.appeal_reason = reason
		self.appeal_date = now_datetime()
		self.calculation_notes = (
			(self.calculation_notes or "") +
			"\n\nAppeal submitted: {0}".format(reason)
		)
		self.flags.ignore_guard = True
		self.save()

		frappe.msgprint(_("Appeal submitted successfully"))

	def revise(self, adjustments, reason, user=None):
		"""
		Revise the KPI score with manual adjustments.

		Args:
			adjustments: Dict of field adjustments
			reason: Reason for revision
			user: User making the revision
		"""
		allowed_adjustments = [
			"bonus_points", "penalty_deduction",
			"penalty_reason", "bonus_reason"
		]

		for field, value in adjustments.items():
			if field in allowed_adjustments:
				if field in ("bonus_points", "penalty_deduction"):
					setattr(self, field, flt(value))
				else:
					setattr(self, field, value)

		self.manual_adjustments = reason
		self.adjusted_by = user or frappe.session.user
		self.adjustment_date = now_datetime()
		self.status = "Revised"

		# Recalculate overall score with new adjustments
		self.calculate_overall_score()
		self.calculate_score_change()
		self.determine_grade()
		self.determine_passing_status()
		self.flags.ignore_guard = True
		self.save()

		# Update buyer if this was the latest score
		self.update_buyer_score()

		frappe.msgprint(_("KPI score revised successfully"))

	def get_score_breakdown(self):
		"""Get a detailed breakdown of the KPI score calculation."""
		metrics = []
		for m in (self.metric_scores or []):
			metrics.append({
				"metric_code": m.metric_code,
				"metric_name": m.metric_name,
				"raw_value": m.raw_value,
				"normalized_score": m.normalized_score,
				"weight": m.weight,
				"weighted_score": m.weighted_score,
				"threshold_level": m.threshold_level
			})

		return {
			"overall_score": self.overall_score,
			"previous_score": self.previous_score,
			"score_change": self.score_change,
			"score_trend": self.score_trend,
			"grade": self.grade,
			"passing_status": self.passing_status,
			"percentile_rank": self.percentile_rank,
			"metrics": metrics,
			"summary": {
				"total_weighted_score": self.total_weighted_score,
				"metrics_evaluated": self.metrics_evaluated,
				"metrics_passing": self.metrics_passing,
				"metrics_warning": self.metrics_warning,
				"metrics_critical": self.metrics_critical,
				"highest_metric": self.highest_metric,
				"lowest_metric": self.lowest_metric
			},
			"adjustments": {
				"bonus_points": self.bonus_points,
				"penalty_deduction": self.penalty_deduction,
				"net_adjustment": flt(self.bonus_points) - flt(self.penalty_deduction)
			},
			"raw_metrics": {
				"total_spend": self.total_spend,
				"average_order_value": self.average_order_value,
				"order_count": self.order_count,
				"order_frequency": self.order_frequency,
				"payment_on_time_rate": self.payment_on_time_rate,
				"payment_pattern": self.payment_pattern,
				"return_rate": self.return_rate,
				"cancellation_rate": self.cancellation_rate,
				"feedback_rate": self.feedback_rate,
				"dispute_rate": self.dispute_rate,
				"account_age_days": self.account_age_days,
				"last_activity_days": self.last_activity_days
			}
		}

	def get_summary(self):
		"""Get a summary for display."""
		return {
			"name": self.name,
			"buyer": self.buyer,
			"kpi_template": self.kpi_template,
			"score_type": self.score_type,
			"score_period": self.score_period,
			"calculation_date": self.calculation_date,
			"status": self.status,
			"overall_score": self.overall_score,
			"score_change": self.score_change,
			"score_trend": self.score_trend,
			"grade": self.grade,
			"passing_status": self.passing_status,
			"buyer_level_at_calculation": self.buyer_level_at_calculation
		}


# API Endpoints
@frappe.whitelist()
def finalize_buyer_kpi_score(score_name):
	"""
	Finalize a buyer KPI score record.

	Args:
		score_name: Buyer KPI Score Log name

	Returns:
		dict: Result
	"""
	if not frappe.db.exists("Buyer KPI Score Log", score_name):
		frappe.throw(_("KPI score record not found"))

	score = frappe.get_doc("Buyer KPI Score Log", score_name)
	score.finalize()

	return {
		"status": "success",
		"message": _("KPI score finalized successfully"),
		"score": score_name
	}


@frappe.whitelist()
def appeal_buyer_kpi_score(score_name, reason):
	"""
	Submit an appeal for a buyer KPI score.

	Args:
		score_name: Buyer KPI Score Log name
		reason: Reason for appeal

	Returns:
		dict: Result
	"""
	if not frappe.db.exists("Buyer KPI Score Log", score_name):
		frappe.throw(_("KPI score record not found"))

	if not reason:
		frappe.throw(_("Appeal reason is required"))

	score = frappe.get_doc("Buyer KPI Score Log", score_name)
	score.appeal(reason)

	return {
		"status": "success",
		"message": _("Appeal submitted successfully"),
		"score": score_name
	}


@frappe.whitelist()
def get_buyer_kpi_score_history(buyer, limit=10, score_type=None):
	"""
	Get KPI score history for a buyer.

	Args:
		buyer: Buyer profile name
		limit: Maximum records to return
		score_type: Filter by score type

	Returns:
		list: Score history records
	"""
	if not frappe.db.exists("Buyer Profile", buyer):
		frappe.throw(_("Buyer not found"))

	filters = {
		"buyer": buyer,
		"status": "Finalized"
	}

	if score_type:
		filters["score_type"] = score_type

	scores = frappe.get_all("Buyer KPI Score Log",
		filters=filters,
		fields=[
			"name", "calculation_date", "score_type", "score_period",
			"overall_score", "score_change", "score_trend", "grade",
			"passing_status", "kpi_template", "buyer_level_at_calculation"
		],
		order_by="calculation_date desc",
		limit=cint(limit)
	)

	return scores


@frappe.whitelist()
def get_buyer_kpi_score_details(score_name):
	"""
	Get detailed KPI score breakdown.

	Args:
		score_name: Buyer KPI Score Log name

	Returns:
		dict: Detailed score breakdown
	"""
	if not frappe.db.exists("Buyer KPI Score Log", score_name):
		frappe.throw(_("KPI score record not found"))

	score = frappe.get_doc("Buyer KPI Score Log", score_name)
	return score.get_score_breakdown()
