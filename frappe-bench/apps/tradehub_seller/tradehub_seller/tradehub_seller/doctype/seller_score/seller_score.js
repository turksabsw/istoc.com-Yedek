// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Seller Score', {
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
            frm.set_df_property('policy_violations', 'read_only', 1);
            frm.set_df_property('late_shipments', 'read_only', 1);
            frm.set_df_property('cancelled_orders', 'read_only', 1);
            frm.set_df_property('disputed_orders', 'read_only', 1);
            frm.set_df_property('penalty_points', 'read_only', 1);
            frm.set_df_property('penalty_deduction', 'read_only', 1);
            frm.set_df_property('bonus_points', 'read_only', 1);
            frm.set_df_property('bonus_reason', 'read_only', 1);
            frm.set_df_property('fulfillment_weight', 'read_only', 1);
            frm.set_df_property('delivery_weight', 'read_only', 1);
            frm.set_df_property('quality_weight', 'read_only', 1);
            frm.set_df_property('service_weight', 'read_only', 1);
            frm.set_df_property('compliance_weight', 'read_only', 1);
            frm.set_df_property('engagement_weight', 'read_only', 1);
            frm.set_df_property('calculation_notes', 'read_only', 1);
            frm.set_df_property('manual_adjustments', 'read_only', 1);
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

            // Clear fetch_from fields dependent on seller
            frm.set_value('seller_name', '');
        }
    }
});
