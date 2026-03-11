// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('PIM Product', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Product Family - show all available families
        frm.set_query('product_family', function() {
            return {};
        });

        // Product Class - cascading filter by Product Family
        frm.set_query('product_class', function() {
            if (frm.doc.product_family) {
                return {
                    filters: {
                        'name': frm.doc.product_class || ''
                    }
                };
            }
            return {};
        });

        // Brand - show active/verified brands
        frm.set_query('brand', function() {
            return {
                filters: {
                    'verification_status': 'Verified'
                }
            };
        });

        // Manufacturer (Supplier) - show all suppliers
        frm.set_query('manufacturer', function() {
            return {};
        });

        // Primary Category - show active categories
        frm.set_query('primary_category', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // Parent Product - P6 self-exclude + filter by same product family
        frm.set_query('parent_product', function() {
            let filters = {};
            if (frm.doc.name) {
                filters['name'] = ['!=', frm.doc.name];
            }
            if (frm.doc.product_family) {
                filters['product_family'] = frm.doc.product_family;
            }
            return {
                filters: filters
            };
        });

        // ERPNext Item Code - show all items
        frm.set_query('erpnext_item_code', function() {
            return {};
        });

        // Make product_class read-only (fetched from product_family)
        frm.set_df_property('product_class', 'read_only', frm.doc.product_family ? 1 : 0);
    
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

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    product_family: function(frm) {
        // Clear cascading fetch_from fields when product_family changes
        if (!frm.doc.product_family) {
            frm.set_value('family_name', '');
            frm.set_value('product_class', '');
            frm.set_value('class_name', '');
        } else {
            // Product class is fetched from product_family - will auto-populate
            // Clear class_name so it refreshes from new product_class
            frm.set_value('class_name', '');
        }
        // Update read-only state
        frm.set_df_property('product_class', 'read_only', frm.doc.product_family ? 1 : 0);
    },

    product_class: function(frm) {
        // Clear fetch_from fields when product_class changes
        if (!frm.doc.product_class) {
            frm.set_value('class_name', '');
        }
    },

    brand: function(frm) {
        // Clear fetch_from fields when brand is cleared
        if (!frm.doc.brand) {
            frm.set_value('brand_name', '');
        }
    },

    primary_category: function(frm) {
        // Clear fetch_from fields when primary_category is cleared
        if (!frm.doc.primary_category) {
            frm.set_value('primary_category_name', '');
        }
    },

    // =========================================================================
    // CONDITION CHANGE HANDLER
    // =========================================================================

    condition: function(frm) {
        if (frm.doc.condition === 'New') {
            // Clear condition_note when condition is set to New
            frm.set_value('condition_note', '');
        } else if (['Used - Like New', 'Used - Good', 'Used - Acceptable', 'Renewed'].includes(frm.doc.condition)) {
            // Remind user that condition_note is required for Used/Renewed conditions
            frappe.show_alert({
                message: __('Condition Note is required (min 20 characters) for {0} condition', [frm.doc.condition]),
                indicator: 'orange'
            });
        }
    }
});
