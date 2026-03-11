// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Filter Config', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Category - P1 Tenant Isolation
        frm.set_query('category', function() {
            let filters = {};
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // Attribute - filter active attributes
        frm.set_query('attribute', function() {
            return {};
        });
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    tenant: function(frm) {
        // Clear fetch_from fields when tenant is cleared
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
        // Validate that current category belongs to new tenant
        if (frm.doc.category && frm.doc.tenant) {
            frappe.db.get_value('Product Category', frm.doc.category, 'tenant', function(r) {
                if (r && r.tenant && r.tenant !== frm.doc.tenant) {
                    frm.set_value('category', null);
                    frm.set_value('category_name', '');
                    frm.set_value('category_full_path', '');
                    frappe.show_alert({
                        message: __('Category cleared because it does not belong to the selected Tenant'),
                        indicator: 'orange'
                    });
                }
            });
        }
    },

    category: function(frm) {
        // Clear fetch_from fields when category is cleared
        if (!frm.doc.category) {
            frm.set_value('category_name', '');
            frm.set_value('category_full_path', '');
        }
    },

    attribute: function(frm) {
        // Clear fetch_from fields when attribute is cleared
        if (!frm.doc.attribute) {
            frm.set_value('attribute_name', '');
        }
    }
});
