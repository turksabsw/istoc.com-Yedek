// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Commission Plan', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Minimum Seller Tier - filter by tenant
        frm.set_query('min_seller_tier', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Category - filter active categories in child table
        frm.set_query('category', 'category_rates', function() {
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

    /**
     * Before save handler - recalculates totals
     */
    before_save: function(frm) {
        calculate_totals(frm);
    },

    // =====================================================
    // Clear-on-change handlers for fetch_from fields
    // =====================================================
    tenant: function(frm) {
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    }
});

/**
 * Child table event handlers for Commission Plan Rate
 */
frappe.ui.form.on('Commission Plan Rate', {
    /**
     * Commission rate change handler
     */
    commission_rate: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        // Validate commission rate is between 0 and 100
        if (flt(row.commission_rate) < 0 || flt(row.commission_rate) > 100) {
            frappe.model.set_value(cdt, cdn, 'commission_rate', 0);
            frappe.msgprint(__('Commission rate must be between 0 and 100'));
        }
        calculate_totals(frm);
    },

    /**
     * Minimum commission change handler
     */
    minimum_commission: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Maximum commission change handler
     */
    maximum_commission: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Fixed amount change handler
     */
    fixed_amount: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Rate row added handler
     */
    category_rates_add: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Rate row removed handler
     */
    category_rates_remove: function(frm, cdt, cdn) {
        calculate_totals(frm);
    }
});

/**
 * Calculate commission plan totals from category rates
 * Computes the average commission rate across all category rates
 * @param {object} frm - Form object
 */
function calculate_totals(frm) {
    var total_rate = 0;
    var rate_count = 0;

    if (frm.doc.category_rates) {
        frm.doc.category_rates.forEach(function(rate) {
            total_rate += flt(rate.commission_rate);
            rate_count++;
        });
    }

    // Calculate average commission rate
    if (rate_count > 0) {
        frm.set_value('average_commission_rate', flt(total_rate / rate_count));
    } else {
        frm.set_value('average_commission_rate', 0);
    }
}
