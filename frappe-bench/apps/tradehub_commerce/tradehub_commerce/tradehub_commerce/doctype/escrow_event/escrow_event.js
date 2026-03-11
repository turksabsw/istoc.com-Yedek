// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Escrow Event', {
    refresh: function(frm) {
        // =====================================================
        // Link Filters
        // =====================================================
        // Note: Escrow Event does not have a direct tenant field.
        // Filters are based on available parent fields (escrow_account, marketplace_order).

        // Sub Order - filter by marketplace_order if available
        frm.set_query('sub_order', function() {
            let filters = {};
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });

        // Payment Intent - filter by marketplace_order if available
        frm.set_query('payment_intent', function() {
            let filters = {};
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('payout_status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);
            frm.set_df_property('escrow_status', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    // =====================================================
    // Clear-on-change handlers for fetch_from fields
    // =====================================================
    escrow_account: function(frm) {
        if (!frm.doc.escrow_account) {
            frm.set_value('escrow_status', '');
        }
    },

    seller: function(frm) {
        if (!frm.doc.seller) {
            frm.set_value('seller_name', '');
        }
    }
});
