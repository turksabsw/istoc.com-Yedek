// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Seller KPI', {
    refresh: function(frm) {
        // Ensure tenant field is read-only when seller is set
        if (frm.doc.seller) {
            frm.set_df_property('tenant', 'read_only', 1);
        }

        // Add Calculate KPI button for draft records
        if (frm.doc.docstatus === 0 && frm.doc.status === 'Draft') {
            frm.add_custom_button(__('Calculate KPI'), function() {
                frm.call({
                    method: 'calculate_kpi',
                    doc: frm.doc,
                    callback: function(r) {
                        if (!r.exc) {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('KPI calculation completed'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }, __('Actions'));
        }
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('evaluation_status', 'read_only', 1);
            frm.set_df_property('performance_grade', 'read_only', 1);
        }
    },

    seller: function(frm) {
        // When seller is selected, fetch tenant from seller profile
        if (frm.doc.seller) {
            frappe.db.get_value('Seller Profile', frm.doc.seller, ['tenant', 'seller_name'], function(r) {
                if (r) {
                    if (r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                    if (r.seller_name) {
                        frm.set_value('seller_name', r.seller_name);
                    }
                    // Make tenant read-only after auto-populating
                    frm.set_df_property('tenant', 'read_only', 1);
                }
            });
        } else {
            // Clear tenant when seller is cleared
            frm.set_value('tenant', '');
            frm.set_value('seller_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    /**
     * Actual value change handler - recalculates KPI metrics
     */
    actual_value: function(frm) {
        calculate_kpi_metrics(frm);
    },

    /**
     * Target value change handler - recalculates KPI metrics
     */
    target_value: function(frm) {
        calculate_kpi_metrics(frm);
    },

    /**
     * Previous value change handler - recalculates value change
     */
    previous_value: function(frm) {
        calculate_kpi_metrics(frm);
    },

    /**
     * Minimum threshold change handler - validates threshold ordering
     */
    minimum_threshold: function(frm) {
        // Ensure minimum < maximum
        if (flt(frm.doc.minimum_threshold) > flt(frm.doc.maximum_threshold) &&
            flt(frm.doc.maximum_threshold) > 0) {
            frappe.msgprint(__('Minimum threshold cannot exceed maximum threshold'));
            frm.set_value('minimum_threshold', flt(frm.doc.maximum_threshold));
        }
        calculate_kpi_metrics(frm);
    },

    /**
     * Maximum threshold change handler - validates threshold ordering
     */
    maximum_threshold: function(frm) {
        // Ensure maximum > minimum
        if (flt(frm.doc.maximum_threshold) > 0 &&
            flt(frm.doc.maximum_threshold) < flt(frm.doc.minimum_threshold)) {
            frappe.msgprint(__('Maximum threshold cannot be less than minimum threshold'));
            frm.set_value('maximum_threshold', flt(frm.doc.minimum_threshold));
        }
        calculate_kpi_metrics(frm);
    },

    /**
     * Warning threshold change handler
     */
    warning_threshold: function(frm) {
        calculate_kpi_metrics(frm);
    },

    /**
     * Critical threshold change handler
     */
    critical_threshold: function(frm) {
        calculate_kpi_metrics(frm);
    },

    /**
     * Improvement target change handler
     */
    improvement_target: function(frm) {
        calculate_kpi_metrics(frm);
    },

    kpi_period: function(frm) {
        // Auto-set date range based on selected period
        if (frm.doc.kpi_period) {
            let today = frappe.datetime.get_today();
            let start_date, end_date;

            switch(frm.doc.kpi_period) {
                case 'Daily':
                    start_date = today;
                    end_date = today;
                    break;
                case 'Weekly':
                    start_date = frappe.datetime.add_days(today, -7);
                    end_date = today;
                    break;
                case 'Monthly':
                    start_date = frappe.datetime.add_months(today, -1);
                    end_date = today;
                    break;
                case 'Quarterly':
                    start_date = frappe.datetime.add_months(today, -3);
                    end_date = today;
                    break;
                case 'Yearly':
                    start_date = frappe.datetime.add_months(today, -12);
                    end_date = today;
                    break;
            }

            if (start_date && end_date) {
                frm.set_value('start_date', start_date);
                frm.set_value('end_date', end_date);
            }
        }
    }
});

/**
 * Calculate KPI metrics from actual, target, and previous values
 * Uses flt() on all numeric operations for precision
 * @param {object} frm - Form object
 */
function calculate_kpi_metrics(frm) {
    var actual = flt(frm.doc.actual_value);
    var target = flt(frm.doc.target_value);
    var previous = flt(frm.doc.previous_value);

    // Calculate value change (actual - previous)
    var value_change = flt(actual - previous);
    frm.set_value('value_change', value_change);

    // Calculate percentage of target (actual / target * 100)
    // Zero-division guard
    var percentage_of_target = 0;
    if (flt(target) > 0) {
        percentage_of_target = flt(actual / flt(target) * 100);
    }
    frm.set_value('percentage_of_target', percentage_of_target);

    // Calculate deviation from target (actual - target)
    var deviation = flt(actual - target);
    frm.set_value('deviation_from_target', deviation);
}
