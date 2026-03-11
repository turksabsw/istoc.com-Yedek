# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Seller Tags Scheduled Tasks

Scheduler jobs for metrics refresh and rule evaluation.
Includes grace period and warning lifecycle management
for seller tag assignments.
"""

import json

import frappe
from frappe import _
from frappe.utils import now_datetime


def refresh_seller_metrics():
    """
    Hourly job: Refresh seller metrics materialized view.

    Runs for all active sellers to keep metrics up-to-date.
    """
    from tradehub_seller.tradehub_seller.seller_tags.seller_metrics import refresh_all_seller_metrics

    frappe.logger().info("Starting seller metrics refresh...")

    try:
        count = refresh_all_seller_metrics()
        frappe.logger().info(f"Refreshed metrics for {count} sellers")
    except Exception as e:
        frappe.log_error(
            f"Error in seller metrics refresh: {str(e)}",
            "Seller Metrics Task"
        )


def evaluate_all_rules():
    """
    Daily job: Evaluate all seller tag rules with scoring and lifecycle management.

    Processes each active seller against all enabled rules, evaluates
    with composite scoring, and manages tag assignment lifecycle:
    Active → Warning → Grace Period → Expired.

    For each seller-tag pair:
    - Passed evaluation: status=Active, reset consecutive_failures
    - Score below warning_threshold_pct: status=Warning, send notification once
    - consecutive_failures > grace_period_days: status=Grace Period
    - Grace period expired: status=Expired
    - Stores score_snapshot JSON and composite_score on each evaluation
    """
    from tradehub_seller.tradehub_seller.seller_tags.rule_engine import RuleEngine

    frappe.logger().info("Starting seller tag rule evaluation...")

    engine = RuleEngine()

    # Get all active sellers
    sellers = frappe.get_all(
        "Seller Profile",
        filters={"status": ["in", ["Active", "Verified"]]},
        fields=["name"]
    )

    # Get all enabled rules with scoring config
    rules = frappe.get_all(
        "Seller Tag Rule",
        filters={"enabled": 1},
        fields=["name", "target_tag", "grace_period_days", "warning_threshold_pct"]
    )

    processed = 0
    errors = 0

    for seller in sellers:
        try:
            _evaluate_seller_tag_rules(engine, seller.name, rules)
            processed += 1

        except Exception as e:
            errors += 1
            frappe.log_error(
                f"Error evaluating rules for seller {seller.name}: {str(e)}",
                "Rule Evaluation Task"
            )

    frappe.db.commit()

    frappe.logger().info(
        f"Rule evaluation complete. Processed: {processed}, Errors: {errors}"
    )


def _evaluate_seller_tag_rules(engine, seller_id, rules):
    """
    Evaluate all rules for a single seller with scoring and lifecycle management.

    Groups rules by target tag, picks the best evaluation per tag,
    then manages the assignment lifecycle accordingly.

    Args:
        engine: RuleEngine instance
        seller_id: Seller Profile name
        rules: List of enabled rule records with scoring config
    """
    from tradehub_seller.tradehub_seller.seller_tags.seller_metrics import get_seller_metrics

    metrics = get_seller_metrics(seller_id)
    if not metrics:
        return

    # Evaluate all rules and group best result per target tag
    tag_evaluations = {}

    for rule in rules:
        try:
            rule_doc = frappe.get_doc("Seller Tag Rule", rule.name)
            result = engine.evaluate_rule_with_score(rule_doc, metrics)

            tag = rule.target_tag

            score_snapshot = json.dumps({
                "composite_score": result.get("composite_score", 0),
                "condition_scores": result.get("condition_scores", []),
                "evaluation_method": result.get("evaluation_method", ""),
                "evaluated_at": str(now_datetime()),
            })

            existing = tag_evaluations.get(tag)

            # Keep the best result for each tag:
            # - Any passing result takes priority over failing ones
            # - Among failing results, keep the highest composite_score
            if (
                not existing
                or (result["passed"] and not existing["passed"])
                or (
                    not existing["passed"]
                    and not result["passed"]
                    and result.get("composite_score", 0) > existing.get("composite_score", 0)
                )
            ):
                tag_evaluations[tag] = {
                    "passed": result["passed"] or (existing["passed"] if existing else False),
                    "composite_score": result.get("composite_score", 0),
                    "score_snapshot": score_snapshot,
                    "warning_threshold": (rule.warning_threshold_pct or 80) / 100.0,
                    "grace_period_days": rule.grace_period_days or 3,
                }

        except Exception as e:
            frappe.log_error(
                f"Error evaluating rule {rule.name} for seller {seller_id}: {str(e)}",
                "Rule Evaluation Task"
            )

    # Process each tag evaluation result
    for tag, evaluation in tag_evaluations.items():
        try:
            if evaluation["passed"]:
                _handle_passed_evaluation(engine, seller_id, tag, evaluation)
            else:
                _handle_failed_evaluation(seller_id, tag, evaluation)
        except Exception as e:
            frappe.log_error(
                f"Error processing tag {tag} for seller {seller_id}: {str(e)}",
                "Rule Evaluation Task"
            )


def _handle_passed_evaluation(engine, seller_id, tag, evaluation):
    """
    Handle a passed rule evaluation for a seller-tag pair.

    Resets the assignment to Active status, clears failure counters,
    and stores the latest score snapshot.

    Args:
        engine: RuleEngine instance
        seller_id: Seller Profile name
        tag: Seller Tag name
        evaluation: Dict with composite_score, score_snapshot
    """
    existing = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller_id, "tag": tag},
        fields=["name", "source", "override_state"],
        limit=1
    )

    if existing:
        doc = frappe.get_doc("Seller Tag Assignment", existing[0].name)

        # Skip manual and forced-off assignments
        if doc.override_state == "ForcedOff" or doc.source == "Manual":
            return

        # Reset to Active with updated scores
        doc.status = "Active"
        doc.composite_score = evaluation["composite_score"]
        doc.score_snapshot = evaluation["score_snapshot"]
        doc.consecutive_failures = 0
        doc.last_evaluated = now_datetime()
        doc.evaluation_passed = 1
        doc.warning_sent = 0
        doc.grace_period_start = None
        doc.grace_period_end = None
        doc.save(ignore_permissions=True)
    else:
        # Create new assignment with score data
        doc = frappe.get_doc({
            "doctype": "Seller Tag Assignment",
            "seller": seller_id,
            "tag": tag,
            "source": "Rule",
            "status": "Active",
            "composite_score": evaluation["composite_score"],
            "score_snapshot": evaluation["score_snapshot"],
            "consecutive_failures": 0,
            "last_evaluated": now_datetime(),
            "evaluation_passed": 1,
        })
        doc.insert(ignore_permissions=True)


def _handle_failed_evaluation(seller_id, tag, evaluation):
    """
    Handle a failed rule evaluation for a seller-tag pair.

    Manages the Warning → Grace Period → Expired lifecycle:
    1. Increments consecutive_failures on each failed evaluation
    2. When score < warning_threshold → status=Warning, sends notification once
    3. When consecutive_failures > grace_period_days → status=Grace Period
    4. When grace period end date passes → status=Expired

    Args:
        seller_id: Seller Profile name
        tag: Seller Tag name
        evaluation: Dict with composite_score, score_snapshot,
                    warning_threshold, grace_period_days
    """
    from frappe.utils import add_days, today, getdate

    existing = frappe.get_all(
        "Seller Tag Assignment",
        filters={"seller": seller_id, "tag": tag},
        fields=[
            "name", "source", "override_state", "status",
            "consecutive_failures", "warning_sent",
            "grace_period_start", "grace_period_end"
        ],
        limit=1
    )

    if not existing:
        return  # No existing assignment to manage

    doc = frappe.get_doc("Seller Tag Assignment", existing[0].name)

    # Skip manual and forced assignments
    if doc.source == "Manual" or doc.override_state in ("ForcedOn", "ForcedOff"):
        return

    # Already terminal — no further transitions
    if doc.status in ("Expired", "Revoked"):
        doc.composite_score = evaluation["composite_score"]
        doc.score_snapshot = evaluation["score_snapshot"]
        doc.last_evaluated = now_datetime()
        doc.evaluation_passed = 0
        doc.save(ignore_permissions=True)
        return

    # Update evaluation data
    doc.composite_score = evaluation["composite_score"]
    doc.score_snapshot = evaluation["score_snapshot"]
    doc.last_evaluated = now_datetime()
    doc.evaluation_passed = 0
    doc.consecutive_failures = (doc.consecutive_failures or 0) + 1

    composite_score = evaluation["composite_score"]
    warning_threshold = evaluation["warning_threshold"]
    grace_days = evaluation["grace_period_days"]

    # --- Lifecycle transitions (most severe first) ---

    # 1. Check grace period expiry → Expired
    if doc.status == "Grace Period" and doc.grace_period_end:
        if getdate(today()) > getdate(doc.grace_period_end):
            doc.status = "Expired"
            doc.save(ignore_permissions=True)
            return

    # 2. Check if should enter Grace Period
    if doc.consecutive_failures > grace_days:
        if doc.status != "Grace Period":
            doc.status = "Grace Period"
            doc.grace_period_start = today()
            doc.grace_period_end = add_days(today(), grace_days)

    # 3. Check warning threshold (only if not already in Grace Period)
    elif composite_score < warning_threshold:
        doc.status = "Warning"
        if not doc.warning_sent:
            _send_tag_warning_notification(seller_id, tag, composite_score)
            doc.warning_sent = 1
            doc.warning_sent_at = now_datetime()

    doc.save(ignore_permissions=True)


def _send_tag_warning_notification(seller_id, tag, score):
    """
    Send warning notification when a seller's tag score drops below threshold.

    Uses frappe.publish_realtime as a placeholder notification mechanism.
    Can be extended with email templates or custom notification logic.

    Args:
        seller_id: Seller Profile name
        tag: Seller Tag name
        score: Current composite score (0.0-1.0)
    """
    try:
        frappe.publish_realtime(
            "seller_tag_warning",
            {
                "seller": seller_id,
                "tag": tag,
                "score": score,
            },
            doctype="Seller Tag Assignment",
        )
        frappe.logger().info(
            f"Tag warning notification sent: seller={seller_id}, tag={tag}, score={score}"
        )
    except Exception as e:
        frappe.log_error(
            f"Error sending tag warning notification: {str(e)}",
            "Rule Evaluation Task"
        )


def cleanup_old_metrics():
    """
    Weekly job: Clean up old metrics records.

    Keeps only the last 30 days of metrics history.
    """
    from frappe.utils import add_days, today

    cutoff_date = add_days(today(), -30)

    frappe.logger().info(f"Cleaning up metrics older than {cutoff_date}")

    try:
        # Delete old metrics records
        deleted = frappe.db.sql("""
            DELETE FROM `tabSeller Metrics`
            WHERE calculation_date < %s
        """, cutoff_date)

        frappe.db.commit()
        frappe.logger().info("Old metrics cleanup complete")

    except Exception as e:
        frappe.log_error(
            f"Error in metrics cleanup: {str(e)}",
            "Metrics Cleanup Task"
        )


def evaluate_single_seller_rules(seller_id: str):
    """
    Evaluate rules for a single seller (for immediate updates).

    Refreshes metrics first, then evaluates all rules with
    the same scoring and lifecycle logic as evaluate_all_rules().

    Args:
        seller_id: Seller Profile name
    """
    from tradehub_seller.tradehub_seller.seller_tags.rule_engine import RuleEngine
    from tradehub_seller.tradehub_seller.seller_tags.seller_metrics import (
        refresh_seller_metrics as _refresh_seller_metrics,
    )

    # First refresh metrics
    _refresh_seller_metrics(seller_id)

    # Get all enabled rules with scoring config
    rules = frappe.get_all(
        "Seller Tag Rule",
        filters={"enabled": 1},
        fields=["name", "target_tag", "grace_period_days", "warning_threshold_pct"]
    )

    # Evaluate with scoring and lifecycle management
    engine = RuleEngine()
    _evaluate_seller_tag_rules(engine, seller_id, rules)

    frappe.db.commit()
