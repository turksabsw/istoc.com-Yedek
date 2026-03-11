// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Seller Tier', {
    refresh: function(frm) {
        // =====================================================
        // P1+P6: Next Tier Field - Filter by Tenant, Self-Exclude
        // =====================================================
        // Only show tiers belonging to the same tenant, excluding self
        frm.set_query('next_tier', function() {
            let filters = {};

            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }

            // Exclude self from the list (P6 self-exclude pattern)
            if (frm.doc.name) {
                filters['name'] = ['!=', frm.doc.name];
            }

            return {
                filters: filters
            };
        });

        // =====================================================
        // P1+P6: Previous Tier Field - Filter by Tenant, Self-Exclude
        // =====================================================
        // Only show tiers belonging to the same tenant, excluding self
        frm.set_query('previous_tier', function() {
            let filters = {};

            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }

            // Exclude self from the list (P6 self-exclude pattern)
            if (frm.doc.name) {
                filters['name'] = ['!=', frm.doc.name];
            }

            return {
                filters: filters
            };
        });
    },

    tenant: function(frm) {
        // When tenant changes, check if next_tier belongs to new tenant
        if (frm.doc.next_tier) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Tier', frm.doc.next_tier, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('next_tier', null);
                        frappe.show_alert({
                            message: __('Next Tier cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('next_tier', null);
            }
        }

        // When tenant changes, check if previous_tier belongs to new tenant
        if (frm.doc.previous_tier) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Tier', frm.doc.previous_tier, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('previous_tier', null);
                        frappe.show_alert({
                            message: __('Previous Tier cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('previous_tier', null);
            }
        }
    }
});
