// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('PIM Attribute', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Attribute Group - show available groups
        frm.set_query('attribute_group', function() {
            return {};
        });

        // Link DocType - show standard DocTypes
        frm.set_query('link_doctype', function() {
            return {
                filters: {
                    'istable': 0,
                    'issingle': 0
                }
            };
        });
    }
});
