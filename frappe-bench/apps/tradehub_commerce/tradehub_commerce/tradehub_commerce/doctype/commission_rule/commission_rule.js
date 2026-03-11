// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Commission Rule', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Category - filter active categories
        frm.set_query('category', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // Seller Tier - filter by tenant
        frm.set_query('seller_tier', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Last Applied Order - filter by tenant
        frm.set_query('last_applied_order', function() {
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
        // Child Table Link Filters (3-arg form)
        // =====================================================
        // Restricted Sellers - filter seller by tenant
        frm.set_query('seller', 'restricted_sellers_table', function(doc, cdt, cdn) {
            if (doc.tenant) {
                return {
                    filters: {
                        'tenant': doc.tenant
                    }
                };
            }
            return {};
        });

        // Excluded Sellers - filter seller by tenant
        frm.set_query('seller', 'excluded_sellers_table', function(doc, cdt, cdn) {
            if (doc.tenant) {
                return {
                    filters: {
                        'tenant': doc.tenant
                    }
                };
            }
            return {};
        });

        // Restricted Categories - filter active categories
        frm.set_query('category', 'restricted_categories_table', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // Excluded Categories - filter active categories
        frm.set_query('category', 'excluded_categories_table', function() {
            return {
                filters: {
                    'is_active': 1
                }
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
            frm.set_df_property('status', 'read_only', 1);
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

    category: function(frm) {
        if (!frm.doc.category) {
            frm.set_value('category_name', '');
        }
    }
});
