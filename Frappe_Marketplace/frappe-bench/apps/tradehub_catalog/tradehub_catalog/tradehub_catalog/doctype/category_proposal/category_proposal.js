// Copyright (c) 2026, TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Category Proposal', {
    refresh: function(frm) {
        // =====================================================
        // Parent Category Field - Filter Active Group Categories
        // =====================================================
        // Only show enabled categories that are groups (can have children)
        frm.set_query('parent_category', function() {
            return {
                filters: {
                    'enabled': 1,
                    'is_group': 1
                }
            };
        });

        // =====================================================
        // Auto-Populate Seller from Session User's Seller Profile
        // =====================================================
        // On new documents, auto-fill seller from current user's Seller Profile
        if (frm.is_new() && !frm.doc.seller) {
            frappe.db.get_value('Seller Profile', {'user': frappe.session.user}, 'name', function(r) {
                if (r && r.name) {
                    frm.set_value('seller', r.name);
                }
            });
        }

        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        // Make seller field read-only for Seller role (prevent changing ownership)
        if (frappe.user_roles.includes('Seller') && !frappe.user_roles.includes('System Manager')) {
            frm.set_df_property('seller', 'read_only', 1);
        }
    }
});
