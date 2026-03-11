// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Moderation Case', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Content Type - show only relevant DocTypes for moderation
        frm.set_query('content_type', function() {
            return {
                filters: {
                    'name': ['in', [
                        'Listing', 'Review', 'Storefront', 'Message',
                        'Seller Profile', 'Certificate'
                    ]]
                }
            };
        });

        // Account Action - filter by tenant
        frm.set_query('account_action_link', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
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
            frm.set_df_property('priority', 'read_only', 1);
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('assigned_to', 'read_only', 1);
            frm.set_df_property('decision', 'read_only', 1);
            frm.set_df_property('decision_reason', 'read_only', 1);
            frm.set_df_property('decision_notes', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    // =====================================================
    // Clear-on-change Handlers
    // =====================================================
    tenant: function(frm) {
        // Clear fetch_from fields dependent on tenant
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    }
});
