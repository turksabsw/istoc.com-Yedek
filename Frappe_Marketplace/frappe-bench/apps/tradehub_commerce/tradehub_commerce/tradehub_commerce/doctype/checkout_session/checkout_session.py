# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, add_to_date, get_datetime, flt


class CheckoutSession(Document):
    """
    Checkout Session DocType for TR-TradeHub marketplace.

    Manages the checkout lifecycle from cart to order completion.
    Supports multi-seller checkout with seller group tracking,
    session expiry, and concurrent access locking.
    """

    def before_insert(self):
        """Set default values before creating a new checkout session."""
        if not self.checkout_started_at:
            self.checkout_started_at = now_datetime()

        if not self.expires_at:
            self.expires_at = add_to_date(now_datetime(), minutes=30)

        if not self.buyer and frappe.session.user != "Guest":
            self.buyer = frappe.session.user

    def validate(self):
        """Validate checkout session data.

        Ordering follows Pattern 9:
        1. Field validation
        2. Status validation
        3. Calculations last
        """
        self.validate_cart()
        self.validate_buyer()
        self.validate_status_transition()
        self.check_expiry()
        self.calculate_totals()

    def on_update(self):
        """Actions after checkout session is updated."""
        if self.status == "Completed" and not self.completed_at:
            self.db_set("completed_at", now_datetime())

    # =================================================================
    # Validation Methods
    # =================================================================

    def validate_cart(self):
        """Validate cart exists and is valid for checkout."""
        if not frappe.db.exists("Cart", self.cart):
            frappe.throw(_("Cart {0} does not exist").format(self.cart))

        cart_status = frappe.db.get_value("Cart", self.cart, "status")
        if self.is_new() and cart_status not in ("Active", "Checkout"):
            frappe.throw(
                _("Cart {0} is not eligible for checkout (status: {1})").format(
                    self.cart, cart_status
                )
            )

    def validate_buyer(self):
        """Validate buyer exists."""
        if self.buyer and not frappe.db.exists("User", self.buyer):
            frappe.throw(_("Buyer {0} does not exist").format(self.buyer))

    def validate_status_transition(self):
        """Validate status transitions are valid."""
        if self.is_new():
            return

        old_status = self.get_db_value("status")
        if not old_status or old_status == self.status:
            return

        valid_transitions = {
            "Active": ["Payment Processing", "Expired", "Cancelled"],
            "Payment Processing": ["Completed", "Active", "Cancelled"],
            "Completed": [],
            "Expired": [],
            "Cancelled": [],
        }

        allowed = valid_transitions.get(old_status, [])
        if self.status not in allowed:
            frappe.throw(
                _("Cannot transition from {0} to {1}").format(old_status, self.status)
            )

    def check_expiry(self):
        """Check if session has expired and update status."""
        if (
            self.status == "Active"
            and self.expires_at
            and get_datetime(self.expires_at) < get_datetime(now_datetime())
        ):
            self.status = "Expired"

    # =================================================================
    # Calculation Methods
    # =================================================================

    def calculate_totals(self):
        """Calculate totals from seller groups."""
        self.subtotal = flt(0)
        self.shipping_total = flt(0)
        self.tax_total = flt(0)
        self.discount_total = flt(0)
        self.grand_total = flt(0)

        for group in self.seller_groups:
            self.subtotal += flt(group.subtotal)
            self.shipping_total += flt(group.shipping_amount)
            self.tax_total += flt(group.tax_amount)
            self.discount_total += flt(group.discount_amount)
            self.grand_total += flt(group.grand_total)

    # =================================================================
    # Lifecycle Methods
    # =================================================================

    def start_payment(self):
        """Transition session to payment processing."""
        if self.status != "Active":
            frappe.throw(_("Only active sessions can start payment"))

        self.status = "Payment Processing"
        self.save()

    def complete(self):
        """Mark checkout session as completed."""
        if self.status != "Payment Processing":
            frappe.throw(_("Only sessions in payment processing can be completed"))

        self.status = "Completed"
        self.completed_at = now_datetime()
        self.save()

    def cancel_session(self):
        """Cancel the checkout session."""
        if self.status in ("Completed", "Expired", "Cancelled"):
            frappe.throw(_("Cannot cancel a {0} session").format(self.status))

        self.status = "Cancelled"
        self.save()

    def extend_timer(self, minutes=15):
        """Extend the session expiry timer."""
        if self.status != "Active":
            frappe.throw(_("Can only extend timer for active sessions"))

        if self.timer_extended:
            frappe.throw(_("Timer has already been extended"))

        self.expires_at = add_to_date(now_datetime(), minutes=minutes)
        self.timer_extended = 1
        self.save()

    # =================================================================
    # Locking Methods
    # =================================================================

    def acquire_lock(self, lock_id):
        """Acquire a concurrent lock on this session."""
        if self.concurrent_lock and self.concurrent_lock != lock_id:
            frappe.throw(_("Session is locked by another process"))

        self.db_set("concurrent_lock", lock_id)

    def release_lock(self, lock_id):
        """Release the concurrent lock."""
        if self.concurrent_lock == lock_id:
            self.db_set("concurrent_lock", None)
