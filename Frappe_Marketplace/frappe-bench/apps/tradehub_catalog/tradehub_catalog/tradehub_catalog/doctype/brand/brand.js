// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Brand', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Country of Origin - show all countries (standard Link)
        frm.set_query('country_of_origin', function() {
            return {};
        });
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('verification_status', 'read_only', 1);
            frm.set_df_property('verification_notes', 'read_only', 1);
            frm.set_df_property('display_order', 'read_only', 1);
            frm.set_df_property('featured', 'read_only', 1);
            frm.set_df_property('show_in_filters', 'read_only', 1);
        }
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    tenant: function(frm) {
        // Clear fetch_from fields when tenant is cleared
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    registered_by: function(frm) {
        // Clear fetch_from fields when registered_by is cleared
        if (!frm.doc.registered_by) {
            frm.set_value('registered_by_name', '');
        }
    }
});
