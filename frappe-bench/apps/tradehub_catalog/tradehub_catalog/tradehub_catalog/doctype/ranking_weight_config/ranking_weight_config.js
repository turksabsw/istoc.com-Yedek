// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Ranking Weight Config', {
    refresh: function(frm) {
        // =====================================================
        // Category Field - Filter Active Categories
        // =====================================================
        frm.set_query('category', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });
    },

    validate: function(frm) {
        // =====================================================
        // Weight Fields Validation (0-100)
        // =====================================================
        let weight_fields = [
            'sales_weight',
            'view_weight',
            'conversion_weight',
            'ctr_weight',
            'wishlist_weight',
            'review_weight',
            'rating_weight',
            'quality_score_weight',
            'seller_score_weight',
            'recency_weight',
            'stock_weight'
        ];

        let has_error = false;

        weight_fields.forEach(function(field) {
            let value = frm.doc[field] || 0;
            if (value < 0 || value > 100) {
                frappe.msgprint({
                    title: __('Validation Error'),
                    indicator: 'red',
                    message: __('"{0}" must be between 0 and 100. Current value: {1}',
                        [frm.fields_dict[field].df.label, value])
                });
                has_error = true;
            }
        });

        // =====================================================
        // Penalty Fields Validation (must be <= 0)
        // =====================================================
        let penalty_fields = [
            'out_of_stock_penalty',
            'low_rating_penalty'
        ];

        penalty_fields.forEach(function(field) {
            let value = frm.doc[field] || 0;
            if (value > 0) {
                frappe.msgprint({
                    title: __('Validation Error'),
                    indicator: 'red',
                    message: __('"{0}" must be less than or equal to 0 (negative value). Current value: {1}',
                        [frm.fields_dict[field].df.label, value])
                });
                has_error = true;
            }
        });

        if (has_error) {
            frappe.validated = false;
            return;
        }

        // =====================================================
        // Total Weight Sum Warning
        // =====================================================
        let total_weight = 0;
        weight_fields.forEach(function(field) {
            total_weight += flt(frm.doc[field] || 0);
        });

        if (Math.abs(total_weight - 100) > 0.01) {
            frappe.msgprint({
                title: __('Weight Sum Warning'),
                indicator: 'orange',
                message: __('Total weight sum is {0}. It is recommended that weights sum to 100 for proper score normalization.',
                    [total_weight.toFixed(2)])
            });
        }
    }
});
