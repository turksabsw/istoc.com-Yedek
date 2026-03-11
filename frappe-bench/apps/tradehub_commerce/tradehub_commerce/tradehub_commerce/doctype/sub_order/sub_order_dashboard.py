from frappe import _


def get_data():
    return {
        "fieldname": "custom_sub_order",
        "non_standard_fieldnames": {},
        "transactions": [
            {
                "label": _("Billing"),
                "items": ["Proforma Invoice", "Sales Invoice", "Payment Request"],
            },
            {
                "label": _("Fulfillment"),
                "items": ["Delivery Note", "Shipment"],
            },
            {
                "label": _("Returns"),
                "items": ["Sales Invoice"],
            },
        ],
    }
