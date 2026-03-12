# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

"""
Normalization Functions for TradeHub Seller Scoring.

Provides four normalization strategies used by the Seller Scoring Engine
(TASK-6):

    - normalize_linear: Linear interpolation between target bounds
      (supports both higher-is-better and lower-is-better via invert flag)
    - normalize_logarithmic: Logarithmic scaling for metrics with
      diminishing returns (e.g., total sales amount)
    - normalize_step: Step-function normalization with configurable
      threshold-to-score mappings (e.g., response time brackets)
    - normalize_binary: Binary 0-or-100 normalization based on a
      condition threshold (e.g., valid tracking uploaded yes/no)

All functions return a normalized score in the range [0.0, 100.0].
All division operations use safe_divide() to prevent ZeroDivisionError.

Usage:
    from tradehub_seller.tradehub_seller.scoring.normalizers import (
        normalize_linear,
        normalize_logarithmic,
        normalize_step,
        normalize_binary,
    )
"""

import math

from tradehub_core.tradehub_core.utils.safe_math import safe_divide


def normalize_linear(value, target_good, target_poor, invert=False):
    """
    Normalize a metric using linear interpolation between two bounds.

    Maps the value linearly from [target_poor, target_good] to [0, 100]
    when invert=False (higher is better). When invert=True (lower is better),
    maps from [target_good, target_poor] to [100, 0].

    Args:
        value: The raw metric value to normalize.
        target_good: The value representing excellent performance.
        target_poor: The value representing poor performance.
        invert: If True, lower values score higher (e.g., return_rate,
            dispute_rate). If False, higher values score higher
            (e.g., on_time_delivery_rate, avg_rating).

    Returns:
        float: Normalized score in [0.0, 100.0].

    Examples:
        >>> normalize_linear(100, 100, 0)
        100.0
        >>> normalize_linear(0, 100, 0)
        0.0
        >>> normalize_linear(50, 100, 0)
        50.0
        >>> normalize_linear(0, 0, 10, invert=True)
        100.0
        >>> normalize_linear(10, 0, 10, invert=True)
        0.0
        >>> normalize_linear(5, 0, 10, invert=True)
        50.0
    """
    if invert:
        # Lower is better
        if value <= target_good:
            return 100.0
        if value >= target_poor:
            return 0.0
        return safe_divide(target_poor - value, target_poor - target_good) * 100.0
    else:
        # Higher is better
        if value >= target_good:
            return 100.0
        if value <= target_poor:
            return 0.0
        return safe_divide(value - target_poor, target_good - target_poor) * 100.0


def normalize_logarithmic(value, target_good):
    """
    Normalize a metric using logarithmic scaling (diminishing returns).

    Useful for monetary values or counts where the difference between
    small values is more significant than between large values
    (e.g., total_sales_amount).

    Uses log10(value + 1) / log10(target_good + 1) to produce a score
    in [0, 100], capped at 100.

    Args:
        value: The raw metric value to normalize. Must be >= 0 for
            meaningful results.
        target_good: The value at which the metric scores 100.

    Returns:
        float: Normalized score in [0.0, 100.0].

    Examples:
        >>> normalize_logarithmic(10000, 10000)
        100.0
        >>> normalize_logarithmic(0, 10000)
        0.0
        >>> normalize_logarithmic(100000, 10000)
        100.0
    """
    if value <= 0:
        return 0.0
    return min(
        100.0,
        safe_divide(math.log10(value + 1), math.log10(target_good + 1)) * 100.0
    )


def normalize_step(value, steps):
    """
    Normalize a metric using step-function thresholds.

    Maps the value to a score based on a list of (threshold, score) tuples.
    Steps must be sorted in ascending order by threshold. The function
    returns the score for the highest threshold that the value meets or
    exceeds. If the value is below all thresholds, returns 0.0.

    This is useful for metrics with defined performance brackets, such as
    response time (e.g., <=4h=100, <=12h=80, <=24h=60, <=48h=30, >48h=0).

    Args:
        value: The raw metric value to normalize.
        steps: List of (threshold, score) tuples, sorted ascending by
            threshold. Each tuple defines "if value <= threshold, score
            this amount". The last step is the ceiling.

    Returns:
        float: Normalized score in [0.0, 100.0].

    Examples:
        >>> steps = [(4, 100), (12, 80), (24, 60), (48, 30)]
        >>> normalize_step(2, steps)
        100.0
        >>> normalize_step(10, steps)
        80.0
        >>> normalize_step(24, steps)
        60.0
        >>> normalize_step(72, steps)
        0.0
    """
    if not steps:
        return 0.0

    for threshold, score in steps:
        if value <= threshold:
            return float(score)

    # Value exceeds all thresholds
    return 0.0


def normalize_binary(value, threshold, above=True):
    """
    Normalize a metric using binary (pass/fail) logic.

    Returns 100.0 if the condition is met, 0.0 otherwise. Useful for
    boolean or threshold-based metrics where partial credit is not
    meaningful (e.g., has valid tracking uploaded, has completed
    verification).

    Args:
        value: The raw metric value to evaluate.
        threshold: The threshold for pass/fail determination.
        above: If True, value >= threshold scores 100 (pass when above).
            If False, value <= threshold scores 100 (pass when below).

    Returns:
        float: Either 0.0 or 100.0.

    Examples:
        >>> normalize_binary(95, 90)
        100.0
        >>> normalize_binary(85, 90)
        0.0
        >>> normalize_binary(3, 5, above=False)
        100.0
        >>> normalize_binary(7, 5, above=False)
        0.0
    """
    if above:
        return 100.0 if value >= threshold else 0.0
    else:
        return 100.0 if value <= threshold else 0.0
