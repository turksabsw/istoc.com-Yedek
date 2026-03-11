"""
Scheduled tasks for TradeHub Commerce

Re-exports all scheduled task functions so they can be referenced
from hooks.py as tradehub_commerce.tasks.<function_name>.
"""

from tradehub_commerce.tasks.cart_protection import (
	check_expired_reservations,
	auto_cancel_overdue_orders,
	cart_health_check,
	daily_abuse_detection,
	cleanup_expired_reservations,
)


def seller_payout():
	"""Daily scheduled task to process pending seller payouts.

	This task:
	1. Finds all orders that have been delivered and payment received
	2. Calculates commission based on Commission Plan/Rules
	3. Creates payout entries for sellers
	4. Updates seller balance records
	5. Triggers payment gateway transfer for eligible payouts
	"""
	import frappe

	frappe.logger().info("Running seller_payout scheduled task")
	# Seller payout logic is a stub pending full implementation
