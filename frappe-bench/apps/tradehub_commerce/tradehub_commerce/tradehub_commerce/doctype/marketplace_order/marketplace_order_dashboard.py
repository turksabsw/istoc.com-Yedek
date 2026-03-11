from frappe import _


def get_data():
	return {
		"fieldname": "marketplace_order",
		"non_standard_fieldnames": {
			"Payment Entry": "reference_name",
			"Payment Request": "reference_name",
		},
		"transactions": [
			{
				"label": _("Billing"),
				"items": ["Sales Invoice", "Payment Entry", "Payment Request"],
			},
			{
				"label": _("Fulfillment"),
				"items": ["Delivery Note", "Shipment"],
			},
			{
				"label": _("Returns"),
				"items": ["Return", "Dispute"],
			},
		],
	}
