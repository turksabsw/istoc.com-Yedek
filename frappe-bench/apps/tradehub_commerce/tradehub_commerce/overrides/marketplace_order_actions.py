# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Override hooks for ERPNext document events related to Marketplace Orders.

This module re-exports doc_event handlers from the main marketplace_order_actions
module and provides any additional override-specific handlers.
"""

from tradehub_commerce.marketplace_order_actions import (
	on_sales_invoice_submit,
	on_delivery_note_submit,
	on_delivery_note_cancel,
	on_payment_entry_submit,
)


def on_shipment_create(doc, method):
	"""Handle Shipment creation for marketplace-linked shipments.

	Updates the associated Sub Order/Marketplace Order with shipment tracking
	information when a Shipment document is created with marketplace references.
	"""
	import frappe

	if not doc.get("custom_marketplace_order"):
		return

	try:
		# Update sub order with shipment reference if applicable
		if doc.get("custom_sub_order"):
			frappe.db.set_value(
				"Sub Order",
				doc.custom_sub_order,
				"latest_shipment",
				doc.name,
			)
	except Exception as e:
		frappe.log_error(
			message=f"Failed to process shipment create for {doc.name}: {str(e)}",
			title="Shipment Create Hook Error",
		)
