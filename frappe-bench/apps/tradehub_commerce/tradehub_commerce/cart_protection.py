# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Cart Protection Module

Stock reservation, price change detection, checkout timer extension,
protection settings resolution, payment deadline, and overdue cancellation.
"""

import frappe
import time
from frappe import _
from frappe.utils import now_datetime, add_to_date, cint, flt, get_datetime
from typing import Dict, Any, Optional


def _response(success: bool, data: Any = None, message: str = None, errors: list = None) -> Dict:
    """Standard API response format."""
    return {
        "success": success,
        "data": data,
        "message": message,
        "errors": errors or []
    }


def reserve_stock_for_checkout(
    item: str,
    qty: float,
    checkout_session: str,
    cart_line: str = None,
    warehouse: str = None
) -> Dict:
    """
    Atomically reserve stock for a checkout session with exponential backoff.

    Uses frappe.get_doc for_update=True for row-level locking.
    Retries up to 3 times with exponential backoff: 100ms -> 200ms -> 400ms.

    Args:
        item: Item/Listing name
        qty: Quantity to reserve
        checkout_session: Checkout Session reference
        cart_line: Cart Line reference
        warehouse: Warehouse name

    Returns:
        API response with reservation details
    """
    settings = get_protection_setting("enable_stock_reservation")
    if not settings:
        return _response(True, message=_("Stock reservation is disabled"))

    max_retries = 3
    backoff_ms = 100

    for attempt in range(max_retries):
        try:
            return _attempt_reservation(
                item=item,
                qty=qty,
                checkout_session=checkout_session,
                cart_line=cart_line,
                warehouse=warehouse
            )
        except frappe.QueryDeadlockError:
            if attempt < max_retries - 1:
                wait_seconds = (backoff_ms * (2 ** attempt)) / 1000.0
                time.sleep(wait_seconds)
                continue
            frappe.log_error(
                message=f"Stock reservation failed after {max_retries} retries for item {item}",
                title="Stock Reservation Deadlock"
            )
            return _response(False, message=_("Could not reserve stock due to high demand. Please try again."))
        except Exception as e:
            frappe.log_error(
                message=f"Stock reservation error for item {item}: {str(e)}",
                title="Stock Reservation Error"
            )
            return _response(False, message=str(e))

    return _response(False, message=_("Stock reservation failed after maximum retries"))


def _attempt_reservation(
    item: str,
    qty: float,
    checkout_session: str,
    cart_line: str = None,
    warehouse: str = None
) -> Dict:
    """
    Execute a single atomic stock reservation attempt.

    Uses SELECT FOR UPDATE to prevent concurrent over-reservation.
    """
    # Check current active reservations for this item
    reserved_qty = flt(frappe.db.sql("""
        SELECT IFNULL(SUM(qty), 0)
        FROM `tabStock Reservation`
        WHERE item = %(item)s
        AND status = 'Active'
        AND expires_at > %(now)s
    """, {"item": item, "now": now_datetime()})[0][0])

    # Get available stock from cache or listing
    available_qty = _get_available_stock(item, warehouse)

    remaining_qty = flt(available_qty) - flt(reserved_qty)
    if flt(qty) > remaining_qty:
        return _response(
            False,
            message=_("Insufficient stock. Available: {0}, Requested: {1}").format(
                remaining_qty, qty
            )
        )

    # Calculate expiry based on protection settings
    reservation_minutes = get_protection_setting("checkout_reservation_minutes", default=30)
    expires_at = add_to_date(now_datetime(), minutes=cint(reservation_minutes))

    # Create reservation
    reservation = frappe.get_doc({
        "doctype": "Stock Reservation",
        "item": item,
        "warehouse": warehouse,
        "qty": flt(qty),
        "status": "Active",
        "checkout_session": checkout_session,
        "cart_line": cart_line,
        "expires_at": expires_at,
        "reservation_key": f"{checkout_session}-{item}-{frappe.utils.now_datetime().timestamp()}"
    })
    reservation.insert(ignore_permissions=True)
    frappe.db.commit()

    return _response(True, data={
        "reservation": reservation.name,
        "expires_at": str(expires_at),
        "qty": flt(qty)
    })


def _get_available_stock(item: str, warehouse: str = None) -> float:
    """
    Get available stock for an item, using cache when possible.

    Args:
        item: Item/Listing name
        warehouse: Optional warehouse filter

    Returns:
        Available quantity as float
    """
    cache_key = f"stock_avail:{item}:{warehouse or 'all'}"
    cached = frappe.cache.get_value(cache_key)
    if cached is not None:
        return flt(cached)

    # Fetch from listing
    available = flt(frappe.db.get_value("Listing", item, "stock_qty") or 0)

    frappe.cache.set_value(cache_key, available, expires_in_sec=30)
    return available


def release_stock_reservation(reservation_name: str, reason: str = "Manual") -> Dict:
    """
    Release a specific stock reservation.

    Args:
        reservation_name: Stock Reservation document name
        reason: Release reason (e.g., Expired, Cancelled, Manual, Checkout Complete)

    Returns:
        API response
    """
    try:
        reservation = frappe.get_doc("Stock Reservation", reservation_name, for_update=True)

        if reservation.status != "Active":
            return _response(False, message=_("Reservation {0} is not active").format(reservation_name))

        reservation.status = "Released"
        reservation.released_at = now_datetime()
        reservation.release_reason = reason
        reservation.save(ignore_permissions=True)
        frappe.db.commit()

        # Invalidate stock cache for this item
        cache_key = f"stock_avail:{reservation.item}:{reservation.warehouse or 'all'}"
        frappe.cache.delete_value(cache_key)

        return _response(True, message=_("Reservation released successfully"))

    except Exception as e:
        frappe.log_error(
            message=f"Error releasing reservation {reservation_name}: {str(e)}",
            title="Stock Reservation Release Error"
        )
        return _response(False, message=str(e))


def release_all_reservations_for_session(checkout_session: str, reason: str = "Session Ended") -> Dict:
    """
    Release all active reservations for a checkout session.

    Args:
        checkout_session: Checkout Session reference
        reason: Release reason

    Returns:
        API response with count of released reservations
    """
    try:
        reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "checkout_session": checkout_session,
                "status": "Active"
            },
            pluck="name"
        )

        released_count = 0
        for name in reservations:
            result = release_stock_reservation(name, reason=reason)
            if result.get("success"):
                released_count += 1

        return _response(True, data={"released_count": released_count})

    except Exception as e:
        frappe.log_error(
            message=f"Error releasing reservations for session {checkout_session}: {str(e)}",
            title="Bulk Reservation Release Error"
        )
        return _response(False, message=str(e))


@frappe.whitelist()
def check_price_changes(checkout_session: str) -> Dict:
    """
    Detect price changes for items in a checkout session since reservation.

    Compares current listing prices with prices at time of cart creation.
    Buyer must re-confirm if prices have changed.

    Args:
        checkout_session: Checkout Session reference

    Returns:
        API response with list of price changes
    """
    try:
        reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "checkout_session": checkout_session,
                "status": "Active"
            },
            fields=["name", "item", "qty", "cart_line"]
        )

        changes = []
        for res in reservations:
            # Get current price from listing
            current_price = flt(frappe.db.get_value("Listing", res.item, "price") or 0)

            # Get price at time of cart addition
            cart_price = None
            if res.cart_line:
                cart_price = flt(frappe.db.get_value("Cart Line", res.cart_line, "rate") or 0)

            if cart_price is not None and flt(current_price) != flt(cart_price):
                changes.append({
                    "item": res.item,
                    "reservation": res.name,
                    "original_price": cart_price,
                    "current_price": current_price,
                    "difference": flt(current_price) - flt(cart_price)
                })

        return _response(
            True,
            data={
                "has_changes": len(changes) > 0,
                "changes": changes
            }
        )

    except Exception as e:
        frappe.log_error(
            message=f"Error checking price changes for session {checkout_session}: {str(e)}",
            title="Price Change Check Error"
        )
        return _response(False, message=str(e))


@frappe.whitelist()
def extend_checkout_timer(checkout_session: str) -> Dict:
    """
    Extend checkout timer for a session. Single-use only per session to prevent abuse.

    Args:
        checkout_session: Checkout Session reference

    Returns:
        API response with new expiry time
    """
    try:
        # Check if extension already used for this session
        session_key = f"checkout_extended:{checkout_session}"
        already_extended = frappe.cache.get_value(session_key)

        max_extensions = get_protection_setting("max_checkout_extensions", default=1)
        extension_count = cint(already_extended or 0)

        if extension_count >= cint(max_extensions):
            return _response(
                False,
                message=_("Maximum checkout extensions ({0}) already used for this session").format(
                    max_extensions
                )
            )

        extension_minutes = get_protection_setting("extension_minutes", default=15)

        # Extend all active reservations for this session
        reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "checkout_session": checkout_session,
                "status": "Active"
            },
            fields=["name", "expires_at"]
        )

        new_expiry = None
        for res in reservations:
            current_expiry = get_datetime(res.expires_at)
            new_expiry = add_to_date(current_expiry, minutes=cint(extension_minutes))
            frappe.db.set_value(
                "Stock Reservation", res.name, "expires_at", new_expiry,
                update_modified=False
            )

        # Track extension usage (expires after 24 hours)
        frappe.cache.set_value(session_key, extension_count + 1, expires_in_sec=86400)
        frappe.db.commit()

        return _response(True, data={
            "new_expiry": str(new_expiry) if new_expiry else None,
            "extensions_used": extension_count + 1,
            "extensions_remaining": cint(max_extensions) - (extension_count + 1)
        })

    except Exception as e:
        frappe.log_error(
            message=f"Error extending checkout timer for session {checkout_session}: {str(e)}",
            title="Checkout Timer Extension Error"
        )
        return _response(False, message=str(e))


def get_protection_setting(setting_key: str, seller: str = None, default: Any = None) -> Any:
    """
    Get a cart protection setting with override resolution.

    Resolution order: seller override -> platform default -> provided default.

    Args:
        setting_key: Setting field name (e.g., 'checkout_reservation_minutes')
        seller: Optional seller name for seller-specific override
        default: Fallback default value

    Returns:
        Setting value
    """
    try:
        # Check seller override first
        if seller:
            override_value = frappe.db.get_value(
                "Seller Cart Protection Override",
                {
                    "parent": "Cart Protection Settings",
                    "parenttype": "Cart Protection Settings",
                    "seller": seller,
                    "setting_key": setting_key
                },
                "override_value"
            )
            if override_value is not None:
                return override_value

        # Get platform default from Cart Protection Settings (Single DocType)
        try:
            value = frappe.db.get_single_value("Cart Protection Settings", setting_key)
            if value is not None:
                return value
        except Exception:
            pass

        return default

    except Exception:
        return default


def set_payment_deadline(order_name: str, seller: str = None) -> Dict:
    """
    Set payment deadline on a Marketplace Order based on protection settings.

    Args:
        order_name: Marketplace Order name
        seller: Optional seller for override resolution

    Returns:
        API response with deadline details
    """
    try:
        settings_enabled = get_protection_setting("enable_payment_deadline", default=1)
        if not cint(settings_enabled):
            return _response(True, message=_("Payment deadline enforcement is disabled"))

        deadline_hours = cint(get_protection_setting(
            "payment_deadline_hours", seller=seller, default=24
        ))

        order = frappe.get_doc("Marketplace Order", order_name, for_update=True)

        payment_deadline = add_to_date(now_datetime(), hours=deadline_hours)
        order.payment_deadline = payment_deadline
        order.save(ignore_permissions=True)
        frappe.db.commit()

        return _response(True, data={
            "order": order_name,
            "payment_deadline": str(payment_deadline),
            "deadline_hours": deadline_hours
        })

    except Exception as e:
        frappe.log_error(
            message=f"Error setting payment deadline for order {order_name}: {str(e)}",
            title="Payment Deadline Error"
        )
        return _response(False, message=str(e))


def cancel_overdue_order(order_name: str) -> Dict:
    """
    Cancel a Marketplace Order that has exceeded its payment deadline.

    Releases any associated stock reservations and logs the cancellation.

    Args:
        order_name: Marketplace Order name

    Returns:
        API response
    """
    try:
        order = frappe.get_doc("Marketplace Order", order_name, for_update=True)

        # Verify the order is actually overdue
        if not order.get("payment_deadline"):
            return _response(False, message=_("Order {0} has no payment deadline set").format(order_name))

        if get_datetime(order.payment_deadline) > now_datetime():
            return _response(False, message=_("Order {0} is not yet overdue").format(order_name))

        # Check if order is in a cancellable state
        cancellable_statuses = ["Pending Payment", "Confirmed", "Draft"]
        if order.status not in cancellable_statuses:
            return _response(
                False,
                message=_("Order {0} in status {1} cannot be auto-cancelled").format(
                    order_name, order.status
                )
            )

        # Release any associated stock reservations
        checkout_session = order.get("checkout_session")
        if checkout_session:
            release_all_reservations_for_session(checkout_session, reason="Order Overdue")

        # Cancel the order
        order.status = "Cancelled"
        order.add_comment("Info", _("Order auto-cancelled due to payment deadline exceeded"))
        order.save(ignore_permissions=True)
        frappe.db.commit()

        return _response(True, message=_("Order {0} cancelled due to overdue payment").format(order_name))

    except Exception as e:
        frappe.log_error(
            message=f"Error cancelling overdue order {order_name}: {str(e)}",
            title="Overdue Order Cancellation Error"
        )
        return _response(False, message=str(e))
