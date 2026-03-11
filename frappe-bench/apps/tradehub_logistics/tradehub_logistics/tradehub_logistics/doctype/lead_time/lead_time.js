// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Lead Time', {
    refresh: function(frm) {
        // =====================================================
        // SKU Product - Filter by seller and tenant
        // =====================================================
        frm.set_query('sku_product', function() {
            let filters = {};
            if (frm.doc.seller) {
                filters['seller'] = frm.doc.seller;
            }
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // Make seller and tenant read-only (populated from sku_product)
        frm.set_df_property('seller', 'read_only', frm.doc.sku_product ? 1 : 0);
        frm.set_df_property('tenant', 'read_only', frm.doc.sku_product ? 1 : 0);
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('priority', 'read_only', 1);
        }
    },

    sku_product: function(frm) {
        if (!frm.doc.sku_product) {
            // Clear all fetch_from fields dependent on sku_product
            frm.set_value('product_name', '');
            frm.set_value('product_sku_code', '');
            frm.set_value('product_status', '');
            frm.set_value('seller', null);
            frm.set_value('seller_name', '');
            frm.set_value('tenant', null);
            frm.set_value('tenant_name', '');

            // Allow editing seller/tenant when sku_product is cleared
            frm.set_df_property('seller', 'read_only', 0);
            frm.set_df_property('tenant', 'read_only', 0);
        }
    }
});
