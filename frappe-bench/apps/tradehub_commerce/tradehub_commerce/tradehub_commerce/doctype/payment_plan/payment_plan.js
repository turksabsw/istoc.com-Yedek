// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Payment Plan', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Order - filter by tenant
        frm.set_query('order', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Buyer - filter by tenant (read_only via fetch_from, but filter still useful)
        frm.set_query('buyer', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Seller - filter by tenant (read_only via fetch_from, but filter still useful)
        frm.set_query('seller', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Make tenant field read-only when order is selected
        // (tenant is auto-populated from order via fetch_from)
        frm.set_df_property('tenant', 'read_only', frm.doc.order ? 1 : 0);
    
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
    },

    // =====================================================
    // Clear-on-change handlers for fetch_from fields
    // =====================================================
    order: function(frm) {
        // When order changes, all 17 fetch_from fields need to be cleared
        if (!frm.doc.order) {
            // Order details
            frm.set_value('order_number', '');
            frm.set_value('order_date', '');
            frm.set_value('order_status', '');
            frm.set_value('order_total', 0);
            frm.set_value('order_currency', '');

            // Buyer details (fetched from order)
            frm.set_value('buyer', '');
            frm.set_value('buyer_name', '');
            frm.set_value('buyer_company', '');
            frm.set_value('buyer_email', '');
            frm.set_value('buyer_phone', '');

            // Seller details (fetched from order)
            frm.set_value('seller', '');
            frm.set_value('seller_name', '');
            frm.set_value('seller_company', '');
            frm.set_value('seller_email', '');
            frm.set_value('seller_phone', '');

            // Tenant details (fetched from order)
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
        }
    },

    tenant: function(frm) {
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    }
});
