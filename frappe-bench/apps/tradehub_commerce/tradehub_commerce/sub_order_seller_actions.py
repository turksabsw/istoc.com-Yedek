# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""Sub Order Seller Actions

Whitelisted methods for seller-side operations on Sub Orders:
- Accept / Cancel sub orders
- Create Proforma Invoice
- Create Sales Invoice
- Create Delivery Note
- Create Payment Request
- Create Shipment
- Create Return Credit Note

All seller_make_* methods validate seller ownership before proceeding.
"""

import frappe
from frappe import _
from frappe.utils import flt, now_datetime
from frappe.model.mapper import get_mapped_doc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_sub_order(name, for_update=True):
    """Fetch Sub Order with optional row-level lock."""
    doc = frappe.get_doc("Sub Order", name, for_update=for_update)
    return doc


def _validate_seller_ownership(sub_order_name):
    """Triple-layer seller ownership validation.

    1. Checks 'Seller' is in the current user's roles.
    2. Looks up the Seller Profile linked to the current user.
    3. Verifies Sub Order.seller matches and seller status is Active.

    Returns the Seller Profile name on success, raises on failure.
    """
    # Layer 1: Role check
    if "Seller" not in frappe.get_roles(frappe.session.user):
        frappe.throw(_("You do not have the Seller role"), frappe.PermissionError)

    # Layer 2: Seller Profile lookup
    seller_profile = frappe.db.get_value(
        "Seller Profile",
        {"user": frappe.session.user},
        ["name", "status"],
        as_dict=True,
    )
    if not seller_profile:
        frappe.throw(_("No Seller Profile found for current user"), frappe.PermissionError)

    if seller_profile.status != "Active":
        frappe.throw(_("Your Seller Profile is not active"), frappe.PermissionError)

    # Layer 3: Sub Order ownership
    sub_order_seller = frappe.db.get_value("Sub Order", sub_order_name, "seller")
    if not sub_order_seller:
        frappe.throw(_("Sub Order {0} not found").format(sub_order_name), frappe.DoesNotExistError)

    if sub_order_seller != seller_profile.name:
        frappe.throw(_("You are not the seller for this Sub Order"), frappe.PermissionError)

    return seller_profile.name


def _get_all_delivered_qtys(sub_order_name):
    """Return dict of {item_code: delivered_qty} from all submitted Delivery Notes."""
    data = frappe.get_all(
        "Delivery Note Item",
        filters={
            "docstatus": 1,
        },
        or_filters={
            "custom_sub_order": sub_order_name,
        },
        fields=["item_code", "sum(qty) as delivered_qty"],
        group_by="item_code",
    )
    return {row.item_code: flt(row.delivered_qty) for row in data}


# ---------------------------------------------------------------------------
# 1. check_seller_ownership
# ---------------------------------------------------------------------------

@frappe.whitelist()
def check_seller_ownership(sub_order_name):
    """Check if the current user is the seller for a Sub Order.

    Returns:
        dict: {is_seller: bool, seller_profile: str or None}
    """
    try:
        seller_profile = _validate_seller_ownership(sub_order_name)
        return {"is_seller": True, "seller_profile": seller_profile}
    except Exception:
        return {"is_seller": False, "seller_profile": None}


# ---------------------------------------------------------------------------
# 2. accept_sub_order
# ---------------------------------------------------------------------------

@frappe.whitelist()
def accept_sub_order(sub_order_name):
    """Accept a Sub Order. Validates ownership and Pending status."""
    _validate_seller_ownership(sub_order_name)
    so = _get_sub_order(sub_order_name)

    if so.status != "Pending":
        frappe.throw(_("Only Pending Sub Orders can be accepted. Current status: {0}").format(so.status))

    so.db_set("status", "Accepted", update_modified=True)
    so.db_set("accepted_at", now_datetime(), update_modified=False)

    return {"message": _("Sub Order {0} accepted successfully").format(sub_order_name)}


# ---------------------------------------------------------------------------
# 3. cancel_sub_order
# ---------------------------------------------------------------------------

@frappe.whitelist()
def cancel_sub_order(sub_order_name, reason=None):
    """Cancel a Sub Order. Validates ownership and Pending/Accepted status."""
    _validate_seller_ownership(sub_order_name)
    so = _get_sub_order(sub_order_name)

    if so.status not in ("Pending", "Accepted"):
        frappe.throw(
            _("Only Pending or Accepted Sub Orders can be cancelled. Current status: {0}").format(so.status)
        )

    so.db_set("status", "Cancelled", update_modified=True)
    so.db_set("cancelled_at", now_datetime(), update_modified=False)
    if reason:
        so.db_set("cancellation_reason", reason, update_modified=False)

    return {"message": _("Sub Order {0} cancelled").format(sub_order_name)}


# ---------------------------------------------------------------------------
# 4. seller_make_proforma_invoice
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_proforma_invoice(sub_order_name):
    """Create a Proforma Invoice from a Sub Order with items mapped."""
    _validate_seller_ownership(sub_order_name)
    so = _get_sub_order(sub_order_name, for_update=False)

    pi = frappe.new_doc("Proforma Invoice")
    pi.sub_order = so.name
    pi.seller = so.seller
    pi.buyer = so.get("buyer") or ""
    pi.company = so.get("company") or ""
    pi.currency = so.get("currency") or "TRY"
    pi.posting_date = frappe.utils.today()

    for item in so.get("items", []):
        pi.append("items", {
            "item_code": item.item_code,
            "item_name": item.get("item_name"),
            "qty": item.qty,
            "rate": item.rate,
            "amount": flt(item.qty) * flt(item.rate),
            "uom": item.get("uom"),
        })

    pi.run_method("set_missing_values")
    pi.run_method("calculate_taxes_and_totals")

    return pi


# ---------------------------------------------------------------------------
# 5. seller_make_sales_invoice
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_sales_invoice(source_name, target_doc=None):
    """Create a Sales Invoice from a Sub Order."""
    _validate_seller_ownership(source_name)

    def set_missing_values(source, target):
        target.custom_sub_order = source.name
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Sub Order",
        source_name,
        {
            "Sub Order": {
                "doctype": "Sales Invoice",
                "field_map": {
                    "name": "custom_sub_order",
                },
            },
            "Sub Order Item": {
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
# 6. seller_make_delivery_note
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_delivery_note(source_name, target_doc=None):
    """Create a Delivery Note from a Sub Order with balance quantities."""
    _validate_seller_ownership(source_name)
    delivered_qtys = _get_all_delivered_qtys(source_name)

    def update_item(source_doc, target_doc, source_parent):
        already = flt(delivered_qtys.get(source_doc.item_code, 0))
        target_doc.qty = flt(source_doc.qty) - already
        if target_doc.qty <= 0:
            target_doc.qty = 0

    def set_missing_values(source, target):
        target.custom_sub_order = source.name
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Sub Order",
        source_name,
        {
            "Sub Order": {
                "doctype": "Delivery Note",
                "field_map": {
                    "name": "custom_sub_order",
                },
            },
            "Sub Order Item": {
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
# 7. seller_make_payment_request
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_payment_request(sub_order_name, **kwargs):
    """Create a Payment Request using ERPNext's standard utility."""
    _validate_seller_ownership(sub_order_name)

    from erpnext.accounts.doctype.payment_request.payment_request import (
        make_payment_request as _make_payment_request,
    )
    return _make_payment_request(**kwargs)


# ---------------------------------------------------------------------------
# 8. seller_make_shipment
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_shipment(source_name, target_doc=None):
    """Create a Shipment from a Sub Order."""
    _validate_seller_ownership(source_name)

    def set_missing_values(source, target):
        target.custom_sub_order = source.name

    doclist = get_mapped_doc(
        "Sub Order",
        source_name,
        {
            "Sub Order": {
                "doctype": "Shipment",
                "field_map": {
                    "name": "custom_sub_order",
                },
            },
        },
        target_doc,
        set_missing_values,
    )

    return doclist


# ---------------------------------------------------------------------------
# 9. seller_make_return_credit_note
# ---------------------------------------------------------------------------

@frappe.whitelist()
def seller_make_return_credit_note(source_name, target_doc=None):
    """Create a return Credit Note (Sales Invoice with is_return=1) from a Sub Order."""
    _validate_seller_ownership(source_name)

    def set_missing_values(source, target):
        target.custom_sub_order = source.name
        target.is_return = 1
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Sub Order",
        source_name,
        {
            "Sub Order": {
                "doctype": "Sales Invoice",
                "field_map": {
                    "name": "custom_sub_order",
                },
            },
            "Sub Order Item": {
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
