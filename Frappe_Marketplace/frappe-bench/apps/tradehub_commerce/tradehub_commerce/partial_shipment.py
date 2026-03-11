# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""Partial Shipment & Balance Tracking

SQL-based balance calculations for Marketplace Orders with multiple
Delivery Notes. Over-shipment validation blocks excess quantities
on DN validate.

Functions:
- _get_delivered_qty: Single item delivered qty from submitted DNs
- _get_all_delivered_qtys: Bulk delivered qtys for all items in an order
- get_order_balance_summary: Per-item balance for a Marketplace Order
- get_sub_order_balance_summary: Per-item balance for a Sub Order
- confirm_delivery: Mark DN items as delivered
- validate_over_shipment: doc_event hook for DN validate
"""

import frappe
from frappe import _
from frappe.utils import flt, now_datetime


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _get_delivered_qty(order_name, order_item_name):
    """Return total delivered qty for a specific order item from submitted DNs.

    Args:
        order_name: Marketplace Order name
        order_item_name: Marketplace Order Item name

    Returns:
        float: Total delivered quantity
    """
    result = frappe.db.sql("""
        SELECT IFNULL(SUM(dni.qty), 0) as delivered_qty
        FROM `tabDelivery Note Item` dni
        JOIN `tabDelivery Note` dn ON dn.name = dni.parent
        WHERE dn.custom_marketplace_order = %(order_name)s
        AND dni.custom_marketplace_order_item = %(order_item_name)s
        AND dn.docstatus = 1
    """, {"order_name": order_name, "order_item_name": order_item_name}, as_dict=True)
    return flt(result[0].delivered_qty) if result else 0


def _get_all_delivered_qtys(order_name):
    """Return dict of {order_item_name: delivered_qty} for all items in order.

    Uses a single bulk SQL query for efficiency.

    Args:
        order_name: Marketplace Order name

    Returns:
        dict: Mapping of order item name to total delivered qty
    """
    data = frappe.db.sql("""
        SELECT dni.custom_marketplace_order_item as item_name,
               IFNULL(SUM(dni.qty), 0) as delivered_qty
        FROM `tabDelivery Note Item` dni
        JOIN `tabDelivery Note` dn ON dn.name = dni.parent
        WHERE dn.custom_marketplace_order = %(order_name)s
        AND dn.docstatus = 1
        AND dni.custom_marketplace_order_item IS NOT NULL
        AND dni.custom_marketplace_order_item != ''
        GROUP BY dni.custom_marketplace_order_item
    """, {"order_name": order_name}, as_dict=True)
    return {row.item_name: flt(row.delivered_qty) for row in data}


# ---------------------------------------------------------------------------
# Whitelist APIs
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_order_balance_summary(order_name):
    """Return per-item balance summary for a Marketplace Order.

    Args:
        order_name: Marketplace Order name

    Returns:
        list[dict]: Each dict has item, ordered_qty, shipped_qty,
                    remaining_qty, fulfillment_status
    """
    frappe.has_permission("Marketplace Order", doc=order_name, throw=True)

    items = frappe.get_all(
        "Marketplace Order Item",
        filters={"parent": order_name},
        fields=["name", "item_code", "item_name", "qty"],
        order_by="idx asc"
    )

    if not items:
        return []

    delivered_map = _get_all_delivered_qtys(order_name)

    result = []
    for item in items:
        ordered_qty = flt(item.qty)
        shipped_qty = flt(delivered_map.get(item.name, 0))
        remaining_qty = flt(ordered_qty - shipped_qty)

        if remaining_qty < 0:
            remaining_qty = 0

        if shipped_qty <= 0:
            fulfillment_status = "Pending"
        elif shipped_qty >= ordered_qty:
            fulfillment_status = "Fulfilled"
        else:
            fulfillment_status = "Partial"

        result.append({
            "item": item.name,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "ordered_qty": ordered_qty,
            "shipped_qty": shipped_qty,
            "remaining_qty": remaining_qty,
            "fulfillment_status": fulfillment_status,
        })

    return result


@frappe.whitelist()
def get_sub_order_balance_summary(sub_order_name):
    """Return per-item balance summary filtered by Sub Order items.

    Args:
        sub_order_name: Sub Order name

    Returns:
        list[dict]: Same structure as get_order_balance_summary
    """
    frappe.has_permission("Sub Order", doc=sub_order_name, throw=True)

    sub_order = frappe.get_doc("Sub Order", sub_order_name)
    order_name = sub_order.marketplace_order

    if not order_name:
        frappe.throw(_("Sub Order {0} has no linked Marketplace Order").format(sub_order_name))

    # Get sub order item names to filter
    sub_order_items = frappe.get_all(
        "Sub Order Item",
        filters={"parent": sub_order_name},
        fields=["name", "marketplace_order_item", "item_code", "item_name", "qty"],
        order_by="idx asc"
    )

    if not sub_order_items:
        return []

    delivered_map = _get_all_delivered_qtys(order_name)

    result = []
    for item in sub_order_items:
        order_item_name = item.marketplace_order_item
        ordered_qty = flt(item.qty)
        shipped_qty = flt(delivered_map.get(order_item_name, 0)) if order_item_name else 0
        remaining_qty = max(flt(ordered_qty - shipped_qty), 0)

        if shipped_qty <= 0:
            fulfillment_status = "Pending"
        elif shipped_qty >= ordered_qty:
            fulfillment_status = "Fulfilled"
        else:
            fulfillment_status = "Partial"

        result.append({
            "item": item.name,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "ordered_qty": ordered_qty,
            "shipped_qty": shipped_qty,
            "remaining_qty": remaining_qty,
            "fulfillment_status": fulfillment_status,
        })

    return result


@frappe.whitelist()
def confirm_delivery(delivery_note_name):
    """Mark Delivery Note items as delivered and update order tracking fields.

    Args:
        delivery_note_name: Delivery Note name
    """
    frappe.has_permission("Delivery Note", doc=delivery_note_name, throw=True)

    dn = frappe.get_doc("Delivery Note", delivery_note_name)

    if dn.docstatus != 1:
        frappe.throw(_("Delivery Note {0} must be submitted before confirming delivery").format(
            delivery_note_name
        ))

    order_name = dn.get("custom_marketplace_order")
    if not order_name:
        frappe.throw(_("Delivery Note {0} is not linked to a Marketplace Order").format(
            delivery_note_name
        ))

    # Update the Marketplace Order tracking fields
    order = frappe.get_doc("Marketplace Order", order_name, for_update=True)

    # Recalculate fulfillment from SQL
    delivered_map = _get_all_delivered_qtys(order_name)

    total_ordered = 0
    total_shipped = 0

    for item in order.items:
        ordered_qty = flt(item.qty)
        shipped_qty = flt(delivered_map.get(item.name, 0))
        total_ordered += ordered_qty
        total_shipped += shipped_qty

        # Update cached display fields
        item.db_set("shipped_qty", shipped_qty, update_modified=False)
        item.db_set("remaining_qty", max(flt(ordered_qty - shipped_qty), 0), update_modified=False)

    # Update order-level fulfillment
    fulfillment_pct = flt(total_shipped / total_ordered * 100, 2) if total_ordered else 0
    order.db_set("fulfillment_percentage", fulfillment_pct)
    order.db_set("delivered_at", now_datetime())

    if fulfillment_pct >= 100:
        order.db_set("status", "Delivered")

    return {"message": _("Delivery confirmed for {0}").format(delivery_note_name)}


# ---------------------------------------------------------------------------
# Doc Event Hook
# ---------------------------------------------------------------------------

def validate_over_shipment(doc, method=None):
    """Validate hook for Delivery Note to prevent over-shipment.

    Registered as doc_event in hooks.py for Delivery Note validate.
    Checks each DN item's qty against remaining qty computed from SQL.

    Args:
        doc: Delivery Note document
        method: Event method name (unused)
    """
    order_name = doc.get("custom_marketplace_order")
    if not order_name:
        return

    # Only validate for new or amended documents
    if doc.docstatus == 2:
        return

    # Get current delivered quantities (excludes this DN if it's being amended)
    delivered_map = _get_all_delivered_qtys(order_name)

    # Build a map of order item -> ordered qty
    order_item_names = set()
    for item in doc.items:
        oi_name = item.get("custom_marketplace_order_item")
        if oi_name:
            order_item_names.add(oi_name)

    if not order_item_names:
        return

    # Fetch ordered quantities
    ordered_qtys = {}
    for oi_name in order_item_names:
        data = frappe.db.get_value(
            "Marketplace Order Item", oi_name,
            ["qty", "item_code"], as_dict=True
        )
        if data:
            ordered_qtys[oi_name] = data

    # Accumulate quantities from this DN per order item
    dn_item_qtys = {}
    for item in doc.items:
        oi_name = item.get("custom_marketplace_order_item")
        if not oi_name:
            continue
        dn_item_qtys.setdefault(oi_name, 0)
        dn_item_qtys[oi_name] += flt(item.qty)

    # Validate each item
    for oi_name, dn_qty in dn_item_qtys.items():
        if oi_name not in ordered_qtys:
            continue

        ordered_qty = flt(ordered_qtys[oi_name].qty)
        already_delivered = flt(delivered_map.get(oi_name, 0))
        remaining_qty = flt(ordered_qty - already_delivered)

        if flt(dn_qty) > remaining_qty:
            frappe.throw(
                _("Row(s) for item {0}: Delivery qty {1} exceeds remaining qty {2} "
                  "(ordered: {3}, already shipped: {4})").format(
                    ordered_qtys[oi_name].item_code,
                    dn_qty,
                    remaining_qty,
                    ordered_qty,
                    already_delivered,
                ),
                title=_("Over-Shipment Not Allowed")
            )
