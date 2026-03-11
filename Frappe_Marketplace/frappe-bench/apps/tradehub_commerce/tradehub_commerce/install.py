import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


DEFAULT_PAYMENT_TERMS = [
	{
		"template_code": "ADVANCE_100",
		"template_name": "100% Advance Payment",
		"term_type": "Advance",
		"due_days": 0,
		"description": "Full payment required before order processing.",
	},
	{
		"template_code": "NET_15",
		"template_name": "Net 15 Days",
		"term_type": "Net Days",
		"due_days": 15,
		"description": "Payment due within 15 days of invoice date.",
	},
	{
		"template_code": "NET_30",
		"template_name": "Net 30 Days",
		"term_type": "Net Days",
		"due_days": 30,
		"description": "Payment due within 30 days of invoice date.",
	},
	{
		"template_code": "NET_60",
		"template_name": "Net 60 Days",
		"term_type": "Net Days",
		"due_days": 60,
		"description": "Payment due within 60 days of invoice date.",
	},
	{
		"template_code": "NET_90",
		"template_name": "Net 90 Days",
		"term_type": "Net Days",
		"due_days": 90,
		"description": "Payment due within 90 days of invoice date.",
	},
	{
		"template_code": "DEPOSIT_30",
		"template_name": "30% Deposit, Balance on Delivery",
		"term_type": "Deposit-Balance",
		"deposit_percentage": 30,
		"description": "30% deposit upfront, remaining 70% due on delivery.",
	},
	{
		"template_code": "DEPOSIT_50",
		"template_name": "50% Deposit, Balance on Delivery",
		"term_type": "Deposit-Balance",
		"deposit_percentage": 50,
		"description": "50% deposit upfront, remaining 50% due on delivery.",
	},
	{
		"template_code": "COD",
		"template_name": "Cash on Delivery",
		"term_type": "COD",
		"due_days": 0,
		"description": "Payment collected upon delivery of goods.",
	},
	{
		"template_code": "INSTALLMENT_3",
		"template_name": "3 Monthly Installments",
		"term_type": "Installment",
		"installment_count": 3,
		"installment_interval_days": 30,
		"description": "Payment split into 3 equal monthly installments.",
	},
	{
		"template_code": "INSTALLMENT_6",
		"template_name": "6 Monthly Installments",
		"term_type": "Installment",
		"installment_count": 6,
		"installment_interval_days": 30,
		"description": "Payment split into 6 equal monthly installments.",
	},
	{
		"template_code": "ESCROW",
		"template_name": "Escrow Payment",
		"term_type": "Escrow",
		"description": "Payment held in escrow until buyer confirms receipt.",
	},
	{
		"template_code": "LC_30",
		"template_name": "Letter of Credit - 30 Days",
		"term_type": "Letter of Credit",
		"due_days": 30,
		"description": "Payment via letter of credit with 30-day sight.",
	},
]


def create_default_payment_terms():
	"""Create default Marketplace Payment Terms Template records."""
	for term_data in DEFAULT_PAYMENT_TERMS:
		doc = frappe.get_doc({
			"doctype": "Marketplace Payment Terms Template",
			"is_active": 1,
			**term_data,
		})
		doc.insert(ignore_if_duplicate=True)

	frappe.db.commit()


def create_default_checkout_settings():
	"""Create default Cart Protection Settings singleton with sensible defaults.

	Called during app installation via after_install hook.
	Sets defaults for checkout reservation, payment deadlines,
	and abuse detection thresholds.
	"""
	from tradehub_commerce.setup.install import create_default_checkout_settings as _create
	_create()


def create_performance_indexes():
	"""Create performance indexes on Delivery Note tables for marketplace queries.

	These indexes speed up lookups when filtering Delivery Notes and
	Delivery Note Items by marketplace order references.
	"""
	indexes = [
		(
			"idx_dn_custom_marketplace_order",
			"`tabDelivery Note`",
			"(custom_marketplace_order, docstatus)",
		),
		(
			"idx_dni_custom_marketplace_order_item",
			"`tabDelivery Note Item`",
			"(custom_marketplace_order_item)",
		),
	]

	for idx_name, table, columns in indexes:
		try:
			frappe.db.sql(
				f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} {columns}"
			)
		except Exception:
			# Index may already exist or column not yet created
			pass

	frappe.db.commit()


def after_install():
	"""Run after app installation."""
	create_default_payment_terms()
	setup_custom_fields()
	create_default_checkout_settings()
	create_performance_indexes()


def setup_custom_fields():
	"""Create Custom Fields on ERPNext DocTypes for TradeHub Commerce integration.

	Adds marketplace back-link fields to Sales Invoice, Delivery Note,
	Delivery Note Item, Payment Entry, Payment Request, and Shipment.
	"""
	custom_fields = {
		"Sales Invoice": [
			{
				"fieldname": "custom_marketplace_order",
				"label": "Marketplace Order",
				"fieldtype": "Link",
				"options": "Marketplace Order",
				"insert_after": "customer_name",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Marketplace Order",
			},
			{
				"fieldname": "custom_marketplace_order_id",
				"label": "Marketplace Order ID",
				"fieldtype": "Data",
				"insert_after": "custom_marketplace_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Marketplace Order identifier",
			},
			{
				"fieldname": "custom_sub_order",
				"label": "Sub Order",
				"fieldtype": "Link",
				"options": "Sub Order",
				"insert_after": "custom_marketplace_order_id",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Sub Order",
			},
		],
		"Delivery Note": [
			{
				"fieldname": "custom_marketplace_order",
				"label": "Marketplace Order",
				"fieldtype": "Link",
				"options": "Marketplace Order",
				"insert_after": "customer_name",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Marketplace Order",
			},
			{
				"fieldname": "custom_marketplace_order_id",
				"label": "Marketplace Order ID",
				"fieldtype": "Data",
				"insert_after": "custom_marketplace_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Marketplace Order identifier",
			},
			{
				"fieldname": "custom_sub_order",
				"label": "Sub Order",
				"fieldtype": "Link",
				"options": "Sub Order",
				"insert_after": "custom_marketplace_order_id",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Sub Order",
			},
			{
				"fieldname": "custom_shipment_number",
				"label": "Shipment Number",
				"fieldtype": "Int",
				"insert_after": "custom_sub_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Shipment sequence number for partial shipments",
			},
			{
				"fieldname": "custom_is_partial_shipment",
				"label": "Is Partial Shipment",
				"fieldtype": "Check",
				"insert_after": "custom_shipment_number",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Indicates this is a partial shipment",
			},
			{
				"fieldname": "custom_total_shipments",
				"label": "Total Shipments",
				"fieldtype": "Int",
				"insert_after": "custom_is_partial_shipment",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Total number of shipments for this order",
			},
			{
				"fieldname": "custom_partial_shipment_note",
				"label": "Partial Shipment Note",
				"fieldtype": "Small Text",
				"insert_after": "custom_total_shipments",
				"reqd": 0,
				"read_only": 0,
				"module": "TradeHub Commerce",
				"description": "Notes about partial shipment",
			},
		],
		"Delivery Note Item": [
			{
				"fieldname": "custom_marketplace_order_item",
				"label": "Marketplace Order Item",
				"fieldtype": "Data",
				"insert_after": "description",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Marketplace Order Item reference",
			},
			{
				"fieldname": "custom_listing",
				"label": "Listing",
				"fieldtype": "Data",
				"insert_after": "custom_marketplace_order_item",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Marketplace listing reference",
			},
			{
				"fieldname": "custom_sku",
				"label": "SKU",
				"fieldtype": "Data",
				"insert_after": "custom_listing",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Product SKU",
			},
			{
				"fieldname": "custom_ordered_qty",
				"label": "Ordered Qty",
				"fieldtype": "Float",
				"insert_after": "custom_sku",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Total quantity ordered",
			},
			{
				"fieldname": "custom_previously_shipped_qty",
				"label": "Previously Shipped Qty",
				"fieldtype": "Float",
				"insert_after": "custom_ordered_qty",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Quantity shipped in previous shipments",
			},
			{
				"fieldname": "custom_remaining_after_this",
				"label": "Remaining After This",
				"fieldtype": "Float",
				"insert_after": "custom_previously_shipped_qty",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Remaining quantity after this shipment",
			},
		],
		"Payment Entry": [
			{
				"fieldname": "custom_marketplace_order",
				"label": "Marketplace Order",
				"fieldtype": "Link",
				"options": "Marketplace Order",
				"insert_after": "party_name",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Marketplace Order",
			},
			{
				"fieldname": "custom_marketplace_order_id",
				"label": "Marketplace Order ID",
				"fieldtype": "Data",
				"insert_after": "custom_marketplace_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Marketplace Order identifier",
			},
		],
		"Payment Request": [
			{
				"fieldname": "custom_marketplace_order",
				"label": "Marketplace Order",
				"fieldtype": "Link",
				"options": "Marketplace Order",
				"insert_after": "party",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Marketplace Order",
			},
			{
				"fieldname": "custom_sub_order",
				"label": "Sub Order",
				"fieldtype": "Link",
				"options": "Sub Order",
				"insert_after": "custom_marketplace_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Sub Order",
			},
		],
		"Shipment": [
			{
				"fieldname": "custom_marketplace_order",
				"label": "Marketplace Order",
				"fieldtype": "Link",
				"options": "Marketplace Order",
				"insert_after": "pickup_company",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Marketplace Order",
			},
			{
				"fieldname": "custom_sub_order",
				"label": "Sub Order",
				"fieldtype": "Link",
				"options": "Sub Order",
				"insert_after": "custom_marketplace_order",
				"reqd": 0,
				"read_only": 1,
				"module": "TradeHub Commerce",
				"description": "Linked Sub Order",
			},
		],
	}

	create_custom_fields(custom_fields, ignore_validate=True)
	frappe.db.commit()
