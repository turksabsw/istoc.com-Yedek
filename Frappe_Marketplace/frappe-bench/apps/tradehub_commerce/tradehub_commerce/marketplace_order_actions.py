# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""Marketplace Order Actions

Whitelisted methods for creating downstream documents from Marketplace Orders:
- Sales Invoice
- Delivery Note
- Payment Entry
- Payment Request
- Shipment
- Return Credit Note
- Dispute

Also includes doc_event callbacks for reverse sync when downstream
documents are submitted or cancelled.
"""

import frappe
from frappe import _
from frappe.utils import flt, now_datetime, cint
from frappe.model.mapper import get_mapped_doc


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_marketplace_order(name, for_update=True):
    """Fetch Marketplace Order with optional row-level lock."""
    doc = frappe.get_doc("Marketplace Order", name, for_update=for_update)
    return doc


def _get_all_delivered_qtys(marketplace_order_name):
    """Return dict of {item_code: delivered_qty} from all submitted Delivery Notes."""
    data = frappe.get_all(
        "Delivery Note Item",
        filters={
            "docstatus": 1,
            "against_sales_order": ["is", "set"],
        },
        or_filters={
            "custom_marketplace_order": marketplace_order_name,
        },
        fields=["item_code", "sum(qty) as delivered_qty"],
        group_by="item_code",
    )
    return {row.item_code: flt(row.delivered_qty) for row in data}


# ---------------------------------------------------------------------------
# 1. make_sales_invoice
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None):
    """Create a Sales Invoice from a Marketplace Order."""
    mo = _get_marketplace_order(source_name)

    def set_missing_values(source, target):
        target.custom_marketplace_order = source.name
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Marketplace Order",
        source_name,
        {
            "Marketplace Order": {
                "doctype": "Sales Invoice",
                "field_map": {
                    "name": "custom_marketplace_order",
                },
            },
            "Marketplace Order Item": {
                "doctype": "Sales Invoice Item",
                "field_map": {
                    "item_code": "item_code",
                    "qty": "qty",
                    "rate": "rate",
                },
            },
        },
        target_doc,
        set_missing_values,
    )

    return doclist


# ---------------------------------------------------------------------------
# 2. make_delivery_note
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_delivery_note(source_name, target_doc=None):
    """Create a Delivery Note from a Marketplace Order with balance quantities."""
    mo = _get_marketplace_order(source_name)
    delivered_qtys = _get_all_delivered_qtys(source_name)

    def update_item(source_doc, target_doc, source_parent):
        already = flt(delivered_qtys.get(source_doc.item_code, 0))
        target_doc.qty = flt(source_doc.qty) - already
        if target_doc.qty <= 0:
            target_doc.qty = 0

    def set_missing_values(source, target):
        target.custom_marketplace_order = source.name
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Marketplace Order",
        source_name,
        {
            "Marketplace Order": {
                "doctype": "Delivery Note",
                "field_map": {
                    "name": "custom_marketplace_order",
                },
            },
            "Marketplace Order Item": {
                "doctype": "Delivery Note Item",
                "field_map": {
                    "item_code": "item_code",
                    "qty": "qty",
                    "rate": "rate",
                },
                "postprocess": update_item,
            },
        },
        target_doc,
        set_missing_values,
    )

    return doclist


# ---------------------------------------------------------------------------
# 3. make_payment_entry
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_payment_entry(dt, dn):
    """Create a Payment Entry using ERPNext's standard utility."""
    _get_marketplace_order(dn)  # concurrency lock + existence check

    from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry
    return get_payment_entry(dt, dn)


# ---------------------------------------------------------------------------
# 4. make_payment_request
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_payment_request(**kwargs):
    """Create a Payment Request using ERPNext's standard utility."""
    dn = kwargs.get("dn") or kwargs.get("name")
    if dn:
        _get_marketplace_order(dn)

    from erpnext.accounts.doctype.payment_request.payment_request import (
        make_payment_request as _make_payment_request,
    )
    return _make_payment_request(**kwargs)


# ---------------------------------------------------------------------------
# 5. make_shipment
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_shipment(source_name, target_doc=None):
    """Create a Shipment from a Marketplace Order."""
    mo = _get_marketplace_order(source_name)

    def set_missing_values(source, target):
        target.custom_marketplace_order = source.name

    doclist = get_mapped_doc(
        "Marketplace Order",
        source_name,
        {
            "Marketplace Order": {
                "doctype": "Shipment",
                "field_map": {
                    "name": "custom_marketplace_order",
                },
            },
        },
        target_doc,
        set_missing_values,
    )

    return doclist


# ---------------------------------------------------------------------------
# 6. make_return_credit_note
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_return_credit_note(source_name, target_doc=None):
    """Create a return Credit Note (Sales Invoice with is_return=1)."""
    mo = _get_marketplace_order(source_name)

    def set_missing_values(source, target):
        target.custom_marketplace_order = source.name
        target.is_return = 1
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Marketplace Order",
        source_name,
        {
            "Marketplace Order": {
                "doctype": "Sales Invoice",
                "field_map": {
                    "name": "custom_marketplace_order",
                },
            },
            "Marketplace Order Item": {
                "doctype": "Sales Invoice Item",
                "field_map": {
                    "item_code": "item_code",
                    "qty": "qty",
                    "rate": "rate",
                },
            },
        },
        target_doc,
        set_missing_values,
    )

    return doclist


# ---------------------------------------------------------------------------
# 7. make_dispute
# ---------------------------------------------------------------------------

@frappe.whitelist()
def make_dispute(source_name):
    """Create a Dispute for a Marketplace Order (stub)."""
    _get_marketplace_order(source_name)
    frappe.throw(_("Dispute DocType not yet available"))


# ---------------------------------------------------------------------------
# Doc Event Callbacks
# ---------------------------------------------------------------------------

def on_sales_invoice_submit(doc, method):
    """Update Marketplace Order when a linked Sales Invoice is submitted."""
    marketplace_order_name = doc.get("custom_marketplace_order")
    if not marketplace_order_name:
        return

    if not frappe.db.exists("Marketplace Order", marketplace_order_name):
        return

    try:
        mo = _get_marketplace_order(marketplace_order_name)
        mo.db_set("status", "Invoiced", update_modified=True)
        mo.db_set("invoiced_at", now_datetime(), update_modified=False)
        mo.db_set("erpnext_sales_invoice", doc.name, update_modified=False)

        frappe.logger().info(
            f"Marketplace Order {marketplace_order_name} marked Invoiced via {doc.name}"
        )
    except Exception as e:
        frappe.log_error(
            f"Failed to update Marketplace Order {marketplace_order_name} "
            f"on Sales Invoice submit: {str(e)}",
            "Marketplace Order Action Error",
        )


def on_delivery_note_submit(doc, method):
    """Update Marketplace Order when a linked Delivery Note is submitted."""
    marketplace_order_name = doc.get("custom_marketplace_order")
    if not marketplace_order_name:
        return

    if not frappe.db.exists("Marketplace Order", marketplace_order_name):
        return

    try:
        mo = _get_marketplace_order(marketplace_order_name)

        # Increment counts
        new_shipment_count = cint(mo.get("shipment_count")) + 1
        new_dn_count = cint(mo.get("delivery_note_count")) + 1

        mo.db_set("shipment_count", new_shipment_count, update_modified=True)
        mo.db_set("delivery_note_count", new_dn_count, update_modified=False)
        mo.db_set("last_shipment_date", now_datetime(), update_modified=False)
        mo.db_set("erpnext_delivery_note", doc.name, update_modified=False)

        # Refresh shipped/remaining qty display fields
        _refresh_delivery_display_fields(mo)

        frappe.logger().info(
            f"Marketplace Order {marketplace_order_name} delivery count "
            f"incremented via {doc.name}"
        )
    except Exception as e:
        frappe.log_error(
            f"Failed to update Marketplace Order {marketplace_order_name} "
            f"on Delivery Note submit: {str(e)}",
            "Marketplace Order Action Error",
        )


def on_delivery_note_cancel(doc, method):
    """Update Marketplace Order when a linked Delivery Note is cancelled."""
    marketplace_order_name = doc.get("custom_marketplace_order")
    if not marketplace_order_name:
        return

    if not frappe.db.exists("Marketplace Order", marketplace_order_name):
        return

    try:
        mo = _get_marketplace_order(marketplace_order_name)

        # Decrement counts (floor at 0)
        new_shipment_count = max(0, cint(mo.get("shipment_count")) - 1)
        new_dn_count = max(0, cint(mo.get("delivery_note_count")) - 1)

        mo.db_set("shipment_count", new_shipment_count, update_modified=True)
        mo.db_set("delivery_note_count", new_dn_count, update_modified=False)

        # Recalculate shipped/remaining qty display fields
        _refresh_delivery_display_fields(mo)

        frappe.logger().info(
            f"Marketplace Order {marketplace_order_name} delivery count "
            f"decremented via cancel of {doc.name}"
        )
    except Exception as e:
        frappe.log_error(
            f"Failed to update Marketplace Order {marketplace_order_name} "
            f"on Delivery Note cancel: {str(e)}",
            "Marketplace Order Action Error",
        )


def on_payment_entry_submit(doc, method):
    """Update Marketplace Order payment status when Payment Entry is submitted."""
    marketplace_order_name = None

    # Check references for linked Marketplace Order
    for ref in doc.get("references", []):
        if ref.reference_doctype == "Marketplace Order":
            marketplace_order_name = ref.reference_name
            break

    if not marketplace_order_name:
        marketplace_order_name = doc.get("custom_marketplace_order")

    if not marketplace_order_name:
        return

    if not frappe.db.exists("Marketplace Order", marketplace_order_name):
        return

    try:
        mo = _get_marketplace_order(marketplace_order_name)

        mo.db_set("payment_status", "Paid", update_modified=True)
        mo.db_set("paid_at", now_datetime(), update_modified=False)
        mo.db_set("paid_amount", flt(doc.paid_amount), update_modified=False)
        mo.db_set("erpnext_payment_entry", doc.name, update_modified=False)

        # If order was awaiting payment, move to Confirmed
        if mo.status == "Await Payment":
            mo.db_set("status", "Confirmed", update_modified=False)
            mo.db_set("confirmed_at", now_datetime(), update_modified=False)

        frappe.logger().info(
            f"Marketplace Order {marketplace_order_name} payment updated via {doc.name}"
        )
    except Exception as e:
        frappe.log_error(
            f"Failed to update Marketplace Order {marketplace_order_name} "
            f"on Payment Entry submit: {str(e)}",
            "Marketplace Order Action Error",
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _refresh_delivery_display_fields(mo):
    """Recalculate shipped_qty, remaining_qty, and fulfillment_percentage."""
    delivered_qtys = _get_all_delivered_qtys(mo.name)

    total_ordered = 0
    total_delivered = 0

    for item in mo.get("items", []):
        qty = flt(item.qty)
        total_ordered += qty
        total_delivered += min(qty, flt(delivered_qtys.get(item.item_code, 0)))

    remaining = max(0, total_ordered - total_delivered)
    pct = (total_delivered / total_ordered * 100) if total_ordered else 0

    mo.db_set("shipped_qty", total_delivered, update_modified=False)
    mo.db_set("remaining_qty", remaining, update_modified=False)
    mo.db_set("fulfillment_percentage", flt(pct, 2), update_modified=False)
