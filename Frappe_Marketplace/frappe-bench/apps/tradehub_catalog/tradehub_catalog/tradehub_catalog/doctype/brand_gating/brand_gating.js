// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Brand Gating', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Brand - filter by verified brands
        frm.set_query('brand', function() {
            return {
                filters: {
                    'verification_status': 'Verified'
                }
            };
        });

        // Seller - P1 Tenant Isolation
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

        // Make tenant field read-only (fetched from seller)
        frm.set_df_property('tenant', 'read_only', 1);
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('authorization_status', 'read_only', 1);
            frm.set_df_property('is_exclusive', 'read_only', 1);
            frm.set_df_property('priority_level', 'read_only', 1);
            frm.set_df_property('eligible_for_buybox', 'read_only', 1);
            frm.set_df_property('buybox_priority_boost', 'read_only', 1);
            frm.set_df_property('suppress_unauthorized', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    brand: function(frm) {
        // Clear all fetch_from fields dependent on brand
        if (!frm.doc.brand) {
            frm.set_value('brand_name', '');
            frm.set_value('brand_code', '');
            frm.set_value('brand_verification_status', '');
            frm.set_value('brand_logo', '');
        }
    },

    seller: function(frm) {
        // Clear all fetch_from fields dependent on seller
        if (!frm.doc.seller) {
            frm.set_value('seller_name', '');
            frm.set_value('seller_company', '');
            frm.set_value('seller_status', '');
            frm.set_value('seller_verification_status', '');
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
        }
    }
});
