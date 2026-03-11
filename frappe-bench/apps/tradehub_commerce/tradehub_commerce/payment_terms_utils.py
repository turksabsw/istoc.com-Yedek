# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Payment Terms Utilities

Whitelist APIs for payment terms resolution, due date calculation,
deposit amounts, installment schedules, and late penalty computation.
"""

import frappe
from frappe import _
from frappe.utils import getdate, add_days, date_diff, flt, nowdate
from typing import Dict, Any, List, Optional


def _response(success: bool, data: Any = None, message: str = None, errors: List = None) -> Dict:
    """Standard API response format."""
    return {
        "success": success,
        "data": data,
        "message": message,
        "errors": errors or []
    }


def _get_advance_template() -> Optional[Dict]:
    """Get the platform default Advance payment terms template."""
    template = frappe.db.get_value(
        "Marketplace Payment Terms Template",
        {"term_type": "Advance", "is_active": 1},
        ["name", "template_code", "template_name", "term_type", "due_days",
         "deposit_percentage", "late_penalty_rate", "installment_count",
         "installment_interval_days", "description"],
        as_dict=True
    )
    return template


def _match_rule(rule: Dict, buyer_group: str = None, order_amount: float = 0,
                currency: str = None, product_category: str = None) -> bool:
    """Check if a rule's conditions match the given context."""
    # All conditions must match (AND logic). Empty/null conditions are wildcards.
    if rule.get("buyer_group") and buyer_group and rule["buyer_group"] != buyer_group:
        return False

    if flt(rule.get("min_amount")) > 0 and flt(order_amount) < flt(rule["min_amount"]):
        return False

    if rule.get("currency") and currency and rule["currency"] != currency:
        return False

    if rule.get("product_category") and product_category and rule["product_category"] != product_category:
        return False

    return True


@frappe.whitelist()
def get_applicable_payment_terms(
    seller: str,
    buyer_group: str = None,
    order_amount: float = 0,
    currency: str = None,
    product_category: str = None
) -> Dict:
    """
    Resolve applicable payment terms using priority-based conditional rules.

    Fallback chain: seller rules -> seller default template -> platform default -> Advance.

    Args:
        seller: Seller Profile name
        buyer_group: Buyer's group classification
        order_amount: Order total amount
        currency: Order currency
        product_category: Primary product category

    Returns:
        API response with resolved payment terms template
    """
    try:
        if not seller:
            return _response(False, message=_("Seller is required"))

        order_amount = flt(order_amount)

        # Step 1: Find active Seller Payment Terms for this seller
        seller_payment_terms = frappe.db.get_value(
            "Seller Payment Terms",
            {"seller": seller, "status": "Active"},
            ["name", "default_template", "is_default"],
            as_dict=True
        )

        if seller_payment_terms:
            # Step 2: Get rules sorted by priority (lower = higher priority)
            rules = frappe.get_all(
                "Seller Payment Terms Rule",
                filters={"parent": seller_payment_terms.name, "parenttype": "Seller Payment Terms"},
                fields=["priority", "buyer_group", "min_amount", "currency",
                         "product_category", "marketplace_payment_terms_template"],
                order_by="priority asc"
            )

            # Step 3: Find first matching rule
            for rule in rules:
                if _match_rule(rule, buyer_group, order_amount, currency, product_category):
                    template_name = rule.get("marketplace_payment_terms_template")
                    if template_name:
                        template = frappe.db.get_value(
                            "Marketplace Payment Terms Template",
                            {"name": template_name, "is_active": 1},
                            ["name", "template_code", "template_name", "term_type", "due_days",
                             "deposit_percentage", "late_penalty_rate", "installment_count",
                             "installment_interval_days", "description"],
                            as_dict=True
                        )
                        if template:
                            return _response(True, data={
                                "template": template,
                                "source": "seller_rule",
                                "rule_priority": rule.get("priority")
                            })

            # Step 4: Fallback to seller's default template
            if seller_payment_terms.default_template:
                template = frappe.db.get_value(
                    "Marketplace Payment Terms Template",
                    {"name": seller_payment_terms.default_template, "is_active": 1},
                    ["name", "template_code", "template_name", "term_type", "due_days",
                     "deposit_percentage", "late_penalty_rate", "installment_count",
                     "installment_interval_days", "description"],
                    as_dict=True
                )
                if template:
                    return _response(True, data={
                        "template": template,
                        "source": "seller_default"
                    })

        # Step 5: Fallback to platform default (Advance)
        template = _get_advance_template()
        if template:
            return _response(True, data={
                "template": template,
                "source": "platform_default"
            })

        # Step 6: Hardcoded Advance fallback if no template exists
        return _response(True, data={
            "template": {
                "name": None,
                "template_code": "ADVANCE",
                "template_name": "Advance Payment",
                "term_type": "Advance",
                "due_days": 0,
                "deposit_percentage": 100,
                "late_penalty_rate": 0,
                "installment_count": 0,
                "installment_interval_days": 0,
                "description": "Full payment in advance"
            },
            "source": "hardcoded_fallback"
        })

    except Exception as e:
        frappe.log_error(f"Error resolving payment terms: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def calculate_due_dates(
    template_name: str,
    order_date: str = None
) -> Dict:
    """
    Calculate payment due dates based on a payment terms template.

    Args:
        template_name: Marketplace Payment Terms Template name
        order_date: Order date (defaults to today)

    Returns:
        API response with due date(s)
    """
    try:
        if not template_name:
            return _response(False, message=_("Template name is required"))

        template = frappe.db.get_value(
            "Marketplace Payment Terms Template",
            template_name,
            ["term_type", "due_days", "deposit_percentage", "installment_count",
             "installment_interval_days"],
            as_dict=True
        )

        if not template:
            return _response(False, message=_("Payment terms template not found"))

        base_date = getdate(order_date) if order_date else getdate(nowdate())
        due_days = template.due_days or 0
        term_type = template.term_type

        due_dates = []

        if term_type == "Advance":
            due_dates.append({
                "label": "Full Payment",
                "date": str(base_date),
                "percentage": 100
            })

        elif term_type == "COD":
            due_dates.append({
                "label": "Cash on Delivery",
                "date": str(base_date),
                "percentage": 100
            })

        elif term_type == "Net Days":
            due_dates.append({
                "label": f"Net {due_days} Days",
                "date": str(add_days(base_date, due_days)),
                "percentage": 100
            })

        elif term_type == "Deposit-Balance":
            deposit_pct = flt(template.deposit_percentage) or 0
            due_dates.append({
                "label": "Deposit",
                "date": str(base_date),
                "percentage": deposit_pct
            })
            due_dates.append({
                "label": "Balance",
                "date": str(add_days(base_date, due_days)),
                "percentage": 100 - deposit_pct
            })

        elif term_type == "Installment":
            count = template.installment_count or 1
            interval = template.installment_interval_days or 30
            pct_per_installment = round(100.0 / count, 2)

            for i in range(count):
                # Adjust last installment to account for rounding
                pct = pct_per_installment if i < count - 1 else round(100 - pct_per_installment * (count - 1), 2)
                due_dates.append({
                    "label": f"Installment {i + 1} of {count}",
                    "date": str(add_days(base_date, interval * i)),
                    "percentage": pct
                })

        elif term_type in ("Escrow", "Letter of Credit"):
            due_dates.append({
                "label": term_type,
                "date": str(add_days(base_date, due_days)),
                "percentage": 100
            })

        return _response(True, data={
            "term_type": term_type,
            "order_date": str(base_date),
            "due_dates": due_dates
        })

    except Exception as e:
        frappe.log_error(f"Error calculating due dates: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def calculate_deposit_amount(
    template_name: str,
    total_amount: float
) -> Dict:
    """
    Calculate the deposit amount for a Deposit-Balance payment terms template.

    Args:
        template_name: Marketplace Payment Terms Template name
        total_amount: Total order amount

    Returns:
        API response with deposit and balance amounts
    """
    try:
        if not template_name:
            return _response(False, message=_("Template name is required"))

        total_amount = flt(total_amount)
        if total_amount <= 0:
            return _response(False, message=_("Total amount must be greater than zero"))

        template = frappe.db.get_value(
            "Marketplace Payment Terms Template",
            template_name,
            ["term_type", "deposit_percentage"],
            as_dict=True
        )

        if not template:
            return _response(False, message=_("Payment terms template not found"))

        deposit_pct = flt(template.deposit_percentage) or 0
        deposit_amount = flt(total_amount * deposit_pct / 100, 2)
        balance_amount = flt(total_amount - deposit_amount, 2)

        return _response(True, data={
            "term_type": template.term_type,
            "deposit_percentage": deposit_pct,
            "deposit_amount": deposit_amount,
            "balance_amount": balance_amount,
            "total_amount": total_amount
        })

    except Exception as e:
        frappe.log_error(f"Error calculating deposit amount: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def generate_installment_schedule(
    template_name: str,
    total_amount: float,
    start_date: str = None
) -> Dict:
    """
    Generate an installment payment schedule.

    Args:
        template_name: Marketplace Payment Terms Template name
        total_amount: Total order amount
        start_date: Schedule start date (defaults to today)

    Returns:
        API response with installment schedule
    """
    try:
        if not template_name:
            return _response(False, message=_("Template name is required"))

        total_amount = flt(total_amount)
        if total_amount <= 0:
            return _response(False, message=_("Total amount must be greater than zero"))

        template = frappe.db.get_value(
            "Marketplace Payment Terms Template",
            template_name,
            ["term_type", "installment_count", "installment_interval_days",
             "deposit_percentage"],
            as_dict=True
        )

        if not template:
            return _response(False, message=_("Payment terms template not found"))

        base_date = getdate(start_date) if start_date else getdate(nowdate())
        count = template.installment_count or 1
        interval = template.installment_interval_days or 30

        # For Deposit-Balance, first installment is the deposit
        if template.term_type == "Deposit-Balance":
            deposit_pct = flt(template.deposit_percentage) or 0
            deposit_amount = flt(total_amount * deposit_pct / 100, 2)
            balance_amount = flt(total_amount - deposit_amount, 2)

            schedule = [
                {
                    "installment_number": 1,
                    "due_date": str(base_date),
                    "amount": deposit_amount,
                    "percentage": deposit_pct,
                    "label": "Deposit",
                    "status": "Pending"
                },
                {
                    "installment_number": 2,
                    "due_date": str(add_days(base_date, template.due_days or 30)),
                    "amount": balance_amount,
                    "percentage": 100 - deposit_pct,
                    "label": "Balance",
                    "status": "Pending"
                }
            ]
        else:
            # Equal installments
            amount_per = flt(total_amount / count, 2)
            schedule = []

            for i in range(count):
                # Last installment gets remainder to avoid rounding issues
                amt = amount_per if i < count - 1 else flt(total_amount - amount_per * (count - 1), 2)
                pct = round(100.0 / count, 2) if i < count - 1 else round(100 - round(100.0 / count, 2) * (count - 1), 2)

                schedule.append({
                    "installment_number": i + 1,
                    "due_date": str(add_days(base_date, interval * i)),
                    "amount": amt,
                    "percentage": pct,
                    "label": f"Installment {i + 1} of {count}",
                    "status": "Pending"
                })

        return _response(True, data={
            "term_type": template.term_type,
            "total_amount": total_amount,
            "installment_count": len(schedule),
            "schedule": schedule
        })

    except Exception as e:
        frappe.log_error(f"Error generating installment schedule: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def calculate_late_penalty(
    template_name: str,
    outstanding_amount: float,
    due_date: str,
    calculation_date: str = None
) -> Dict:
    """
    Calculate late penalty for an overdue payment.

    The late_penalty_rate is an annual percentage applied pro-rata to overdue days.

    Args:
        template_name: Marketplace Payment Terms Template name
        outstanding_amount: Amount that is overdue
        due_date: Original due date
        calculation_date: Date to calculate penalty as of (defaults to today)

    Returns:
        API response with penalty details
    """
    try:
        if not template_name:
            return _response(False, message=_("Template name is required"))

        outstanding_amount = flt(outstanding_amount)
        if outstanding_amount <= 0:
            return _response(False, message=_("Outstanding amount must be greater than zero"))

        template = frappe.db.get_value(
            "Marketplace Payment Terms Template",
            template_name,
            ["late_penalty_rate"],
            as_dict=True
        )

        if not template:
            return _response(False, message=_("Payment terms template not found"))

        calc_date = getdate(calculation_date) if calculation_date else getdate(nowdate())
        due = getdate(due_date)

        overdue_days = date_diff(calc_date, due)

        if overdue_days <= 0:
            return _response(True, data={
                "penalty_amount": 0,
                "overdue_days": 0,
                "annual_rate": flt(template.late_penalty_rate),
                "outstanding_amount": outstanding_amount,
                "is_overdue": False
            })

        annual_rate = flt(template.late_penalty_rate) or 0
        # Pro-rata: (annual_rate / 100) * (overdue_days / 365) * outstanding_amount
        penalty_amount = flt(outstanding_amount * (annual_rate / 100) * (overdue_days / 365), 2)

        return _response(True, data={
            "penalty_amount": penalty_amount,
            "overdue_days": overdue_days,
            "annual_rate": annual_rate,
            "outstanding_amount": outstanding_amount,
            "due_date": str(due),
            "calculation_date": str(calc_date),
            "is_overdue": True
        })

    except Exception as e:
        frappe.log_error(f"Error calculating late penalty: {str(e)}")
        return _response(False, message=str(e))
