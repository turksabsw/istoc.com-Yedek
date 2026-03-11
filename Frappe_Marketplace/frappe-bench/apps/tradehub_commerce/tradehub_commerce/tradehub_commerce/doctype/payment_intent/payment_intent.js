// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Payment Intent', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Marketplace Order - filter by tenant
        frm.set_query('marketplace_order', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Sub Order - filter by tenant and marketplace_order
        frm.set_query('sub_order', function() {
            let filters = {};
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });

        // Cart - filter by tenant
        frm.set_query('cart', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Organization - filter by tenant
        frm.set_query('organization', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Escrow Account - filter by tenant and marketplace_order
        frm.set_query('escrow_account', function() {
            let filters = {};
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });

        // Make tenant field read-only when buyer is selected
        frm.set_df_property('tenant', 'read_only', frm.doc.buyer ? 1 : 0);
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('refund_status', 'read_only', 1);
            frm.set_df_property('escrow_status', 'read_only', 1);
            frm.set_df_property('risk_score', 'read_only', 1);
            frm.set_df_property('risk_level', 'read_only', 1);
            frm.set_df_property('fraud_check_status', 'read_only', 1);
            frm.set_df_property('is_flagged', 'read_only', 1);
            frm.set_df_property('erpnext_sync_status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    // =====================================================
    // Clear-on-change handlers for fetch_from fields
    // =====================================================
    tenant: function(frm) {
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    buyer: function(frm) {
        if (!frm.doc.buyer) {
            frm.set_value('buyer_name', '');
            frm.set_value('buyer_email', '');
        }
    },

    marketplace_order: function(frm) {
        if (!frm.doc.marketplace_order) {
            frm.set_value('marketplace_order_number', '');
        }
    }
});
