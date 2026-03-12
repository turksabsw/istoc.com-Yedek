# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

"""
Seller Scoring Engine for TradeHub B2B Marketplace (TASK-6).

Implements the 8-step scoring pipeline for seller performance evaluation:
    1. Collect   — Gather raw metric values from Seller Metrics / Seller Profile
    2. Normalize — Normalize each metric to a [0, 100] scale
    3. Weight    — Apply metric weights (sum = 100%)
    4. Aggregate — Sum weighted normalized scores into a base score
    5. Curve     — Apply optional scoring curve adjustment
    6. Penalties — Subtract penalty deductions (policy violations, suspensions)
    7. Bonuses   — Add bonus points (tenure, consistency, improvement)
    8. Finalize  — Clamp to [0, 100], round, and return result

Default Seller KPI Metrics (STD_SELLER_SCORE, 10 metrics, Σ=100%):
    ODR              (order_defect_rate)       — 15%, lower_is_better
    ON_TIME_DELIVERY (on_time_delivery_rate)   — 15%, higher_is_better
    LSR              (late_shipment_rate)       — 10%, lower_is_better
    RETURN_RATE      (return_rate)             — 10%, lower_is_better
    CANCEL_RATE      (cancellation_rate)       — 10%, lower_is_better
    AVG_RATING       (avg_rating)             — 15%, higher_is_better
    RESPONSE_TIME    (avg_response_time_hours) — 5%,  step
    COMPLAINT_RATE   (complaint_rate)          — 5%,  lower_is_better
    REPEAT_RATE      (repeat_customer_rate)    — 10%, higher_is_better
    POS_FEEDBACK     (positive_feedback_pct)   — 5%,  higher_is_better

Usage:
    from tradehub_seller.tradehub_seller.scoring.engine import calculate_score

    result = calculate_score(raw_metrics, template_items)
    # result = {"score": 78.5, "breakdown": [...], "penalties": 5.0, ...}
"""

from frappe.utils import flt

from tradehub_core.tradehub_core.utils.safe_math import safe_divide
from tradehub_seller.tradehub_seller.scoring.normalizers import (
    normalize_binary,
    normalize_linear,
    normalize_logarithmic,
    normalize_step,
)


# Default seller KPI metric definitions
# Each entry: (kpi_code, metric_field, weight, normalization_type, config)
# config is a dict with normalization-specific parameters
DEFAULT_SELLER_METRICS = [
    ("ODR", "order_defect_rate", 15, "linear", {"target_good": 0, "target_poor": 10, "invert": True}),
    ("ON_TIME_DELIVERY", "on_time_delivery_rate", 15, "linear", {"target_good": 100, "target_poor": 50}),
    ("LSR", "late_shipment_rate", 10, "linear", {"target_good": 0, "target_poor": 10, "invert": True}),
    ("RETURN_RATE", "return_rate", 10, "linear", {"target_good": 0, "target_poor": 20, "invert": True}),
    ("CANCEL_RATE", "cancellation_rate", 10, "linear", {"target_good": 0, "target_poor": 15, "invert": True}),
    ("AVG_RATING", "avg_rating", 15, "linear", {"target_good": 5, "target_poor": 1}),
    ("RESPONSE_TIME", "avg_response_time_hours", 5, "step", {
        "steps": [(4, 100), (12, 80), (24, 60), (48, 30)],
    }),
    ("COMPLAINT_RATE", "complaint_rate", 5, "linear", {"target_good": 0, "target_poor": 10, "invert": True}),
    ("REPEAT_RATE", "repeat_customer_rate", 10, "linear", {"target_good": 50, "target_poor": 0}),
    ("POS_FEEDBACK", "positive_feedback_pct", 5, "linear", {"target_good": 100, "target_poor": 50}),
]

# Default response time step thresholds
DEFAULT_RESPONSE_TIME_STEPS = [(4, 100), (12, 80), (24, 60), (48, 30)]


def calculate_score(raw_metrics, template_items=None, penalties=None, bonuses=None, curve=None):
    """
    Execute the 8-step seller scoring pipeline.

    This is the main entry point for seller score calculation. It accepts
    raw metric values, normalizes them, applies weights, and produces a
    final score with a detailed breakdown.

    Args:
        raw_metrics: Dict of raw seller metric values. Keys are metric
            field names (e.g., "order_defect_rate", "on_time_delivery_rate").
            Values are numeric (int/float). Missing keys default to 0.
        template_items: Optional list of template item dicts, each with:
            - kpi_code (str): KPI identifier (e.g., "ODR")
            - metric_field (str): Field name in raw_metrics
            - weight (float): Weight as percentage (sum must = 100)
            - normalization_type (str): "linear", "logarithmic", "step", "binary"
            - config (dict): Normalization-specific parameters
            If None, uses DEFAULT_SELLER_METRICS.
        penalties: Optional dict with penalty configuration:
            - policy_violations (int): Number of violations (default 0)
            - penalty_per_violation (float): Points per violation (default 5.0)
            - additional_penalty (float): Extra penalty points (default 0)
        bonuses: Optional dict with bonus configuration:
            - tenure_bonus (float): Points for seller tenure (default 0)
            - consistency_bonus (float): Points for consistent performance (default 0)
            - improvement_bonus (float): Points for score improvement (default 0)
        curve: Optional dict with curve adjustment:
            - type (str): Curve type ("none", "linear_boost", "sqrt")
            - factor (float): Curve adjustment factor (default 1.0)

    Returns:
        dict: {
            "score": float (0-100, final clamped and rounded score),
            "base_score": float (weighted aggregate before adjustments),
            "curved_score": float (score after curve adjustment),
            "total_penalty": float (total penalty deduction),
            "total_bonus": float (total bonus addition),
            "breakdown": list of per-metric dicts with details,
            "penalties_detail": dict of penalty breakdown,
            "bonuses_detail": dict of bonus breakdown,
        }
    """
    # Step 1: Collect — gather raw metrics (already provided as input)
    metrics = _step_collect(raw_metrics)

    # Step 2: Normalize — normalize each metric to [0, 100]
    items = template_items or _build_default_items()
    normalized = _step_normalize(metrics, items)

    # Step 3: Weight — apply weights to normalized scores
    weighted = _step_weight(normalized)

    # Step 4: Aggregate — sum weighted scores into base score
    base_score = _step_aggregate(weighted)

    # Step 5: Curve — apply optional scoring curve
    curved_score = _step_curve(base_score, curve)

    # Step 6: Penalties — subtract penalty deductions
    penalty_result = _step_penalties(curved_score, penalties)
    after_penalties = penalty_result["score_after"]

    # Step 7: Bonuses — add bonus points
    bonus_result = _step_bonuses(after_penalties, bonuses)
    after_bonuses = bonus_result["score_after"]

    # Step 8: Finalize — clamp to [0, 100] and round
    final_score = _step_finalize(after_bonuses)

    # Build breakdown from weighted items
    breakdown = []
    for item in weighted:
        breakdown.append({
            "kpi_code": item["kpi_code"],
            "metric_field": item["metric_field"],
            "raw_value": item["raw_value"],
            "normalized_score": round(item["normalized_score"], 2),
            "weight": item["weight"],
            "weighted_score": round(item["weighted_score"], 2),
        })

    return {
        "score": final_score,
        "base_score": round(base_score, 2),
        "curved_score": round(curved_score, 2),
        "total_penalty": round(penalty_result["total_penalty"], 2),
        "total_bonus": round(bonus_result["total_bonus"], 2),
        "breakdown": breakdown,
        "penalties_detail": penalty_result["detail"],
        "bonuses_detail": bonus_result["detail"],
    }


def _step_collect(raw_metrics):
    """
    Step 1: Collect raw metric values.

    Ensures all metric values are numeric (defaults to 0 for missing/None).

    Args:
        raw_metrics: Dict of raw metric field → value mappings.

    Returns:
        dict: Cleaned metrics dict with numeric values.
    """
    cleaned = {}
    for key, value in (raw_metrics or {}).items():
        cleaned[key] = flt(value)
    return cleaned


def _step_normalize(metrics, items):
    """
    Step 2: Normalize each metric to a [0, 100] scale.

    Routes each metric to the appropriate normalization function based on
    its normalization_type.

    Args:
        metrics: Dict of cleaned metric values from Step 1.
        items: List of template item dicts with normalization config.

    Returns:
        list: Items enriched with raw_value and normalized_score.
    """
    result = []
    for item in items:
        metric_field = item["metric_field"]
        raw_value = metrics.get(metric_field, 0)
        normalization_type = item.get("normalization_type", "linear")
        config = item.get("config", {})

        normalized = _normalize_value(raw_value, normalization_type, config)

        result.append({
            "kpi_code": item["kpi_code"],
            "metric_field": metric_field,
            "weight": item["weight"],
            "raw_value": raw_value,
            "normalized_score": normalized,
        })

    return result


def _normalize_value(value, normalization_type, config):
    """
    Normalize a single value using the specified strategy.

    Args:
        value: Raw metric value.
        normalization_type: One of "linear", "logarithmic", "step", "binary".
        config: Dict of normalization parameters specific to the type.

    Returns:
        float: Normalized score in [0.0, 100.0].
    """
    if normalization_type == "linear":
        return normalize_linear(
            value,
            target_good=config.get("target_good", 100),
            target_poor=config.get("target_poor", 0),
            invert=config.get("invert", False),
        )
    elif normalization_type == "logarithmic":
        return normalize_logarithmic(
            value,
            target_good=config.get("target_good", 10000),
        )
    elif normalization_type == "step":
        return normalize_step(
            value,
            steps=config.get("steps", DEFAULT_RESPONSE_TIME_STEPS),
        )
    elif normalization_type == "binary":
        return normalize_binary(
            value,
            threshold=config.get("threshold", 1),
            above=config.get("above", True),
        )
    else:
        # Default to linear higher-is-better for unknown types
        return normalize_linear(
            value,
            target_good=config.get("target_good", 100),
            target_poor=config.get("target_poor", 0),
        )


def _step_weight(normalized_items):
    """
    Step 3: Apply weights to normalized scores.

    Multiplies each normalized score by its weight percentage.

    Args:
        normalized_items: List of items with normalized_score and weight.

    Returns:
        list: Items enriched with weighted_score.
    """
    result = []
    for item in normalized_items:
        weighted_score = item["normalized_score"] * safe_divide(item["weight"], 100, default=0)
        result.append({
            **item,
            "weighted_score": weighted_score,
        })
    return result


def _step_aggregate(weighted_items):
    """
    Step 4: Aggregate weighted scores into a base score.

    Sums all weighted scores. If weights sum to 100%, the base score
    will be in [0, 100]. If weights don't sum to 100%, the score is
    proportionally adjusted.

    Args:
        weighted_items: List of items with weighted_score.

    Returns:
        float: Aggregated base score.
    """
    total_weighted = sum(item["weighted_score"] for item in weighted_items)
    total_weight = sum(item["weight"] for item in weighted_items)

    # If weights don't sum to 100, normalize proportionally
    if total_weight > 0 and abs(total_weight - 100) > 0.01:
        return safe_divide(total_weighted * 100, total_weight, default=0)

    return total_weighted


def _step_curve(base_score, curve=None):
    """
    Step 5: Apply optional scoring curve adjustment.

    Supports curve types:
        - "none": No adjustment (default)
        - "linear_boost": Multiply by factor (e.g., 1.05 for 5% boost)
        - "sqrt": Square root scaling (compresses high scores,
          expands low scores)

    Args:
        base_score: The aggregated base score from Step 4.
        curve: Optional dict with "type" and "factor" keys.

    Returns:
        float: Curve-adjusted score.
    """
    if not curve:
        return base_score

    curve_type = curve.get("type", "none")
    factor = flt(curve.get("factor", 1.0))

    if curve_type == "none":
        return base_score
    elif curve_type == "linear_boost":
        return base_score * factor
    elif curve_type == "sqrt":
        # Scale: sqrt(score/100) * 100 * factor
        if base_score <= 0:
            return 0.0
        import math
        return math.sqrt(safe_divide(base_score, 100, default=0)) * 100.0 * factor
    else:
        return base_score


def _step_penalties(score, penalties=None):
    """
    Step 6: Apply penalty deductions.

    Subtracts penalty points based on policy violations and any
    additional penalty amount.

    Args:
        score: Current score after curve adjustment.
        penalties: Optional dict with:
            - policy_violations (int): Number of violations
            - penalty_per_violation (float): Points deducted per violation
            - additional_penalty (float): Extra penalty points

    Returns:
        dict: {
            "score_after": float (score after penalties),
            "total_penalty": float (total points deducted),
            "detail": dict (breakdown of penalty components)
        }
    """
    if not penalties:
        return {
            "score_after": score,
            "total_penalty": 0.0,
            "detail": {
                "policy_violations": 0,
                "violation_penalty": 0.0,
                "additional_penalty": 0.0,
            },
        }

    violations = max(0, int(penalties.get("policy_violations", 0)))
    per_violation = flt(penalties.get("penalty_per_violation", 5.0))
    additional = flt(penalties.get("additional_penalty", 0))

    violation_penalty = violations * per_violation
    total_penalty = violation_penalty + additional

    return {
        "score_after": score - total_penalty,
        "total_penalty": total_penalty,
        "detail": {
            "policy_violations": violations,
            "violation_penalty": round(violation_penalty, 2),
            "additional_penalty": round(additional, 2),
        },
    }


def _step_bonuses(score, bonuses=None):
    """
    Step 7: Apply bonus additions.

    Adds bonus points for tenure, consistency, and improvement.

    Args:
        score: Current score after penalties.
        bonuses: Optional dict with:
            - tenure_bonus (float): Points for seller tenure
            - consistency_bonus (float): Points for consistent performance
            - improvement_bonus (float): Points for score improvement trend

    Returns:
        dict: {
            "score_after": float (score after bonuses),
            "total_bonus": float (total points added),
            "detail": dict (breakdown of bonus components)
        }
    """
    if not bonuses:
        return {
            "score_after": score,
            "total_bonus": 0.0,
            "detail": {
                "tenure_bonus": 0.0,
                "consistency_bonus": 0.0,
                "improvement_bonus": 0.0,
            },
        }

    tenure = flt(bonuses.get("tenure_bonus", 0))
    consistency = flt(bonuses.get("consistency_bonus", 0))
    improvement = flt(bonuses.get("improvement_bonus", 0))

    total_bonus = tenure + consistency + improvement

    return {
        "score_after": score + total_bonus,
        "total_bonus": total_bonus,
        "detail": {
            "tenure_bonus": round(tenure, 2),
            "consistency_bonus": round(consistency, 2),
            "improvement_bonus": round(improvement, 2),
        },
    }


def _step_finalize(score):
    """
    Step 8: Finalize the score.

    Clamps the score to [0, 100] and rounds to 2 decimal places.

    Args:
        score: The score after all adjustments.

    Returns:
        float: Final score in [0.0, 100.0], rounded to 2 decimal places.
    """
    return round(max(0.0, min(100.0, score)), 2)


def _build_default_items():
    """
    Build the default seller KPI template items from DEFAULT_SELLER_METRICS.

    Returns:
        list: List of template item dicts with kpi_code, metric_field,
            weight, normalization_type, and config.
    """
    items = []
    for kpi_code, metric_field, weight, norm_type, config in DEFAULT_SELLER_METRICS:
        items.append({
            "kpi_code": kpi_code,
            "metric_field": metric_field,
            "weight": weight,
            "normalization_type": norm_type,
            "config": config,
        })
    return items
