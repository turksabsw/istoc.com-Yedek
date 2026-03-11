# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Rule Engine - AND/OR Condition Evaluator with Scoring Algorithms

Recursive rule evaluation engine for seller tag assignment.
Supports nested groups with AND/OR logic, plus weakest-link
and weighted-average scoring for child table conditions.
"""

import frappe
from frappe import _
from typing import Dict, Any, List, Optional, Callable, Tuple
import json


# Metrics where lower values indicate better performance
LOWER_IS_BETTER = {
    "cancellation_rate",
    "return_rate",
    "complaint_rate",
    "avg_response_time_hours",
}


# Operator mapping for condition evaluation
OPERATORS: Dict[str, Callable[[Any, Any], bool]] = {
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    ">": lambda a, b: float(a) > float(b) if a is not None else False,
    ">=": lambda a, b: float(a) >= float(b) if a is not None else False,
    "<": lambda a, b: float(a) < float(b) if a is not None else False,
    "<=": lambda a, b: float(a) <= float(b) if a is not None else False,
    "in": lambda a, b: a in (b if isinstance(b, (list, tuple)) else [b]),
    "not_in": lambda a, b: a not in (b if isinstance(b, (list, tuple)) else [b]),
    "contains": lambda a, b: str(b).lower() in str(a).lower() if a else False,
    "not_contains": lambda a, b: str(b).lower() not in str(a).lower() if a else True,
    "is_set": lambda a, b: a is not None and a != "",
    "is_not_set": lambda a, b: a is None or a == "",
    "starts_with": lambda a, b: str(a).lower().startswith(str(b).lower()) if a else False,
    "ends_with": lambda a, b: str(a).lower().endswith(str(b).lower()) if a else False,
}


def evaluate_condition(condition: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
    """
    Evaluate a single condition against seller metrics.

    Args:
        condition: Dict with field, operator, value keys
        metrics: Dict of seller metric values

    Returns:
        bool: True if condition is satisfied
    """
    field = condition.get("field")
    operator = condition.get("operator")
    target_value = condition.get("value")

    if not field or not operator:
        frappe.log_error(
            f"Invalid condition: missing field or operator. Condition: {condition}",
            "Rule Engine"
        )
        return False

    if operator not in OPERATORS:
        frappe.log_error(
            f"Unknown operator: {operator}",
            "Rule Engine"
        )
        return False

    field_value = metrics.get(field)

    try:
        result = OPERATORS[operator](field_value, target_value)
        return result
    except Exception as e:
        frappe.log_error(
            f"Error evaluating condition: {condition}, metrics: {metrics}, error: {str(e)}",
            "Rule Engine"
        )
        return False


def evaluate_group(group: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
    """
    Evaluate a group of conditions with AND/OR logic.

    Args:
        group: Dict with group_logic and conditions keys
        metrics: Dict of seller metric values

    Returns:
        bool: True if group conditions are satisfied
    """
    group_logic = group.get("group_logic", "AND").upper()
    conditions = group.get("conditions", [])

    if not conditions:
        return True  # Empty group always passes

    condition_results = [
        evaluate_condition(condition, metrics)
        for condition in conditions
    ]

    if group_logic == "AND":
        return all(condition_results)
    else:  # OR
        return any(condition_results)


def evaluate_conditions(rule: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
    """
    Evaluate rule conditions recursively with AND/OR logic.

    Args:
        rule: Dict with logic and groups keys
        metrics: Dict of seller metric values

    Returns:
        bool: True if all rule conditions are satisfied
    """
    logic = rule.get("logic", "AND").upper()
    groups = rule.get("groups", [])

    if not groups:
        return True  # No groups means rule always passes

    group_results = [
        evaluate_group(group, metrics)
        for group in groups
    ]

    if logic == "AND":
        return all(group_results)
    else:  # OR
        return any(group_results)


def score_condition(condition, metrics: Dict[str, Any]) -> float:
    """
    Score a single condition against seller metrics on a 0-1 scale.

    For LOWER_IS_BETTER metrics: score = min(1.0, threshold / actual)
    For other metrics: score = min(1.0, actual / threshold)

    Args:
        condition: Child table row or dict with metric_field, threshold_value
        metrics: Dict of seller metric values

    Returns:
        float: Score between 0.0 and 1.0
    """
    field = (
        condition.get("metric_field")
        if isinstance(condition, dict)
        else getattr(condition, "metric_field", None)
    )
    threshold = (
        condition.get("threshold_value")
        if isinstance(condition, dict)
        else getattr(condition, "threshold_value", None)
    )

    if not field or threshold is None:
        frappe.log_error(
            f"Invalid scoring condition: missing metric_field or threshold_value. "
            f"Condition: {condition}",
            "Rule Engine"
        )
        return 0.0

    try:
        threshold = float(threshold)
        actual = float(metrics.get(field, 0) or 0)
    except (TypeError, ValueError) as e:
        frappe.log_error(
            f"Error converting values for scoring: field={field}, "
            f"actual={metrics.get(field)}, threshold={threshold}, error={str(e)}",
            "Rule Engine"
        )
        return 0.0

    if field in LOWER_IS_BETTER:
        # Lower actual values are better
        return min(1.0, threshold / actual) if actual > 0 else 1.0
    else:
        # Higher actual values are better
        return min(1.0, actual / threshold) if threshold > 0 else 0.0


def evaluate_child_conditions(
    conditions: List,
    metrics: Dict[str, Any],
    scoring_method: str = "All Must Pass"
) -> Dict[str, Any]:
    """
    Evaluate child table conditions using the specified scoring method.

    Supports three scoring methods:
    - All Must Pass: all conditions must pass (boolean, existing behavior)
    - Weakest Link: composite_score = min(all condition scores)
    - Weighted Average: composite_score = Σ(weight×score)/Σ(weight)

    Args:
        conditions: List of child table condition rows
        metrics: Dict of seller metric values
        scoring_method: One of "All Must Pass", "Weakest Link", "Weighted Average"

    Returns:
        Dict with keys:
            - passed (bool): Whether the rule is satisfied
            - composite_score (float): Overall score 0.0-1.0
            - condition_scores (list): Individual score details
    """
    if not conditions:
        return {
            "passed": True,
            "composite_score": 1.0,
            "condition_scores": [],
        }

    condition_scores = []

    for condition in conditions:
        # Extract condition fields (support both dict and object)
        if isinstance(condition, dict):
            field = condition.get("metric_field")
            operator = condition.get("operator")
            threshold = condition.get("threshold_value")
            weight = float(condition.get("weight", 1.0) or 1.0)
        else:
            field = getattr(condition, "metric_field", None)
            operator = getattr(condition, "operator", None)
            threshold = getattr(condition, "threshold_value", None)
            weight = float(getattr(condition, "weight", 1.0) or 1.0)

        # Calculate score for this condition
        score = score_condition(condition, metrics)

        # Evaluate boolean pass/fail using operator
        passed = True
        if field and operator and threshold is not None:
            eval_condition = {
                "field": field,
                "operator": operator,
                "value": threshold,
            }
            passed = evaluate_condition(eval_condition, metrics)

        condition_scores.append({
            "field": field,
            "score": score,
            "weight": weight,
            "passed": passed,
        })

    # Calculate composite score based on scoring method
    if scoring_method == "Weakest Link":
        composite_score = min(cs["score"] for cs in condition_scores)
        overall_passed = composite_score > 0

    elif scoring_method == "Weighted Average":
        total_weight = sum(cs["weight"] for cs in condition_scores)
        if total_weight > 0:
            composite_score = sum(
                cs["weight"] * cs["score"] for cs in condition_scores
            ) / total_weight
        else:
            composite_score = 0.0
        overall_passed = composite_score > 0

    else:
        # All Must Pass (default)
        overall_passed = all(cs["passed"] for cs in condition_scores)
        composite_score = (
            min(cs["score"] for cs in condition_scores) if overall_passed else 0.0
        )

    return {
        "passed": overall_passed,
        "composite_score": round(composite_score, 4),
        "condition_scores": condition_scores,
    }


class RuleEngine:
    """
    Rule Engine for evaluating seller tag rules.

    Supports:
    - AND/OR logic at rule level
    - AND/OR logic at group level
    - Multiple operators (==, !=, >, >=, <, <=, in, not_in, contains, etc.)
    - Manual override priority (Manual > Rule)
    - Weakest Link scoring (composite = min of all condition scores)
    - Weighted Average scoring (composite = Σ(weight×score)/Σ(weight))
    - Hybrid evaluation (rule_json vs child table conditions)
    """

    def __init__(self):
        self.evaluation_cache: Dict[str, bool] = {}

    def clear_cache(self):
        """Clear the evaluation cache."""
        self.evaluation_cache = {}

    def evaluate_rule(self, rule_doc, metrics: Dict[str, Any]) -> bool:
        """
        Evaluate a Seller Tag Rule document against metrics.

        Uses hybrid evaluation:
        - If rule_json is populated → use existing JSON evaluator
        - If rule_json is empty → use child table conditions evaluator

        Args:
            rule_doc: Seller Tag Rule document or rule name
            metrics: Dict of seller metric values

        Returns:
            bool: True if rule conditions are satisfied
        """
        result = self.evaluate_rule_with_score(rule_doc, metrics)
        return result["passed"]

    def evaluate_rule_with_score(
        self, rule_doc, metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate a Seller Tag Rule and return detailed scoring results.

        Uses hybrid evaluation:
        - If rule_json is populated → use existing JSON evaluator
        - If rule_json is empty → use child table conditions evaluator

        Args:
            rule_doc: Seller Tag Rule document or rule name
            metrics: Dict of seller metric values

        Returns:
            Dict with keys:
                - passed (bool): Whether the rule is satisfied
                - composite_score (float): Overall score 0.0-1.0
                - condition_scores (list): Individual score details
                - evaluation_method (str): "rule_json" or "child_conditions"
        """
        if isinstance(rule_doc, str):
            rule_doc = frappe.get_doc("Seller Tag Rule", rule_doc)

        if not rule_doc.enabled:
            return {
                "passed": False,
                "composite_score": 0.0,
                "condition_scores": [],
                "evaluation_method": "disabled",
            }

        # Hybrid evaluation: check if rule_json is populated
        has_rule_json = False
        if rule_doc.rule_json:
            try:
                rule_config = json.loads(rule_doc.rule_json)
                if rule_config:
                    has_rule_json = True
            except json.JSONDecodeError:
                frappe.log_error(
                    f"Invalid JSON in rule: {rule_doc.name}",
                    "Rule Engine"
                )

        if has_rule_json:
            # Use existing JSON evaluator
            passed = evaluate_conditions(rule_config, metrics)
            return {
                "passed": passed,
                "composite_score": 1.0 if passed else 0.0,
                "condition_scores": [],
                "evaluation_method": "rule_json",
            }

        # Use child table conditions evaluator
        conditions = rule_doc.get("conditions") or []
        if not conditions:
            return {
                "passed": True,
                "composite_score": 1.0,
                "condition_scores": [],
                "evaluation_method": "child_conditions",
            }

        scoring_method = getattr(
            rule_doc, "scoring_method", "All Must Pass"
        ) or "All Must Pass"

        result = evaluate_child_conditions(conditions, metrics, scoring_method)
        result["evaluation_method"] = "child_conditions"
        return result

    def evaluate_all_rules_for_seller(self, seller_id: str) -> List[str]:
        """
        Evaluate all enabled rules for a seller.

        Args:
            seller_id: Seller Profile name

        Returns:
            List of tag names that should be assigned
        """
        from tradehub_seller.tradehub_seller.seller_tags.seller_metrics import get_seller_metrics

        # Get current metrics
        metrics = get_seller_metrics(seller_id)
        if not metrics:
            return []

        # Get all enabled rules
        rules = frappe.get_all(
            "Seller Tag Rule",
            filters={"enabled": 1},
            fields=["name", "target_tag", "rule_json"]
        )

        tags_to_assign = []
        for rule in rules:
            try:
                rule_config = json.loads(rule.rule_json) if rule.rule_json else {}
                if evaluate_conditions(rule_config, metrics):
                    tags_to_assign.append(rule.target_tag)
            except Exception as e:
                frappe.log_error(
                    f"Error evaluating rule {rule.name}: {str(e)}",
                    "Rule Engine"
                )

        return tags_to_assign

    def apply_tag_assignment(
        self,
        seller: str,
        tag: str,
        source: str = "Rule"
    ) -> Optional[str]:
        """
        Apply a tag assignment respecting override priority.

        Priority: Manual > Rule

        Args:
            seller: Seller Profile name
            tag: Seller Tag name
            source: "Manual" or "Rule"

        Returns:
            Assignment name if created/updated, None if skipped
        """
        existing = frappe.get_all(
            "Seller Tag Assignment",
            filters={"seller": seller, "tag": tag},
            fields=["name", "source", "override_state"]
        )

        if existing:
            doc = frappe.get_doc("Seller Tag Assignment", existing[0].name)

            # Skip if manually forced off
            if doc.override_state == "ForcedOff":
                return None

            # Manual takes priority over Rule
            if source == "Rule" and doc.source == "Manual":
                return None

            # Update existing assignment
            if source == "Rule":
                doc.last_evaluated = frappe.utils.now_datetime()
                doc.save(ignore_permissions=True)
                return doc.name
        else:
            # Create new assignment
            doc = frappe.get_doc({
                "doctype": "Seller Tag Assignment",
                "seller": seller,
                "tag": tag,
                "source": source,
                "assigned_at": frappe.utils.now_datetime(),
                "last_evaluated": frappe.utils.now_datetime() if source == "Rule" else None
            })
            doc.insert(ignore_permissions=True)
            return doc.name

        return None

    def remove_unqualified_tags(
        self,
        seller: str,
        qualified_tags: List[str]
    ):
        """
        Remove rule-based tags that seller no longer qualifies for.

        Args:
            seller: Seller Profile name
            qualified_tags: List of tag names seller currently qualifies for
        """
        # Get all rule-based assignments for this seller
        assignments = frappe.get_all(
            "Seller Tag Assignment",
            filters={
                "seller": seller,
                "source": "Rule",
                "override_state": ["!=", "ForcedOn"]
            },
            fields=["name", "tag"]
        )

        for assignment in assignments:
            if assignment.tag not in qualified_tags:
                frappe.delete_doc(
                    "Seller Tag Assignment",
                    assignment.name,
                    ignore_permissions=True
                )
