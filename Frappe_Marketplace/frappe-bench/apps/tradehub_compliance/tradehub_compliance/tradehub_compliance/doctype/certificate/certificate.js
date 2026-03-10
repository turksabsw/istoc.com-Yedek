// Copyright (c) 2026, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Certificate', {
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
        // Cascade Filters
        // =====================================================
        // SKU Product - filter by seller and tenant
        frm.set_query('sku_product', function() {
            let filters = {};
            if (frm.doc.seller) {
                filters['seller'] = frm.doc.seller;
            }
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // Previous Certificate - filter by seller for consistency
        frm.set_query('previous_certificate', function() {
            let filters = {};
            if (frm.doc.seller) {
                filters['seller'] = frm.doc.seller;
            }
            if (frm.doc.certificate_type) {
                filters['certificate_type'] = frm.doc.certificate_type;
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
            frm.set_df_property('verification_status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    // =====================================================
    // Clear-on-change Handlers
    // =====================================================
    certificate_type: function(frm) {
        // Clear fetch_from fields dependent on certificate_type
        if (!frm.doc.certificate_type) {
            frm.set_value('type_name', '');
            frm.set_value('certificate_category', '');
            frm.set_value('applicable_to', '');
            frm.set_value('requires_renewal', 0);
            frm.set_value('default_validity_months', '');
            frm.set_value('renewal_reminder_days', '');
        }
    },

    sku_product: function(frm) {
        // Clear fetch_from fields dependent on sku_product
        if (!frm.doc.sku_product) {
            frm.set_value('product_name', '');
            frm.set_value('product_sku_code', '');
        }
    },

    seller: function(frm) {
        // Clear fetch_from fields dependent on seller
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
            frm.set_value('seller_name', '');
            frm.set_df_property('tenant', 'read_only', 0);

            // Check if sku_product belongs to a different seller context
            if (frm.doc.sku_product) {
                frm.set_value('sku_product', '');
                frm.set_value('product_name', '');
                frm.set_value('product_sku_code', '');
            }
        }
    },

    previous_certificate: function(frm) {
        // Clear fetch_from fields dependent on previous_certificate
        if (!frm.doc.previous_certificate) {
            frm.set_value('previous_certificate_number', '');
        }
    },

    tenant: function(frm) {
        // Clear fetch_from fields dependent on tenant
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }

        // Validate seller belongs to tenant
        if (frm.doc.seller && frm.doc.tenant) {
            frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                if (r && r.tenant !== frm.doc.tenant) {
                    frm.set_value('seller', null);
                    frm.set_value('seller_name', '');
                    frappe.show_alert({
                        message: __('Seller cleared because it does not belong to the selected Tenant'),
                        indicator: 'orange'
                    });
                }
            });
        }
    }
});
