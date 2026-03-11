# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Variant Request Scheduled Tasks

Scheduler jobs for demand aggregation recalculation.
"""

import frappe
from frappe import _
from frappe.utils import today


def recalculate_demand_aggregations():
    """
    Daily job: Recalculate demand aggregation fields for all active demand groups.

    Iterates through all unique demand_group_key values with active requests
    (Pending or Under Review) and recalculates:
    - demand_request_count: total number of requests in the group
    - demand_sellers_summary: comma-separated list of requesting sellers
    - demand_first_requested: earliest creation date in the group

    Updates all requests within each group with the recalculated values.
    """
    frappe.logger().info("Starting variant request demand aggregation recalculation...")

    try:
        # Get all unique demand group keys with active requests
        demand_groups = frappe.db.sql("""
            SELECT DISTINCT `demand_group_key`
            FROM `tabVariant Request`
            WHERE `demand_group_key` IS NOT NULL
              AND `demand_group_key` != ''
              AND `status` IN ('Pending', 'Under Review', 'Approved')
        """, as_dict=True)

        processed = 0
        errors = 0

        for group in demand_groups:
            try:
                _recalculate_group(group.demand_group_key)
                processed += 1
            except Exception as e:
                errors += 1
                frappe.log_error(
                    f"Error recalculating demand group {group.demand_group_key}: {str(e)}",
                    "Demand Aggregation Task"
                )

        frappe.db.commit()

        frappe.logger().info(
            f"Demand aggregation recalculation complete. "
            f"Processed: {processed}, Errors: {errors}"
        )

    except Exception as e:
        frappe.log_error(
            f"Error in demand aggregation recalculation: {str(e)}",
            "Demand Aggregation Task"
        )


def _recalculate_group(demand_group_key):
    """
    Recalculate demand aggregation for a single demand group.

    Args:
        demand_group_key (str): The demand group key to recalculate.
    """
    # Get all requests in this demand group
    group_requests = frappe.db.get_all(
        "Variant Request",
        filters={
            "demand_group_key": demand_group_key,
            "status": ("in", ["Pending", "Under Review", "Approved"])
        },
        fields=["name", "requesting_seller", "creation"],
        order_by="creation asc"
    )

    if not group_requests:
        return

    # Calculate aggregation values
    request_count = len(group_requests)
    sellers = list(set(r.requesting_seller for r in group_requests))
    sellers_summary = ", ".join(sellers[:10])
    if len(sellers) > 10:
        sellers_summary += f" (+{len(sellers) - 10} more)"

    first_requested = (
        group_requests[0].creation.date()
        if group_requests[0].creation
        else today()
    )

    # Update all requests in the group
    for req in group_requests:
        frappe.db.set_value(
            "Variant Request",
            req.name,
            {
                "demand_request_count": request_count,
                "demand_sellers_summary": sellers_summary,
                "demand_first_requested": first_requested
            },
            update_modified=False
        )
