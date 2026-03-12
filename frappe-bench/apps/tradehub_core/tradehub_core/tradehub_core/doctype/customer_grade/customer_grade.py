# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate, now_datetime, nowdate
from datetime import datetime

from tradehub_core.tradehub_core.utils.safe_math import safe_divide
from tradehub_core.tradehub_core.scoring.grading import score_to_grade
from tradehub_core.tradehub_core.scoring.normalizers import (
    normalize_higher_is_better,
    normalize_lower_is_better,
    normalize_logarithmic,
)


# Default grading weights (§8.3 Naming Contract)
DEFAULT_CRITERIA = [
    {"criterion_name": "Total Spend", "criterion_code": "TOTAL_SPEND", "weight": 25, "threshold_good": 10000, "threshold_poor": 0, "is_inverted": 0},
    {"criterion_name": "Order Frequency", "criterion_code": "ORDER_FREQ", "weight": 20, "threshold_good": 4.0, "threshold_poor": 0, "is_inverted": 0},
    {"criterion_name": "On-Time Payment", "criterion_code": "ON_TIME_PAYMENT", "weight": 15, "threshold_good": 100, "threshold_poor": 50, "is_inverted": 0},
    {"criterion_name": "Return/Cancel Rate", "criterion_code": "RETURN_CANCEL", "weight": 15, "threshold_good": 0, "threshold_poor": 20, "is_inverted": 1},
    {"criterion_name": "Account Age", "criterion_code": "ACCOUNT_AGE", "weight": 10, "threshold_good": 730, "threshold_poor": 0, "is_inverted": 0},
    {"criterion_name": "Dispute Rate", "criterion_code": "DISPUTE_RATE", "weight": 10, "threshold_good": 0, "threshold_poor": 10, "is_inverted": 1},
    {"criterion_name": "Feedback Rate", "criterion_code": "FEEDBACK_RATE", "weight": 5, "threshold_good": 100, "threshold_poor": 0, "is_inverted": 0},
]

# Minimum order threshold for grading
MIN_ORDERS_FOR_GRADING = 3

# Provisional grade for buyers below minimum order threshold
PROVISIONAL_GRADE = "C"
PROVISIONAL_SCORE = 55.0


class CustomerGrade(Document):
    """
    Customer Grade DocType for tracking buyer performance grades (A-F).

    Records individual grade calculations with:
    - Overall score (0-100) mapped to letter grade (A-F)
    - Per-criterion normalized scores, weights, and raw values
    - Status lifecycle (Draft → Calculating → Finalized → Overridden)
    - Historical comparison and trend analysis
    - Criteria child table for configurable grading weights

    Grade Boundaries:
        A >= 85, B >= 70, C >= 55, D >= 40, E >= 25, F < 25

    Grading Criteria (default weights):
        Total Spend: 25% (logarithmic normalization)
        Order Frequency: 20% (higher is better)
        On-Time Payment: 15% (higher is better, 50-100%)
        Return/Cancel Rate: 15% (lower is better, 0-20%)
        Account Age: 10% (higher is better, 0-730 days)
        Dispute Rate: 10% (lower is better, 0-10%)
        Feedback Rate: 5% (higher is better, 0-100%)
    """

    def before_insert(self):
        """Set default values before inserting a new grade record."""
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

        # Set default criteria if none provided
        if not self.criteria:
            self.set_default_criteria()

    def validate(self):
        """Validate grade data before saving."""
        self._guard_system_fields()
        self.validate_buyer()
        self.validate_scores()
        self.validate_grade_value()
        self.validate_criteria_weights()
        self.calculate_overall_score()
        self.derive_grade()
        self.calculate_score_change()
        self.determine_trend()

    def _guard_system_fields(self):
        """Prevent modification of system-generated fields after creation."""
        if self.is_new():
            return
        # Allow programmatic lifecycle transitions (finalize, override)
        if self.flags.get("ignore_guard"):
            return

        system_fields = [
            'previous_score',
            'score_change',
            'score_trend',
            'percentile_rank',
            'buyer_level_at_calculation',
            'is_provisional',
            'orders_evaluated',
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
        """Actions after grade is updated."""
        if self.status == "Finalized":
            self.update_buyer_grade()

    def on_trash(self):
        """Prevent deletion of finalized grades."""
        if self.status == "Finalized":
            frappe.throw(_("Cannot delete finalized grade records"))

    def validate_buyer(self):
        """Validate buyer exists and is valid."""
        if not self.buyer:
            frappe.throw(_("Buyer is required"))

        if not frappe.db.exists("Buyer Profile", self.buyer):
            frappe.throw(_("Invalid buyer"))

    def validate_scores(self):
        """Validate all score values are within 0-100 range."""
        score_fields = [
            "overall_score", "total_spend_score", "order_frequency_score",
            "on_time_payment_score", "return_cancel_score", "account_age_score",
            "dispute_rate_score", "feedback_rate_score"
        ]

        for field in score_fields:
            value = flt(getattr(self, field, 0))
            if value < 0 or value > 100:
                frappe.throw(_("{0} must be between 0 and 100").format(
                    field.replace("_", " ").title()
                ))

    def validate_grade_value(self):
        """Validate grade is a valid letter grade."""
        valid_grades = ["A", "B", "C", "D", "E", "F"]
        if self.grade and self.grade not in valid_grades:
            frappe.throw(_("Grade must be one of: {0}").format(", ".join(valid_grades)))

    def validate_criteria_weights(self):
        """Validate criteria weights sum to 100% (tolerance 0.01)."""
        if not self.criteria:
            return

        from tradehub_core.tradehub_core.doctype.grading_criterion.grading_criterion import GradingCriterion
        GradingCriterion.validate_weight_sum(self.criteria, tolerance=0.01)

    def set_default_criteria(self):
        """Set default grading criteria if none provided."""
        for criterion in DEFAULT_CRITERIA:
            self.append("criteria", criterion)

    def set_previous_score(self):
        """Get the previous score for comparison."""
        if not self.buyer:
            return

        prev_score = frappe.db.get_value(
            "Customer Grade",
            {
                "buyer": self.buyer,
                "status": "Finalized",
                "name": ["!=", self.name or ""],
                "calculation_date": ["<", self.calculation_date or nowdate()]
            },
            "overall_score",
            order_by="calculation_date desc"
        )

        if prev_score is not None:
            self.previous_score = flt(prev_score)

    def calculate_overall_score(self):
        """Calculate the weighted overall score from per-criterion scores.

        Uses the per-criterion score and weight fields to compute a weighted
        average. If criteria child table is populated, uses those weights;
        otherwise falls back to the per-criterion weight fields.
        """
        # Build criterion score/weight pairs from the per-criterion fields
        components = [
            (flt(self.total_spend_score), flt(self.total_spend_weight)),
            (flt(self.order_frequency_score), flt(self.order_frequency_weight)),
            (flt(self.on_time_payment_score), flt(self.on_time_payment_weight)),
            (flt(self.return_cancel_score), flt(self.return_cancel_weight)),
            (flt(self.account_age_score), flt(self.account_age_weight)),
            (flt(self.dispute_rate_score), flt(self.dispute_rate_weight)),
            (flt(self.feedback_rate_score), flt(self.feedback_rate_weight)),
        ]

        total_weight = sum(w for _, w in components)
        if total_weight == 0:
            total_weight = 100  # Avoid division by zero

        weighted_sum = sum(s * w for s, w in components)
        final_score = safe_divide(weighted_sum, total_weight, default=0)

        # Clamp to 0-100 range
        self.overall_score = max(0, min(100, round(final_score, 2)))

    def derive_grade(self):
        """Derive the letter grade from the overall score."""
        self.grade = score_to_grade(self.overall_score)

    def calculate_score_change(self):
        """Calculate the change from the previous score."""
        self.score_change = round(flt(self.overall_score) - flt(self.previous_score), 2)

    def determine_trend(self):
        """Determine score trend based on recent history."""
        if not self.buyer:
            self.score_trend = "Stable"
            return

        # Get last 5 finalized grades
        recent_grades = frappe.db.sql("""
            SELECT overall_score
            FROM `tabCustomer Grade`
            WHERE buyer = %s
            AND status = 'Finalized'
            AND name != %s
            ORDER BY calculation_date DESC
            LIMIT 5
        """, (self.buyer, self.name or ""), as_dict=True)

        if len(recent_grades) < 2:
            self.score_trend = "Stable"
            return

        scores = [g.overall_score for g in recent_grades]
        avg_change = safe_divide(scores[0] - scores[-1], len(scores), default=0)

        if avg_change > 1:
            self.score_trend = "Rising"
        elif avg_change < -1:
            self.score_trend = "Declining"
        else:
            self.score_trend = "Stable"

    def calculate_percentile_rank(self):
        """Calculate buyer's percentile rank among all buyers with grades."""
        if not self.buyer:
            return

        lower_count = frappe.db.count("Buyer Profile",
            {"buyer_score": ["<", self.overall_score], "status": "Active"}
        )

        total_count = frappe.db.count("Buyer Profile", {"status": "Active"})

        if total_count > 0:
            self.percentile_rank = round(safe_divide(lower_count, total_count) * 100, 1)
        else:
            self.percentile_rank = 50

    def run_grading_pipeline(self, buyer_data=None):
        """Run the full grading pipeline for this buyer.

        Steps:
        1. Collect raw metrics from buyer profile
        2. Check minimum order threshold (provisional grade if < 3 orders)
        3. Normalize each criterion using appropriate function
        4. Apply weights to normalized scores
        5. Aggregate to overall score
        6. Derive letter grade

        Args:
            buyer_data: Optional dict of pre-collected buyer data.
                If not provided, data is fetched from Buyer Profile.

        Returns:
            dict: Grading result with score, grade, and per-criterion details.
        """
        # Step 1: Collect raw metrics
        if not buyer_data:
            buyer_data = self.collect_buyer_metrics()

        # Step 2: Check minimum order threshold
        orders = cint(buyer_data.get("total_orders", 0))
        self.orders_evaluated = orders

        if orders < MIN_ORDERS_FOR_GRADING:
            return self._set_provisional_grade(buyer_data)

        # Store raw metric values
        self.total_spend_amount = flt(buyer_data.get("total_spent", 0))
        self.order_frequency_value = flt(buyer_data.get("order_frequency", 0))
        self.on_time_payment_rate = flt(buyer_data.get("payment_on_time_rate", 0))
        self.return_cancel_rate = flt(buyer_data.get("return_cancel_rate", 0))
        self.account_age_days = cint(buyer_data.get("account_age_days", 0))
        self.dispute_rate_value = flt(buyer_data.get("dispute_rate", 0))
        self.feedback_rate_value = flt(buyer_data.get("feedback_rate", 0))

        # Step 3: Normalize each criterion
        criteria_map = self._get_criteria_map()

        # Total Spend — logarithmic normalization
        spend_criteria = criteria_map.get("TOTAL_SPEND", {})
        self.total_spend_score = round(normalize_logarithmic(
            self.total_spend_amount,
            flt(spend_criteria.get("threshold_good", 10000))
        ), 2)
        self.total_spend_weight = flt(spend_criteria.get("weight", 25))
        self.total_spend_raw = self.total_spend_amount

        # Order Frequency — higher is better
        freq_criteria = criteria_map.get("ORDER_FREQ", {})
        self.order_frequency_score = round(normalize_higher_is_better(
            self.order_frequency_value,
            flt(freq_criteria.get("threshold_good", 4.0)),
            flt(freq_criteria.get("threshold_poor", 0))
        ), 2)
        self.order_frequency_weight = flt(freq_criteria.get("weight", 20))
        self.order_frequency_raw = self.order_frequency_value

        # On-Time Payment — higher is better
        payment_criteria = criteria_map.get("ON_TIME_PAYMENT", {})
        self.on_time_payment_score = round(normalize_higher_is_better(
            self.on_time_payment_rate,
            flt(payment_criteria.get("threshold_good", 100)),
            flt(payment_criteria.get("threshold_poor", 50))
        ), 2)
        self.on_time_payment_weight = flt(payment_criteria.get("weight", 15))
        self.on_time_payment_raw = self.on_time_payment_rate

        # Return/Cancel Rate — lower is better
        return_criteria = criteria_map.get("RETURN_CANCEL", {})
        self.return_cancel_score = round(normalize_lower_is_better(
            self.return_cancel_rate,
            flt(return_criteria.get("threshold_good", 0)),
            flt(return_criteria.get("threshold_poor", 20))
        ), 2)
        self.return_cancel_weight = flt(return_criteria.get("weight", 15))
        self.return_cancel_raw = self.return_cancel_rate

        # Account Age — higher is better
        age_criteria = criteria_map.get("ACCOUNT_AGE", {})
        self.account_age_score = round(normalize_higher_is_better(
            self.account_age_days,
            flt(age_criteria.get("threshold_good", 730)),
            flt(age_criteria.get("threshold_poor", 0))
        ), 2)
        self.account_age_weight = flt(age_criteria.get("weight", 10))
        self.account_age_raw = self.account_age_days

        # Dispute Rate — lower is better
        dispute_criteria = criteria_map.get("DISPUTE_RATE", {})
        self.dispute_rate_score = round(normalize_lower_is_better(
            self.dispute_rate_value,
            flt(dispute_criteria.get("threshold_good", 0)),
            flt(dispute_criteria.get("threshold_poor", 10))
        ), 2)
        self.dispute_rate_weight = flt(dispute_criteria.get("weight", 10))
        self.dispute_rate_raw = self.dispute_rate_value

        # Feedback Rate — higher is better
        feedback_criteria = criteria_map.get("FEEDBACK_RATE", {})
        self.feedback_rate_score = round(normalize_higher_is_better(
            self.feedback_rate_value,
            flt(feedback_criteria.get("threshold_good", 100)),
            flt(feedback_criteria.get("threshold_poor", 0))
        ), 2)
        self.feedback_rate_weight = flt(feedback_criteria.get("weight", 5))
        self.feedback_rate_raw = self.feedback_rate_value

        # Steps 4-5: Calculate weighted overall score (done in validate)
        self.is_provisional = 0

        # Step 6: Overall score and grade are derived in validate()
        return {
            "score": self.overall_score,
            "grade": self.grade,
            "is_provisional": False,
            "orders_evaluated": self.orders_evaluated,
        }

    def collect_buyer_metrics(self):
        """Collect raw metrics from the Buyer Profile.

        Returns:
            dict: Raw metric values for grading.
        """
        if not self.buyer:
            return {}

        buyer = frappe.get_doc("Buyer Profile", self.buyer)

        # Calculate account age
        account_age_days = 0
        if buyer.joined_at:
            joined_date = getdate(buyer.joined_at)
            account_age_days = (getdate(nowdate()) - joined_date).days

        # Calculate order frequency (orders per month)
        total_orders = cint(buyer.total_orders)
        order_frequency = 0
        if total_orders > 0 and account_age_days > 0:
            months_active = max(1, account_age_days / 30.0)
            order_frequency = safe_divide(total_orders, months_active, default=0)

        # Get return/cancel rate — combine return_rate and cancellation_rate
        return_rate = flt(buyer.return_rate) if hasattr(buyer, 'return_rate') else 0
        cancel_rate = flt(buyer.cancellation_rate) if hasattr(buyer, 'cancellation_rate') else 0
        return_cancel_rate = return_rate + cancel_rate

        # Get dispute rate with fallback
        dispute_rate = flt(buyer.dispute_rate) if hasattr(buyer, 'dispute_rate') else 0

        # Get feedback rate with fallback
        feedback_rate = flt(buyer.feedback_rate) if hasattr(buyer, 'feedback_rate') else 0

        return {
            "total_orders": total_orders,
            "total_spent": flt(buyer.total_spent),
            "order_frequency": round(order_frequency, 2),
            "payment_on_time_rate": flt(buyer.payment_on_time_rate),
            "return_cancel_rate": min(100, round(return_cancel_rate, 2)),
            "account_age_days": account_age_days,
            "dispute_rate": dispute_rate,
            "feedback_rate": feedback_rate,
        }

    def _set_provisional_grade(self, buyer_data):
        """Set provisional grade for buyers below minimum order threshold.

        Buyers with fewer than MIN_ORDERS_FOR_GRADING orders receive a
        provisional grade of 'C' with a score of 55.0.

        Args:
            buyer_data: Dict of buyer metric data.

        Returns:
            dict: Provisional grading result.
        """
        self.is_provisional = 1
        self.overall_score = PROVISIONAL_SCORE
        self.grade = PROVISIONAL_GRADE

        # Store raw values even for provisional grades
        self.total_spend_amount = flt(buyer_data.get("total_spent", 0))
        self.order_frequency_value = flt(buyer_data.get("order_frequency", 0))
        self.on_time_payment_rate = flt(buyer_data.get("payment_on_time_rate", 0))
        self.return_cancel_rate = flt(buyer_data.get("return_cancel_rate", 0))
        self.account_age_days = cint(buyer_data.get("account_age_days", 0))
        self.dispute_rate_value = flt(buyer_data.get("dispute_rate", 0))
        self.feedback_rate_value = flt(buyer_data.get("feedback_rate", 0))

        # Zero out all criterion scores for provisional grades
        for prefix in ["total_spend", "order_frequency", "on_time_payment",
                        "return_cancel", "account_age", "dispute_rate", "feedback_rate"]:
            setattr(self, f"{prefix}_score", 0)

        self.calculation_notes = (
            f"Provisional grade: buyer has {self.orders_evaluated} orders "
            f"(minimum {MIN_ORDERS_FOR_GRADING} required for full grading)"
        )

        return {
            "score": PROVISIONAL_SCORE,
            "grade": PROVISIONAL_GRADE,
            "is_provisional": True,
            "orders_evaluated": self.orders_evaluated,
        }

    def _get_criteria_map(self):
        """Build a map of criterion_code → criterion data from child table.

        Returns:
            dict: Mapping of criterion codes to their configuration.
        """
        criteria_map = {}

        if self.criteria:
            for row in self.criteria:
                code = (row.criterion_code or "").upper().replace(" ", "_")
                criteria_map[code] = {
                    "weight": flt(row.weight),
                    "threshold_good": flt(row.threshold_good),
                    "threshold_poor": flt(row.threshold_poor),
                    "is_inverted": cint(row.is_inverted),
                }

        # Fill in defaults for any missing criteria
        for default in DEFAULT_CRITERIA:
            code = default["criterion_code"]
            if code not in criteria_map:
                criteria_map[code] = {
                    "weight": default["weight"],
                    "threshold_good": default["threshold_good"],
                    "threshold_poor": default["threshold_poor"],
                    "is_inverted": default["is_inverted"],
                }

        return criteria_map

    def finalize(self, user=None):
        """Finalize the grade record.

        Args:
            user: Optional user who finalized the grade.
        """
        if self.status == "Finalized":
            frappe.throw(_("Grade is already finalized"))

        self.status = "Finalized"
        self.finalized_at = now_datetime()
        self.finalized_by = user or frappe.session.user
        self.flags.ignore_guard = True
        self.save()

        # Update buyer's current grade
        self.update_buyer_grade()

        frappe.msgprint(_("Grade finalized successfully"))

    def update_buyer_grade(self):
        """Update the buyer's current grade in Buyer Profile."""
        if self.status != "Finalized":
            return

        # Only update if this is the most recent finalized grade
        latest_grade = frappe.db.get_value(
            "Customer Grade",
            {
                "buyer": self.buyer,
                "status": "Finalized"
            },
            "name",
            order_by="calculation_date desc"
        )

        if latest_grade == self.name:
            update_fields = {
                "buyer_score": self.overall_score,
                "last_score_date": self.calculation_date,
            }

            # Determine trend for buyer profile
            if self.score_change > 0:
                update_fields["buyer_score_trend"] = "Up"
            elif self.score_change < 0:
                update_fields["buyer_score_trend"] = "Down"
            else:
                update_fields["buyer_score_trend"] = "Stable"

            frappe.db.set_value("Buyer Profile", self.buyer, update_fields)

    def override_grade(self, new_grade, reason, user=None):
        """Override the calculated grade with a manual grade.

        Args:
            new_grade: New letter grade (A-F).
            reason: Reason for override.
            user: User making the override.
        """
        valid_grades = ["A", "B", "C", "D", "E", "F"]
        if new_grade not in valid_grades:
            frappe.throw(_("Invalid grade. Must be one of: {0}").format(", ".join(valid_grades)))

        if self.status not in ("Finalized", "Draft"):
            frappe.throw(_("Only Finalized or Draft grades can be overridden"))

        old_grade = self.grade
        self.grade = new_grade
        self.status = "Overridden"
        self.manual_adjustments = reason
        self.adjusted_by = user or frappe.session.user
        self.calculation_notes = (
            (self.calculation_notes or "") +
            f"\n\nGrade overridden from {old_grade} to {new_grade}: {reason}"
        )
        self.flags.ignore_guard = True
        self.save()

        frappe.msgprint(_("Grade overridden from {0} to {1}").format(old_grade, new_grade))

    def get_grade_breakdown(self):
        """Get a detailed breakdown of the grade calculation.

        Returns:
            dict: Complete breakdown of the grading calculation.
        """
        return {
            "grade": self.grade,
            "overall_score": self.overall_score,
            "previous_score": self.previous_score,
            "score_change": self.score_change,
            "score_trend": self.score_trend,
            "is_provisional": cint(self.is_provisional),
            "criteria": {
                "total_spend": {
                    "score": self.total_spend_score,
                    "weight": self.total_spend_weight,
                    "raw": self.total_spend_raw,
                    "weighted": round(flt(self.total_spend_score) * flt(self.total_spend_weight) / 100, 2)
                },
                "order_frequency": {
                    "score": self.order_frequency_score,
                    "weight": self.order_frequency_weight,
                    "raw": self.order_frequency_raw,
                    "weighted": round(flt(self.order_frequency_score) * flt(self.order_frequency_weight) / 100, 2)
                },
                "on_time_payment": {
                    "score": self.on_time_payment_score,
                    "weight": self.on_time_payment_weight,
                    "raw": self.on_time_payment_raw,
                    "weighted": round(flt(self.on_time_payment_score) * flt(self.on_time_payment_weight) / 100, 2)
                },
                "return_cancel": {
                    "score": self.return_cancel_score,
                    "weight": self.return_cancel_weight,
                    "raw": self.return_cancel_raw,
                    "weighted": round(flt(self.return_cancel_score) * flt(self.return_cancel_weight) / 100, 2)
                },
                "account_age": {
                    "score": self.account_age_score,
                    "weight": self.account_age_weight,
                    "raw": self.account_age_raw,
                    "weighted": round(flt(self.account_age_score) * flt(self.account_age_weight) / 100, 2)
                },
                "dispute_rate": {
                    "score": self.dispute_rate_score,
                    "weight": self.dispute_rate_weight,
                    "raw": self.dispute_rate_raw,
                    "weighted": round(flt(self.dispute_rate_score) * flt(self.dispute_rate_weight) / 100, 2)
                },
                "feedback_rate": {
                    "score": self.feedback_rate_score,
                    "weight": self.feedback_rate_weight,
                    "raw": self.feedback_rate_raw,
                    "weighted": round(flt(self.feedback_rate_score) * flt(self.feedback_rate_weight) / 100, 2)
                },
            },
            "metrics": {
                "orders_evaluated": self.orders_evaluated,
                "total_spend_amount": self.total_spend_amount,
                "order_frequency_value": self.order_frequency_value,
                "on_time_payment_rate": self.on_time_payment_rate,
                "return_cancel_rate": self.return_cancel_rate,
                "account_age_days": self.account_age_days,
                "dispute_rate_value": self.dispute_rate_value,
                "feedback_rate_value": self.feedback_rate_value,
            }
        }

    def get_summary(self):
        """Get a summary for display.

        Returns:
            dict: Summary of the grade record.
        """
        return {
            "name": self.name,
            "buyer": self.buyer,
            "grade": self.grade,
            "overall_score": self.overall_score,
            "grade_type": self.grade_type,
            "grade_period": self.grade_period,
            "calculation_date": self.calculation_date,
            "status": self.status,
            "score_change": self.score_change,
            "score_trend": self.score_trend,
            "is_provisional": cint(self.is_provisional),
            "buyer_level_at_calculation": self.buyer_level_at_calculation,
        }


# API Endpoints
@frappe.whitelist()
def calculate_buyer_grade(buyer, grade_type="Periodic", auto_finalize=False):
    """Calculate a new grade for a buyer.

    Args:
        buyer: Buyer Profile name.
        grade_type: Type of grade calculation.
        auto_finalize: Automatically finalize the grade.

    Returns:
        dict: Grade calculation result.
    """
    if not frappe.db.exists("Buyer Profile", buyer):
        frappe.throw(_("Buyer not found"))

    grade = frappe.get_doc({
        "doctype": "Customer Grade",
        "buyer": buyer,
        "grade_type": grade_type,
        "grade_period": datetime.now().strftime("%Y-%m"),
        "calculation_date": nowdate(),
        "status": "Calculating",
    })

    # Run the grading pipeline
    grade.run_grading_pipeline()
    grade.insert()

    if cint(auto_finalize):
        grade.finalize()

    return grade.get_grade_breakdown()


@frappe.whitelist()
def get_buyer_grade_history(buyer, limit=10):
    """Get grade history for a buyer.

    Args:
        buyer: Buyer Profile name.
        limit: Maximum records to return.

    Returns:
        list: Grade history records.
    """
    if not frappe.db.exists("Buyer Profile", buyer):
        frappe.throw(_("Buyer not found"))

    grades = frappe.get_all("Customer Grade",
        filters={
            "buyer": buyer,
            "status": "Finalized"
        },
        fields=[
            "name", "calculation_date", "grade_type", "grade_period",
            "grade", "overall_score", "score_change", "score_trend",
            "is_provisional"
        ],
        order_by="calculation_date desc",
        limit=cint(limit)
    )

    return grades


@frappe.whitelist()
def override_buyer_grade(grade_name, new_grade, reason):
    """Override a buyer's grade.

    Args:
        grade_name: Customer Grade name.
        new_grade: New letter grade (A-F).
        reason: Reason for override.

    Returns:
        dict: Result.
    """
    if not frappe.db.exists("Customer Grade", grade_name):
        frappe.throw(_("Grade record not found"))

    grade = frappe.get_doc("Customer Grade", grade_name)
    grade.override_grade(new_grade, reason)

    return {
        "status": "success",
        "message": _("Grade overridden successfully"),
        "grade": grade_name,
        "new_grade": new_grade
    }
