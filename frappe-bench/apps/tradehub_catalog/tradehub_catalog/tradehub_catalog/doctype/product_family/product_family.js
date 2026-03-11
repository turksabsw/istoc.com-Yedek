// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Product Family', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Product Class - show available classes
        frm.set_query('product_class', function() {
            return {};
        });
    }
});
