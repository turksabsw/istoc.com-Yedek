# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Setup / Installation Module

Creates default Cart Protection Settings on app install.
"""

import frappe


def create_default_checkout_settings():
    """
    Create default Cart Protection Settings if not already configured.

    Called during app installation via after_install hook.
    Sets sensible defaults for checkout reservation, payment deadlines,
    and abuse detection thresholds.
    """
    if frappe.db.exists("Cart Protection Settings", "Cart Protection Settings"):
        settings = frappe.get_doc("Cart Protection Settings")
        # Only update if values are not already set
        changed = False
        defaults = {
            "checkout_reservation_minutes": 30,
            "payment_deadline_hours": 24,
            "max_checkout_extensions": 1,
            "extension_minutes": 15,
            "enable_stock_reservation": 1,
            "enable_payment_deadline": 1,
            "enable_abuse_detection": 1,
            "enable_cart_health_check": 1,
            "abandonment_threshold": 5,
        }
        for field, value in defaults.items():
            if not settings.get(field):
                settings.set(field, value)
                changed = True

        if changed:
            settings.save(ignore_permissions=True)
    else:
        settings = frappe.get_doc({
            "doctype": "Cart Protection Settings",
            "checkout_reservation_minutes": 30,
            "payment_deadline_hours": 24,
            "max_checkout_extensions": 1,
            "extension_minutes": 15,
            "enable_stock_reservation": 1,
            "enable_payment_deadline": 1,
            "enable_abuse_detection": 1,
            "enable_cart_health_check": 1,
            "abandonment_threshold": 5,
        })
        settings.insert(ignore_permissions=True)

    frappe.db.commit()
