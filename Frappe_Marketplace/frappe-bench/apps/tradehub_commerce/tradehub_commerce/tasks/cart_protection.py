"""
Cart Protection & Stock Reservation Scheduled Tasks

This module contains scheduler functions for managing cart protection,
stock reservations, and buyer abuse detection.

Tasks:
- check_expired_reservations: Every 5 min — releases expired stock reservations
- auto_cancel_overdue_orders: Every 15 min — cancels orders past payment deadline
- cart_health_check: Hourly — validates cart/session consistency
- daily_abuse_detection: Daily — analyzes patterns, creates Buyer Abuse Log entries
- cleanup_expired_reservations: Daily — hard-deletes old Released/Expired reservations
"""

import frappe
from frappe.utils import nowdate, now_datetime, add_days, getdate, get_datetime


def check_expired_reservations():
    """
    Scheduled task (every 5 minutes): Release expired stock reservations.

    This task:
    1. Queries all Active stock reservations past their expires_at timestamp
    2. Releases each reservation (restores available stock)
    3. Updates reservation status to Expired

    Business Rules:
    - Only processes reservations with status 'Active'
    - Reservation is expired when current time > expires_at
    - Stock quantity is restored to the product variant
    """
    frappe.logger().info("Running check_expired_reservations scheduled task")

    try:
        current_time = now_datetime()

        expired_reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "status": "Active",
                "expires_at": ["<", current_time]
            },
            fields=["name", "item_code", "quantity", "warehouse", "cart"]
        )

        released_count = 0

        for reservation in expired_reservations:
            try:
                release_reservation(reservation)
                released_count += 1
            except Exception as e:
                frappe.log_error(
                    message=f"Failed to release reservation {reservation.name}: {str(e)}",
                    title="Stock Reservation Release Error"
                )
                continue

        if released_count:
            frappe.db.commit()

        frappe.logger().info(
            f"Completed check_expired_reservations: released {released_count} of "
            f"{len(expired_reservations)} expired reservations"
        )

    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Check Expired Reservations Task Failed"
        )


def release_reservation(reservation):
    """
    Release a single stock reservation and restore available stock.

    Steps:
    1. Update reservation status to Expired
    2. Restore reserved quantity back to available stock
    3. Log the release event
    """
    doc = frappe.get_doc("Stock Reservation", reservation.name)
    doc.status = "Expired"
    doc.released_at = now_datetime()
    doc.save(ignore_permissions=True)

    # Restore stock to warehouse/item
    restore_reserved_stock(
        item_code=reservation.item_code,
        warehouse=reservation.get("warehouse"),
        quantity=reservation.quantity
    )


def restore_reserved_stock(item_code, warehouse, quantity):
    """
    Restore reserved stock quantity back to available inventory.

    Updates the available quantity for the given item/warehouse combination.
    """
    if not item_code or not quantity:
        return

    # In real implementation, this would update the stock ledger
    # or product variant available quantity
    pass


def auto_cancel_overdue_orders():
    """
    Scheduled task (every 15 minutes): Cancel orders past payment deadline.

    This task:
    1. Finds orders with status indicating awaiting payment
    2. Checks if current time exceeds the payment_deadline
    3. Cancels overdue orders and releases associated stock reservations

    Business Rules:
    - Only processes orders in 'Pending Payment' or 'Awaiting Payment' status
    - Payment deadline is set at order creation based on payment method
    - Cancellation releases all stock reservations tied to the order
    - Buyer is notified of automatic cancellation
    """
    frappe.logger().info("Running auto_cancel_overdue_orders scheduled task")

    try:
        current_time = now_datetime()

        overdue_orders = frappe.get_all(
            "Order",
            filters={
                "status": ["in", ["Pending Payment", "Awaiting Payment"]],
                "payment_deadline": ["<", current_time]
            },
            fields=["name", "buyer", "seller", "grand_total", "payment_deadline"]
        )

        cancelled_count = 0

        for order in overdue_orders:
            try:
                cancel_overdue_order(order)
                cancelled_count += 1
            except Exception as e:
                frappe.log_error(
                    message=f"Failed to cancel overdue order {order.name}: {str(e)}",
                    title="Auto Cancel Order Error"
                )
                continue

        if cancelled_count:
            frappe.db.commit()

        frappe.logger().info(
            f"Completed auto_cancel_overdue_orders: cancelled {cancelled_count} of "
            f"{len(overdue_orders)} overdue orders"
        )

    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Auto Cancel Overdue Orders Task Failed"
        )


def cancel_overdue_order(order):
    """
    Cancel a single overdue order and release its stock reservations.

    Steps:
    1. Update order status to Cancelled
    2. Set cancellation reason as payment timeout
    3. Release all associated stock reservations
    4. Notify buyer about cancellation
    """
    doc = frappe.get_doc("Order", order.name)
    doc.status = "Cancelled"
    doc.cancellation_reason = "Payment deadline exceeded — automatically cancelled"
    doc.cancelled_at = now_datetime()
    doc.save(ignore_permissions=True)

    # Release stock reservations tied to this order
    release_order_reservations(order.name)


def release_order_reservations(order_name):
    """
    Release all stock reservations associated with an order.
    """
    reservations = frappe.get_all(
        "Stock Reservation",
        filters={
            "reference_doctype": "Order",
            "reference_name": order_name,
            "status": "Active"
        },
        fields=["name", "item_code", "quantity", "warehouse"]
    )

    for reservation in reservations:
        try:
            release_reservation(reservation)
        except Exception as e:
            frappe.log_error(
                message=f"Failed to release reservation {reservation.name} for order {order_name}: {str(e)}",
                title="Order Reservation Release Error"
            )


def cart_health_check():
    """
    Scheduled task (hourly): Validate cart and session consistency.

    This task:
    1. Finds carts with inconsistent state (e.g., items referencing deleted products)
    2. Validates cart totals match item sums
    3. Checks for orphaned carts (no associated session/user)
    4. Cleans up stale cart sessions

    Business Rules:
    - Carts older than 30 days with no activity are marked stale
    - Orphaned carts are flagged for review
    - Total mismatches are recalculated and logged
    """
    frappe.logger().info("Running cart_health_check scheduled task")

    try:
        issues_found = 0

        # Check for orphaned carts
        issues_found += check_orphaned_carts()

        # Validate cart totals
        issues_found += validate_cart_totals()

        # Clean up stale carts
        issues_found += cleanup_stale_carts()

        frappe.logger().info(
            f"Completed cart_health_check: found {issues_found} issues"
        )

    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Cart Health Check Task Failed"
        )


def check_orphaned_carts():
    """
    Find and flag carts that have no associated user or session.
    """
    orphaned_carts = frappe.get_all(
        "Cart",
        filters={
            "user": ["is", "not set"],
            "session_id": ["is", "not set"],
            "status": ["!=", "Abandoned"]
        },
        fields=["name"]
    )

    for cart in orphaned_carts:
        frappe.db.set_value("Cart", cart.name, "status", "Abandoned")

    if orphaned_carts:
        frappe.db.commit()

    return len(orphaned_carts)


def validate_cart_totals():
    """
    Validate that cart totals match the sum of their items.
    Recalculate and log any mismatches.
    """
    # In real implementation, this would query carts and compare
    # grand_total with sum of item amounts
    return 0


def cleanup_stale_carts():
    """
    Mark carts older than 30 days with no activity as stale.
    """
    cutoff_date = add_days(nowdate(), -30)

    stale_carts = frappe.get_all(
        "Cart",
        filters={
            "modified": ["<", cutoff_date],
            "status": ["not in", ["Abandoned", "Converted", "Stale"]]
        },
        fields=["name"]
    )

    for cart in stale_carts:
        frappe.db.set_value("Cart", cart.name, "status", "Stale")

    if stale_carts:
        frappe.db.commit()

    return len(stale_carts)


def daily_abuse_detection():
    """
    Scheduled task (daily): Analyze buyer patterns and detect abuse.

    This task:
    1. Analyzes reservation patterns per buyer (excessive reservations without purchase)
    2. Detects repeated cart abandonment patterns
    3. Identifies bulk reservation hoarding behavior
    4. Creates Buyer Abuse Log entries for flagged behavior

    Business Rules:
    - Buyers with > 10 expired reservations in 24h are flagged
    - Buyers with > 5 cancelled orders in 7 days are flagged
    - Repeated reservation of high-demand items without purchase triggers flag
    - Abuse logs are created for manual review by moderators
    """
    frappe.logger().info("Running daily_abuse_detection scheduled task")

    try:
        flags_created = 0

        # Detect excessive reservation expiry
        flags_created += detect_excessive_reservation_expiry()

        # Detect repeated order cancellations
        flags_created += detect_repeated_cancellations()

        # Detect reservation hoarding
        flags_created += detect_reservation_hoarding()

        if flags_created:
            frappe.db.commit()

        frappe.logger().info(
            f"Completed daily_abuse_detection: created {flags_created} abuse log entries"
        )

    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Daily Abuse Detection Task Failed"
        )


def detect_excessive_reservation_expiry():
    """
    Flag buyers with excessive expired reservations in the last 24 hours.

    Threshold: > 10 expired reservations without corresponding purchases.
    """
    yesterday = add_days(nowdate(), -1)

    # Get buyers with high expired reservation counts
    expired_counts = frappe.db.sql("""
        SELECT buyer, COUNT(*) as expired_count
        FROM `tabStock Reservation`
        WHERE status = 'Expired'
            AND released_at >= %(yesterday)s
        GROUP BY buyer
        HAVING expired_count > 10
    """, {"yesterday": yesterday}, as_dict=True)

    flags = 0
    for record in expired_counts:
        create_abuse_log(
            buyer=record.buyer,
            abuse_type="Excessive Reservation Expiry",
            description=f"Buyer had {record.expired_count} expired reservations in the last 24 hours",
            severity="Medium"
        )
        flags += 1

    return flags


def detect_repeated_cancellations():
    """
    Flag buyers with repeated order cancellations in the last 7 days.

    Threshold: > 5 cancelled orders in 7 days.
    """
    week_ago = add_days(nowdate(), -7)

    cancelled_counts = frappe.db.sql("""
        SELECT buyer, COUNT(*) as cancel_count
        FROM `tabOrder`
        WHERE status = 'Cancelled'
            AND cancelled_at >= %(week_ago)s
        GROUP BY buyer
        HAVING cancel_count > 5
    """, {"week_ago": week_ago}, as_dict=True)

    flags = 0
    for record in cancelled_counts:
        create_abuse_log(
            buyer=record.buyer,
            abuse_type="Repeated Order Cancellations",
            description=f"Buyer had {record.cancel_count} cancelled orders in the last 7 days",
            severity="High"
        )
        flags += 1

    return flags


def detect_reservation_hoarding():
    """
    Flag buyers who repeatedly reserve high-demand items without purchasing.

    Identifies patterns of reserving and letting expire on the same items.
    """
    week_ago = add_days(nowdate(), -7)

    hoarding_patterns = frappe.db.sql("""
        SELECT buyer, item_code, COUNT(*) as reserve_count
        FROM `tabStock Reservation`
        WHERE status IN ('Expired', 'Released')
            AND created >= %(week_ago)s
        GROUP BY buyer, item_code
        HAVING reserve_count > 3
    """, {"week_ago": week_ago}, as_dict=True)

    flags = 0
    for record in hoarding_patterns:
        create_abuse_log(
            buyer=record.buyer,
            abuse_type="Reservation Hoarding",
            description=(
                f"Buyer reserved item {record.item_code} {record.reserve_count} times "
                f"in the last 7 days without purchasing"
            ),
            severity="High"
        )
        flags += 1

    return flags


def create_abuse_log(buyer, abuse_type, description, severity="Medium"):
    """
    Create a Buyer Abuse Log entry for review by moderators.
    """
    if not buyer:
        return

    # Check for existing unresolved log of same type for this buyer
    existing = frappe.db.exists(
        "Buyer Abuse Log",
        {
            "buyer": buyer,
            "abuse_type": abuse_type,
            "status": ["in", ["Open", "Under Review"]]
        }
    )

    if existing:
        return

    try:
        doc = frappe.new_doc("Buyer Abuse Log")
        doc.buyer = buyer
        doc.abuse_type = abuse_type
        doc.description = description
        doc.severity = severity
        doc.status = "Open"
        doc.detected_on = nowdate()
        doc.insert(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(
            message=f"Failed to create abuse log for buyer {buyer}: {str(e)}",
            title="Abuse Log Creation Error"
        )


def cleanup_expired_reservations():
    """
    Scheduled task (daily): Hard-delete old Released/Expired reservations.

    This task:
    1. Finds stock reservations with status Released or Expired
    2. Filters for reservations older than the retention period
    3. Permanently deletes them to keep the database clean

    Business Rules:
    - Only deletes reservations older than 30 days
    - Only deletes reservations with status Released or Expired
    - Logs the count of deleted records
    """
    frappe.logger().info("Running cleanup_expired_reservations scheduled task")

    try:
        retention_cutoff = add_days(nowdate(), -30)

        old_reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "status": ["in", ["Released", "Expired"]],
                "modified": ["<", retention_cutoff]
            },
            fields=["name"],
            limit_page_length=0
        )

        deleted_count = 0

        for reservation in old_reservations:
            try:
                frappe.delete_doc(
                    "Stock Reservation",
                    reservation.name,
                    force=True,
                    ignore_permissions=True
                )
                deleted_count += 1
            except Exception as e:
                frappe.log_error(
                    message=f"Failed to delete reservation {reservation.name}: {str(e)}",
                    title="Reservation Cleanup Error"
                )
                continue

        if deleted_count:
            frappe.db.commit()

        frappe.logger().info(
            f"Completed cleanup_expired_reservations: deleted {deleted_count} of "
            f"{len(old_reservations)} old reservations"
        )

    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Cleanup Expired Reservations Task Failed"
        )
