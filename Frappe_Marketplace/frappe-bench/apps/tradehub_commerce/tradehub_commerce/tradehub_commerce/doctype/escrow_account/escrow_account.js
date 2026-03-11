// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Escrow Account', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Marketplace Order - filter by tenant
        frm.set_query('marketplace_order', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Sub Order - filter by tenant and marketplace_order
        frm.set_query('sub_order', function() {
            let filters = {};
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });

        // Payment Intent - filter by tenant and marketplace_order
        frm.set_query('payment_intent', function() {
            let filters = {};
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            if (frm.doc.marketplace_order) {
                filters['marketplace_order'] = frm.doc.marketplace_order;
            }
            return {
                filters: filters
            };
        });

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

        // Dispute Case - filter by tenant
        frm.set_query('dispute_case', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
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
            frm.set_df_property('commission_amount', 'read_only', 1);
            frm.set_df_property('payout_status', 'read_only', 1);
            frm.set_df_property('dispute_status', 'read_only', 1);
            frm.set_df_property('dispute_resolution', 'read_only', 1);
            frm.set_df_property('erpnext_sync_status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
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
    },

    seller: function(frm) {
        if (!frm.doc.seller) {
            frm.set_value('seller_name', '');
        }
    },

    buyer: function(frm) {
        if (!frm.doc.buyer) {
            frm.set_value('buyer_name', '');
        }
    },

    marketplace_order: function(frm) {
        if (!frm.doc.marketplace_order) {
            frm.set_value('marketplace_order_number', '');
        }
    }
});

/**
 * Child table event handlers for Escrow Partial Release
 */
frappe.ui.form.on('Escrow Partial Release', {
    /**
     * Amount change handler - recalculates totals
     */
    amount: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (flt(row.amount) < 0) {
            frappe.model.set_value(cdt, cdn, 'amount', 0);
            frappe.msgprint(__('Release amount cannot be negative'));
        }
        calculate_totals(frm);
    },

    /**
     * Status change handler - recalculates totals (only completed releases count)
     */
    status: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Partial release row added handler
     */
    partial_releases_table_add: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Partial release row removed handler
     */
    partial_releases_table_remove: function(frm, cdt, cdn) {
        calculate_totals(frm);
    }
});

/**
 * Calculate escrow account totals from partial releases
 * Sums up completed release amounts and updates held/pending amounts
 * @param {object} frm - Form object
 */
function calculate_totals(frm) {
    var total_released = 0;

    if (frm.doc.partial_releases_table) {
        frm.doc.partial_releases_table.forEach(function(release) {
            // Only count completed releases toward released amount
            if (release.status === 'Completed') {
                total_released += flt(release.amount);
            }
        });
    }

    frm.set_value('released_amount', flt(total_released));

    // Calculate held amount: total - released - refunded
    var held = flt(frm.doc.total_amount) - flt(total_released) - flt(frm.doc.refunded_amount);
    frm.set_value('held_amount', flt(held));

    // Calculate pending release: sum of pending releases
    var pending_release = 0;
    if (frm.doc.partial_releases_table) {
        frm.doc.partial_releases_table.forEach(function(release) {
            if (release.status === 'Pending') {
                pending_release += flt(release.amount);
            }
        });
    }
    frm.set_value('pending_release_amount', flt(pending_release));
}
