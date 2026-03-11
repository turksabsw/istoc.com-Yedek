// Copyright (c) 2026, Trade Hub and contributors
// For license information, please see license.txt

frappe.listview_settings['Variant Request'] = {
    add_fields: ['demand_request_count', 'brand', 'requesting_seller'],
    filters: [
        ['status', 'in', ['Pending', 'Under Review']]
    ],

    get_indicator: function(doc) {
        var colors = {
            'Pending': 'gray',
            'Under Review': 'blue',
            'Approved': 'green',
            'Rejected': 'red'
        };
        return [__(doc.status), colors[doc.status] || 'gray', 'status,=,' + doc.status];
    },

    formatters: {
        demand_request_count: function(value) {
            if (value >= 5) {
                return '<span class="text-danger font-weight-bold">' + value + ' sellers</span>';
            }
            if (value >= 3) {
                return '<span class="text-warning">' + value + ' sellers</span>';
            }
            return (value || 1) + ' seller';
        }
    }
};
