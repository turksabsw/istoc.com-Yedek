// Copyright (c) 2026, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Wholesale Offer', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Seller - filter by tenant
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
        // Currency - filter enabled
        // =====================================================
        frm.set_query('currency', function() {
            return {
                filters: {
                    'enabled': 1
                }
            };
        });

        // =====================================================
        // Child Table: Wholesale Offer Product - filter listing by seller
        // =====================================================
        frm.set_query('listing', 'products', function(doc, cdt, cdn) {
            let filters = {};
            if (doc.seller) {
                filters['seller'] = doc.seller;
            }
            if (doc.tenant) {
                filters['tenant'] = doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // Make tenant field read-only when seller is selected
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
            frm.set_df_property('is_active', 'read_only', 1);
        }
    },

    tenant: function(frm) {
        // When tenant changes, check if current seller belongs to new tenant
        if (frm.doc.seller) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('seller', null);
                        frappe.show_alert({
                            message: __('Seller cleared because it does not belong to the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                });
            } else {
                frm.set_value('seller', null);
            }
        }
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    seller: function(frm) {
        if (frm.doc.seller) {
            // Auto-populate tenant from seller
            frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                if (r && r.tenant) {
                    if (!frm.doc.tenant || frm.doc.tenant !== r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                }
            });
            frm.set_df_property('tenant', 'read_only', 1);
        } else {
            // Clear fetch_from fields dependent on seller
            frm.set_value('seller_name', '');
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    }
});

/**
 * Child table event handlers for Wholesale Offer Product
 */
frappe.ui.form.on('Wholesale Offer Product', {
    /**
     * Quantity change handler - recalculates total_price
     */
    quantity: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.total_price = flt(flt(row.quantity) * flt(row.unit_price));
        frm.refresh_field('products');
        calculate_wholesale_totals(frm);
    },

    /**
     * Unit price change handler - recalculates total_price
     */
    unit_price: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.total_price = flt(flt(row.quantity) * flt(row.unit_price));
        frm.refresh_field('products');
        calculate_wholesale_totals(frm);
    },

    /**
     * Product row added handler
     */
    products_add: function(frm, cdt, cdn) {
        calculate_wholesale_totals(frm);
    },

    /**
     * Product row removed handler
     */
    products_remove: function(frm, cdt, cdn) {
        calculate_wholesale_totals(frm);
    }
});

/**
 * Calculate wholesale offer totals from product rows
 * @param {object} frm - Form object
 */
function calculate_wholesale_totals(frm) {
    var total_quantity = 0;
    var total_value = 0;
    var total_products = 0;

    if (frm.doc.products) {
        frm.doc.products.forEach(function(product) {
            total_products += 1;
            total_quantity += flt(product.quantity);
            total_value += flt(product.total_price);
        });
    }

    frm.set_value('total_products', total_products);
    frm.set_value('total_quantity', flt(total_quantity));
    frm.set_value('total_value', flt(total_value));
}
