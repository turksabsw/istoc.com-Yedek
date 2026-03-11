# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, get_datetime


class StockReservation(Document):
    """
    Stock Reservation DocType for TR-TradeHub.

    Reserves inventory for a cart/checkout session to prevent overselling.
    Supports atomic reservation logic with expiry-based auto-release.
    """

    def before_insert(self):
        """Set defaults before creating a new reservation."""
        if not self.status:
            self.status = "Active"

        if not self.reservation_key:
            self.reservation_key = frappe.generate_hash(length=20)

    def validate(self):
        """Validate reservation data before saving."""
        self.validate_qty()
        self.validate_status_transition()

    def validate_qty(self):
        """Ensure quantity is positive."""
        if self.qty is not None and self.qty <= 0:
            frappe.throw(_("Quantity must be greater than zero."))

    def validate_status_transition(self):
        """Validate that status transitions are valid."""
        if self.is_new():
            return

        old_status = self.get_db_value("status")
        if not old_status or old_status == self.status:
            return

        valid_transitions = {
            "Active": ["Consumed", "Released", "Expired"],
            "Consumed": [],
            "Released": [],
            "Expired": [],
        }

        allowed = valid_transitions.get(old_status, [])
        if self.status not in allowed:
            frappe.throw(
                _("Cannot transition Stock Reservation from {0} to {1}").format(
                    old_status, self.status
                )
            )

    def on_update(self):
        """Actions after reservation is updated."""
        if self.status in ("Released", "Expired") and not self.released_at:
            self.db_set("released_at", now_datetime())

    # =================================================================
    # Atomic Reservation Methods
    # =================================================================

    @staticmethod
    def create_reservation(item, qty, checkout_session=None, cart_line=None,
                           warehouse=None, expires_at=None):
        """
        Atomically create a stock reservation.

        Args:
            item: Link to Listing
            qty: Quantity to reserve
            checkout_session: Checkout session identifier
            cart_line: Cart line identifier
            warehouse: Warehouse identifier
            expires_at: Expiry datetime for the reservation

        Returns:
            StockReservation document

        Raises:
            frappe.ValidationError if reservation cannot be created
        """
        reservation = frappe.get_doc({
            "doctype": "Stock Reservation",
            "item": item,
            "qty": qty,
            "warehouse": warehouse,
            "checkout_session": checkout_session,
            "cart_line": cart_line,
            "status": "Active",
            "expires_at": expires_at,
        })
        reservation.insert(ignore_permissions=True)
        return reservation

    def consume(self):
        """Mark reservation as consumed (order placed successfully)."""
        if self.status != "Active":
            frappe.throw(
                _("Only active reservations can be consumed. Current status: {0}").format(
                    self.status
                )
            )
        self.db_set("status", "Consumed")

    def release(self, reason=None):
        """
        Release the reservation, making stock available again.

        Args:
            reason: Reason for releasing the reservation
        """
        if self.status != "Active":
            frappe.throw(
                _("Only active reservations can be released. Current status: {0}").format(
                    self.status
                )
            )
        now = now_datetime()
        self.db_set({
            "status": "Released",
            "released_at": now,
            "release_reason": reason or "Manual release",
        })

    def mark_expired(self):
        """Mark reservation as expired."""
        if self.status != "Active":
            return
        now = now_datetime()
        self.db_set({
            "status": "Expired",
            "released_at": now,
            "release_reason": "Reservation expired",
        })

    @staticmethod
    def get_active_reserved_qty(item, warehouse=None):
        """
        Get the total actively reserved quantity for an item.

        Args:
            item: Listing name
            warehouse: Optional warehouse filter

        Returns:
            Float: total reserved quantity
        """
        filters = {
            "item": item,
            "status": "Active",
        }
        if warehouse:
            filters["warehouse"] = warehouse

        reserved = frappe.db.get_value(
            "Stock Reservation",
            filters=filters,
            fieldname="SUM(qty)",
        )
        return reserved or 0.0

    @staticmethod
    def release_expired_reservations():
        """
        Release all reservations that have passed their expiry time.

        Intended to be called by a scheduled job.
        """
        now = now_datetime()
        expired = frappe.get_all(
            "Stock Reservation",
            filters={
                "status": "Active",
                "expires_at": ["<=", now],
                "expires_at": ["is", "set"],
            },
            pluck="name",
        )

        for name in expired:
            try:
                doc = frappe.get_doc("Stock Reservation", name)
                doc.mark_expired()
            except Exception:
                frappe.log_error(
                    title=_("Failed to expire Stock Reservation {0}").format(name),
                )
