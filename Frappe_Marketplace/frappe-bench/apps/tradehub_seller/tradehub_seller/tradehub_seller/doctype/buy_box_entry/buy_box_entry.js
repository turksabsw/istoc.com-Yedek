// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Buy Box Entry', {
    refresh: function(frm) {
        // =====================================================
        // P1: Seller Field - Filter by Tenant
        // =====================================================
        // Only show sellers belonging to the selected tenant
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

        // =====================================================
        // SKU Product Field - Filter by Seller and Tenant
        // =====================================================
        // Only show SKU products belonging to the same seller/tenant
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

        // Make tenant field read-only when seller is selected
        // (since tenant is auto-populated from seller via fetch_from)
        frm.set_df_property('tenant', 'read_only', frm.doc.seller ? 1 : 0);
    
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

    sku_product: function(frm) {
        // When SKU Product is cleared, clear all fetch_from fields dependent on it
        if (!frm.doc.sku_product) {
            frm.set_value('product_name', '');
            frm.set_value('product_sku_code', '');
            frm.set_value('product_status', '');
            frm.set_value('product_category', '');
            frm.set_value('product_category_name', '');
        }
    },

    seller: function(frm) {
        // When seller changes, update read-only state of tenant field
        frm.set_df_property('tenant', 'read_only', frm.doc.seller ? 1 : 0);

        // If seller is selected, auto-populate tenant from seller
        if (frm.doc.seller) {
            frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                if (r && r.tenant) {
                    if (!frm.doc.tenant || frm.doc.tenant !== r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                }
            });
        } else {
            // If seller is cleared, allow tenant to be edited again
            frm.set_df_property('tenant', 'read_only', 0);

            // Clear all fetch_from fields dependent on seller
            frm.set_value('seller_name', '');
            frm.set_value('seller_company', '');
            frm.set_value('seller_tier', '');
            frm.set_value('seller_tier_name', '');
            frm.set_value('seller_verification_status', '');
            frm.set_value('seller_average_rating', '');
            frm.set_value('seller_total_reviews', '');
            frm.set_value('seller_on_time_delivery_rate', '');
            frm.set_value('seller_refund_rate', '');

            // Clear tenant chain (tenant is fetch_from seller.tenant)
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');

            // Clear SKU Product since it may be filtered by seller
            if (frm.doc.sku_product) {
                frm.set_value('sku_product', '');
                frappe.show_alert({
                    message: __('SKU Product cleared because seller was changed'),
                    indicator: 'blue'
                });
            }
        }
    },

    tenant: function(frm) {
        // When tenant changes, check if current seller belongs to new tenant
        // If not, clear the seller field
        if (frm.doc.seller) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        // Seller doesn't belong to new tenant, clear it
                        frm.set_value('seller', null);
                        frappe.show_alert({
                            message: __('Seller cleared because it does not belong to the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                });
            } else {
                // Tenant was cleared, also clear seller for consistency
                frm.set_value('seller', null);
            }
        }

        // Clear fetch_from fields dependent on tenant
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    }
});
