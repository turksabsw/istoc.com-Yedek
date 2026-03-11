# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Checkout API

Whitelist APIs for multi-seller grouped checkout: session creation,
payment method selection, individual/batch payment initiation,
session retrieval, and payment options resolution.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, add_to_date, cint, flt, get_datetime
from typing import Dict, Any, List, Optional
import json


def _response(success: bool, data: Any = None, message: str = None, errors: List = None) -> Dict:
    """Standard API response format."""
    return {
        "success": success,
        "data": data,
        "message": message,
        "errors": errors or []
    }


def _get_current_buyer() -> Optional[str]:
    """Get the current user's buyer profile or user name."""
    return frappe.session.user


def _get_buyer_group(buyer: str) -> Optional[str]:
    """Get buyer group for payment terms resolution."""
    buyer_profile = frappe.db.get_value(
        "Buyer Profile",
        {"user": buyer},
        "buyer_group",
    )
    return buyer_profile


@frappe.whitelist()
def initiate_checkout(cart_name: str) -> Dict:
    """
    Create a Checkout Session from a Cart.

    Groups cart items by seller, resolves payment terms per seller via
    payment_terms_utils.get_applicable_payment_terms, reserves stock via
    cart_protection.reserve_stock_for_checkout, and blocks concurrent
    checkout via the concurrent_lock field.

    Args:
        cart_name: Cart document name

    Returns:
        API response with checkout session details
    """
    try:
        if not cart_name:
            return _response(False, message=_("Cart name is required"))

        # Load cart with row-level lock to prevent concurrent checkout
        cart = frappe.get_doc("Cart", cart_name, for_update=True)

        # Validate cart ownership
        if cart.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this cart"))

        # Validate cart status
        if cart.status not in ("Active", "Checkout"):
            return _response(False, message=_("Cart is not in a valid state for checkout"))

        if not cart.items:
            return _response(False, message=_("Cart is empty"))

        # Block concurrent checkout: check if an active session already exists
        existing_session = frappe.db.get_value(
            "Checkout Session",
            {"cart": cart_name, "status": "Active"},
            "name"
        )
        if existing_session:
            return _response(
                False,
                message=_("A checkout session is already active for this cart"),
                data={"existing_session": existing_session}
            )

        # Check concurrent_lock on any existing active session
        locked_session = frappe.db.get_value(
            "Checkout Session",
            {"cart": cart_name, "status": ["in", ["Active", "Payment Processing"]]},
            ["name", "concurrent_lock"],
            as_dict=True
        )
        if locked_session and locked_session.concurrent_lock:
            return _response(False, message=_("Another checkout is in progress for this cart"))

        # Resolve protection settings for reservation duration
        from tradehub_commerce.cart_protection import get_protection_setting
        reservation_minutes = get_protection_setting("checkout_reservation_minutes", default=30)
        expires_at = add_to_date(now_datetime(), minutes=cint(reservation_minutes))

        # Group cart items by seller
        seller_groups = {}
        for item in cart.items:
            seller = item.seller
            if seller not in seller_groups:
                seller_groups[seller] = {
                    "seller": seller,
                    "seller_name": frappe.db.get_value(
                        "Seller Profile", seller, "seller_name"
                    ) or seller,
                    "items": [],
                    "subtotal": 0,
                    "item_count": 0,
                }
            seller_groups[seller]["items"].append(item)
            seller_groups[seller]["subtotal"] += flt(item.line_total)
            seller_groups[seller]["item_count"] += 1

        # Create Checkout Session
        session = frappe.get_doc({
            "doctype": "Checkout Session",
            "cart": cart_name,
            "buyer": frappe.session.user,
            "status": "Active",
            "checkout_started_at": now_datetime(),
            "expires_at": expires_at,
            "concurrent_lock": frappe.session.user,
            "subtotal": flt(cart.subtotal),
            "shipping_total": flt(cart.shipping_amount),
            "tax_total": flt(cart.tax_amount),
            "discount_total": flt(cart.discount_amount),
            "grand_total": flt(cart.grand_total),
        })

        # Add seller groups with resolved payment terms
        from tradehub_commerce.payment_terms_utils import get_applicable_payment_terms

        buyer_group = _get_buyer_group(frappe.session.user)

        for seller, group_data in seller_groups.items():
            # Resolve payment terms for this seller
            terms_result = get_applicable_payment_terms(
                seller=seller,
                buyer_group=buyer_group,
                order_amount=group_data["subtotal"],
            )
            payment_terms_template = None
            if terms_result.get("success") and terms_result.get("data"):
                template = terms_result["data"].get("template")
                if template:
                    payment_terms_template = template.get("name")

            session.append("seller_groups", {
                "seller": seller,
                "seller_name": group_data["seller_name"],
                "item_count": group_data["item_count"],
                "subtotal": flt(group_data["subtotal"]),
                "shipping_amount": 0,
                "tax_amount": 0,
                "discount_amount": 0,
                "grand_total": flt(group_data["subtotal"]),
                "payment_status": "Pending",
                "payment_terms_template": payment_terms_template,
            })

        session.insert(ignore_permissions=True)

        # Reserve stock for each cart item
        from tradehub_commerce.cart_protection import reserve_stock_for_checkout

        reservation_errors = []
        for item in cart.items:
            res = reserve_stock_for_checkout(
                item=item.listing,
                qty=flt(item.qty),
                checkout_session=session.name,
                cart_line=item.name,
            )
            if not res.get("success"):
                reservation_errors.append({
                    "item": item.listing,
                    "message": res.get("message")
                })

        # Update cart status
        cart.status = "Checkout"
        if hasattr(cart, "checkout_session"):
            cart.checkout_session = session.name
        cart.save(ignore_permissions=True)

        frappe.db.commit()

        response_data = {
            "session": session.name,
            "status": session.status,
            "expires_at": str(session.expires_at),
            "seller_groups": [
                {
                    "seller": sg.seller,
                    "seller_name": sg.seller_name,
                    "subtotal": sg.subtotal,
                    "grand_total": sg.grand_total,
                    "payment_status": sg.payment_status,
                    "payment_terms_template": sg.payment_terms_template,
                }
                for sg in session.seller_groups
            ],
        }

        if reservation_errors:
            response_data["reservation_warnings"] = reservation_errors

        return _response(True, data=response_data)

    except Exception as e:
        frappe.log_error(f"Error initiating checkout: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def update_seller_group_payment_method(
    session_name: str,
    seller: str,
    payment_method: str
) -> Dict:
    """
    Update the payment method for a specific seller group in a checkout session.

    Args:
        session_name: Checkout Session name
        seller: Seller Profile name
        payment_method: Payment Method name

    Returns:
        API response
    """
    try:
        if not session_name or not seller or not payment_method:
            return _response(False, message=_("Session, seller, and payment method are required"))

        session = frappe.get_doc("Checkout Session", session_name, for_update=True)

        # Validate ownership
        if session.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this checkout session"))

        if session.status != "Active":
            return _response(False, message=_("Checkout session is not active"))

        # Find the seller group
        seller_group = None
        for sg in session.seller_groups:
            if sg.seller == seller:
                seller_group = sg
                break

        if not seller_group:
            return _response(False, message=_("Seller group not found in this session"))

        # Validate payment method is accepted by seller
        accepted = frappe.db.exists(
            "Seller Accepted Payment Method",
            {
                "parenttype": "Seller Payment Method",
                "parent": ["in", frappe.get_all(
                    "Seller Payment Method",
                    filters={"seller": seller},
                    pluck="name"
                )],
                "payment_method": payment_method,
                "is_enabled": 1
            }
        )
        # If no seller payment method config exists, allow any payment method
        has_seller_config = frappe.db.exists("Seller Payment Method", {"seller": seller})

        if has_seller_config and not accepted:
            return _response(False, message=_("This payment method is not accepted by the seller"))

        seller_group.payment_method = payment_method
        session.save(ignore_permissions=True)
        frappe.db.commit()

        return _response(True, message=_("Payment method updated successfully"), data={
            "seller": seller,
            "payment_method": payment_method
        })

    except Exception as e:
        frappe.log_error(f"Error updating seller group payment method: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def initiate_seller_group_payment(
    session_name: str,
    seller: str
) -> Dict:
    """
    Initiate payment for a specific seller group within a checkout session.

    Creates a Marketplace Order for the seller group and triggers payment processing.

    Args:
        session_name: Checkout Session name
        seller: Seller Profile name

    Returns:
        API response with order details
    """
    try:
        if not session_name or not seller:
            return _response(False, message=_("Session and seller are required"))

        session = frappe.get_doc("Checkout Session", session_name, for_update=True)

        # Validate ownership
        if session.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this checkout session"))

        if session.status not in ("Active", "Payment Processing"):
            return _response(False, message=_("Checkout session is not in a valid state for payment"))

        # Check expiry
        if session.expires_at and get_datetime(session.expires_at) < now_datetime():
            session.status = "Expired"
            session.save(ignore_permissions=True)
            frappe.db.commit()
            return _response(False, message=_("Checkout session has expired"))

        # Find seller group
        seller_group = None
        for sg in session.seller_groups:
            if sg.seller == seller:
                seller_group = sg
                break

        if not seller_group:
            return _response(False, message=_("Seller group not found in this session"))

        if seller_group.payment_status == "Paid":
            return _response(False, message=_("Payment already completed for this seller group"))

        if not seller_group.payment_method:
            return _response(False, message=_("Please select a payment method first"))

        # Update status
        session.status = "Payment Processing"
        seller_group.payment_status = "Processing"
        session.save(ignore_permissions=True)

        # Create Marketplace Order for this seller group
        cart = frappe.get_doc("Cart", session.cart)
        order = _create_order_for_seller_group(cart, session, seller_group)

        if order:
            seller_group.payment_status = "Paid"
            seller_group.marketplace_order = order.name
            session.save(ignore_permissions=True)

            # Check if all groups are paid
            all_paid = all(sg.payment_status == "Paid" for sg in session.seller_groups)
            if all_paid:
                session.status = "Completed"
                session.completed_at = now_datetime()
                session.save(ignore_permissions=True)

                # Update cart status
                cart.status = "Converted"
                cart.converted_to_order = 1
                cart.converted_at = now_datetime()
                cart.save(ignore_permissions=True)

            frappe.db.commit()

            return _response(True, data={
                "order": order.name,
                "seller": seller,
                "payment_status": seller_group.payment_status,
                "session_status": session.status
            })
        else:
            seller_group.payment_status = "Failed"
            session.save(ignore_permissions=True)
            frappe.db.commit()
            return _response(False, message=_("Failed to create order for seller group"))

    except Exception as e:
        frappe.log_error(f"Error initiating seller group payment: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def initiate_pay_all(session_name: str) -> Dict:
    """
    Initiate payment for all seller groups in a checkout session.

    Uses commit-and-continue strategy: successful payments are NOT reversed
    if subsequent seller group payments fail. Partial success is reported.

    Args:
        session_name: Checkout Session name

    Returns:
        API response with results per seller group
    """
    try:
        if not session_name:
            return _response(False, message=_("Session name is required"))

        session = frappe.get_doc("Checkout Session", session_name, for_update=True)

        # Validate ownership
        if session.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this checkout session"))

        if session.status not in ("Active", "Payment Processing"):
            return _response(False, message=_("Checkout session is not in a valid state for payment"))

        # Check expiry
        if session.expires_at and get_datetime(session.expires_at) < now_datetime():
            session.status = "Expired"
            session.save(ignore_permissions=True)
            frappe.db.commit()
            return _response(False, message=_("Checkout session has expired"))

        session.status = "Payment Processing"
        session.save(ignore_permissions=True)
        frappe.db.commit()

        cart = frappe.get_doc("Cart", session.cart)

        results = []
        has_failure = False

        for seller_group in session.seller_groups:
            if seller_group.payment_status == "Paid":
                results.append({
                    "seller": seller_group.seller,
                    "status": "already_paid",
                    "order": seller_group.marketplace_order
                })
                continue

            if not seller_group.payment_method:
                seller_group.payment_status = "Failed"
                results.append({
                    "seller": seller_group.seller,
                    "status": "failed",
                    "message": "No payment method selected"
                })
                has_failure = True
                # Commit-and-continue: save state and proceed
                session.save(ignore_permissions=True)
                frappe.db.commit()
                continue

            try:
                seller_group.payment_status = "Processing"
                session.save(ignore_permissions=True)
                frappe.db.commit()

                # Reload to get fresh state
                session = frappe.get_doc("Checkout Session", session_name, for_update=True)
                # Re-find seller group after reload
                for sg in session.seller_groups:
                    if sg.seller == seller_group.seller:
                        seller_group = sg
                        break

                order = _create_order_for_seller_group(cart, session, seller_group)

                if order:
                    seller_group.payment_status = "Paid"
                    seller_group.marketplace_order = order.name
                    results.append({
                        "seller": seller_group.seller,
                        "status": "paid",
                        "order": order.name
                    })
                else:
                    seller_group.payment_status = "Failed"
                    has_failure = True
                    results.append({
                        "seller": seller_group.seller,
                        "status": "failed",
                        "message": "Order creation failed"
                    })

                # Commit after each seller group (commit-and-continue)
                session.save(ignore_permissions=True)
                frappe.db.commit()

            except Exception as group_error:
                frappe.log_error(
                    f"Pay All: error for seller {seller_group.seller}: {str(group_error)}"
                )
                # Reload session after error
                session = frappe.get_doc("Checkout Session", session_name, for_update=True)
                for sg in session.seller_groups:
                    if sg.seller == seller_group.seller:
                        sg.payment_status = "Failed"
                        break
                has_failure = True
                results.append({
                    "seller": seller_group.seller,
                    "status": "failed",
                    "message": str(group_error)
                })
                session.save(ignore_permissions=True)
                frappe.db.commit()

        # Final session status update
        session = frappe.get_doc("Checkout Session", session_name, for_update=True)
        all_paid = all(sg.payment_status == "Paid" for sg in session.seller_groups)

        if all_paid:
            session.status = "Completed"
            session.completed_at = now_datetime()

            # Update cart
            cart.status = "Converted"
            cart.converted_to_order = 1
            cart.converted_at = now_datetime()
            cart.save(ignore_permissions=True)
        elif has_failure:
            # Partial success — session stays in Payment Processing
            session.status = "Payment Processing"

        session.save(ignore_permissions=True)
        frappe.db.commit()

        return _response(
            success=not has_failure,
            data={
                "session": session_name,
                "session_status": session.status,
                "results": results
            },
            message=_("Some payments failed. Successful payments have not been reversed.") if has_failure else _("All payments completed successfully")
        )

    except Exception as e:
        frappe.log_error(f"Error in pay all: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def get_checkout_session(session_name: str) -> Dict:
    """
    Get checkout session details including seller groups and their status.

    Args:
        session_name: Checkout Session name

    Returns:
        API response with session details
    """
    try:
        if not session_name:
            return _response(False, message=_("Session name is required"))

        session = frappe.get_doc("Checkout Session", session_name)

        # Validate ownership
        if session.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this checkout session"))

        # Check and update expiry
        if session.status == "Active" and session.expires_at:
            if get_datetime(session.expires_at) < now_datetime():
                session.status = "Expired"
                session.save(ignore_permissions=True)
                frappe.db.commit()

        data = {
            "name": session.name,
            "cart": session.cart,
            "buyer": session.buyer,
            "status": session.status,
            "checkout_started_at": str(session.checkout_started_at) if session.checkout_started_at else None,
            "expires_at": str(session.expires_at) if session.expires_at else None,
            "timer_extended": cint(session.timer_extended),
            "subtotal": flt(session.subtotal),
            "shipping_total": flt(session.shipping_total),
            "tax_total": flt(session.tax_total),
            "discount_total": flt(session.discount_total),
            "grand_total": flt(session.grand_total),
            "completed_at": str(session.completed_at) if session.completed_at else None,
            "seller_groups": []
        }

        for sg in session.seller_groups:
            data["seller_groups"].append({
                "seller": sg.seller,
                "seller_name": sg.seller_name,
                "item_count": cint(sg.item_count),
                "subtotal": flt(sg.subtotal),
                "shipping_amount": flt(sg.shipping_amount),
                "tax_amount": flt(sg.tax_amount),
                "discount_amount": flt(sg.discount_amount),
                "grand_total": flt(sg.grand_total),
                "payment_method": sg.payment_method,
                "payment_status": sg.payment_status,
                "payment_terms_template": sg.payment_terms_template,
                "marketplace_order": sg.marketplace_order,
            })

        return _response(True, data=data)

    except Exception as e:
        frappe.log_error(f"Error getting checkout session: {str(e)}")
        return _response(False, message=str(e))


@frappe.whitelist()
def get_checkout_payment_options(
    session_name: str,
    seller: str = None
) -> Dict:
    """
    Get available payment options for a checkout session.

    Calls payment_terms_utils for terms resolution and queries seller
    accepted payment methods.

    Args:
        session_name: Checkout Session name
        seller: Optional seller to get options for a specific seller group

    Returns:
        API response with payment options per seller
    """
    try:
        if not session_name:
            return _response(False, message=_("Session name is required"))

        session = frappe.get_doc("Checkout Session", session_name)

        # Validate ownership
        if session.buyer != frappe.session.user:
            return _response(False, message=_("You do not own this checkout session"))

        from tradehub_commerce.payment_terms_utils import get_applicable_payment_terms
        buyer_group = _get_buyer_group(frappe.session.user)

        seller_options = []

        for sg in session.seller_groups:
            if seller and sg.seller != seller:
                continue

            # Get payment terms for this seller
            terms_result = get_applicable_payment_terms(
                seller=sg.seller,
                buyer_group=buyer_group,
                order_amount=flt(sg.grand_total),
            )

            payment_terms = None
            if terms_result.get("success") and terms_result.get("data"):
                payment_terms = terms_result["data"]

            # Get seller's accepted payment methods
            accepted_methods = []
            seller_pm = frappe.db.get_value(
                "Seller Payment Method",
                {"seller": sg.seller},
                "name"
            )
            if seller_pm:
                methods = frappe.get_all(
                    "Seller Accepted Payment Method",
                    filters={
                        "parent": seller_pm,
                        "parenttype": "Seller Payment Method",
                        "is_enabled": 1
                    },
                    fields=["payment_method", "compatible_term_types"]
                )
                for m in methods:
                    accepted_methods.append({
                        "payment_method": m.payment_method,
                        "compatible_term_types": m.compatible_term_types
                    })

            # If no seller payment method config, get all active payment methods
            if not seller_pm:
                all_methods = frappe.get_all(
                    "Payment Method",
                    filters={"enabled": 1},
                    fields=["name"],
                    limit=20
                )
                for m in all_methods:
                    accepted_methods.append({
                        "payment_method": m.name,
                        "compatible_term_types": None
                    })

            seller_options.append({
                "seller": sg.seller,
                "seller_name": sg.seller_name,
                "grand_total": flt(sg.grand_total),
                "payment_terms": payment_terms,
                "accepted_payment_methods": accepted_methods,
                "current_payment_method": sg.payment_method,
                "current_payment_terms_template": sg.payment_terms_template,
            })

        return _response(True, data={"seller_options": seller_options})

    except Exception as e:
        frappe.log_error(f"Error getting checkout payment options: {str(e)}")
        return _response(False, message=str(e))


def _create_order_for_seller_group(cart, session, seller_group) -> Optional[Any]:
    """
    Create a Marketplace Order for a specific seller group.

    Args:
        cart: Cart document
        session: Checkout Session document
        seller_group: Checkout Seller Group child row

    Returns:
        Created Marketplace Order document, or None on failure
    """
    try:
        # Filter cart items for this seller
        seller_items = [item for item in cart.items if item.seller == seller_group.seller]

        if not seller_items:
            return None

        order_data = {
            "doctype": "Marketplace Order",
            "buyer": cart.buyer,
            "buyer_type": getattr(cart, "buyer_type", "Individual"),
            "organization": getattr(cart, "organization", None),
            "tenant": getattr(cart, "tenant", None),
            "cart": cart.name,
            "checkout_session_id": session.name,
            "currency": getattr(cart, "currency", "TRY"),
            "subtotal": flt(seller_group.subtotal),
            "shipping_amount": flt(seller_group.shipping_amount),
            "tax_amount": flt(seller_group.tax_amount),
            "discount_amount": flt(seller_group.discount_amount),
            "grand_total": flt(seller_group.grand_total),
            "is_b2b_order": getattr(cart, "is_b2b_cart", 0),
            "payment_terms_template": seller_group.payment_terms_template,
        }

        order = frappe.get_doc(order_data)

        for item in seller_items:
            order.append("items", {
                "listing": item.listing,
                "listing_variant": getattr(item, "listing_variant", None),
                "seller": item.seller,
                "title": getattr(item, "title", ""),
                "sku": getattr(item, "sku", ""),
                "qty": item.qty,
                "unit_price": getattr(item, "unit_price", 0),
                "line_total": flt(item.line_total),
                "tax_rate": getattr(item, "tax_rate", 0),
                "tax_amount": getattr(item, "tax_amount", 0),
                "weight": getattr(item, "weight", 0),
                "primary_image": getattr(item, "primary_image", None),
            })

        order.flags.ignore_permissions = True
        order.insert()

        return order

    except Exception as e:
        frappe.log_error(
            f"Error creating order for seller {seller_group.seller}: {str(e)}"
        )
        return None
