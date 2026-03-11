// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Payment Method', {
    refresh: function(frm) {
        // =====================================================
        // Configuration Link Filters
        // =====================================================
        // Payment Method is a configuration DocType - no tenant isolation needed.
        // Currency, Email Template, Print Format, Mode of Payment, Account
        // are system-level DocTypes that don't require tenant filtering.
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    }
});
