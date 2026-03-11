// Copyright (c) 2026, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Subscription', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Seller Profile - filter by tenant
        frm.set_query('seller_profile', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Organization - filter by tenant
        frm.set_query('organization', function() {
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
        // Subscription Package - filter active packages
        // =====================================================
        frm.set_query('subscription_package', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // Previous Package - filter active packages
        frm.set_query('previous_package', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // =====================================================
        // Currency - filter enabled
        // =====================================================
        frm.set_query('currency', function() {
            return {
                filters: {
                    'enabled': 1
                }
            };
        });

        // Make tenant field read-only when seller_profile is selected
        frm.set_df_property('tenant', 'read_only', frm.doc.seller_profile ? 1 : 0);
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    tenant: function(frm) {
        // When tenant changes, check if current seller_profile belongs to new tenant
        if (frm.doc.seller_profile) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Profile', frm.doc.seller_profile, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('seller_profile', null);
                        frappe.show_alert({
                            message: __('Seller Profile cleared because it does not belong to the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                });
            } else {
                frm.set_value('seller_profile', null);
            }
        }
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    seller_profile: function(frm) {
        if (frm.doc.seller_profile) {
            // Auto-populate tenant from seller_profile
            frappe.db.get_value('Seller Profile', frm.doc.seller_profile, 'tenant', function(r) {
                if (r && r.tenant) {
                    if (!frm.doc.tenant || frm.doc.tenant !== r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                }
            });
            frm.set_df_property('tenant', 'read_only', 1);
        } else {
            // Clear fetch_from fields dependent on seller_profile
            frm.set_value('seller_name', '');
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    subscription_package: function(frm) {
        if (!frm.doc.subscription_package) {
            // Clear all fetch_from fields dependent on subscription_package
            frm.set_value('package_name', '');
            frm.set_value('billing_period', '');
            frm.set_value('current_price', 0);
            frm.set_value('grace_period_days', 0);
            frm.set_value('max_products', 0);
            frm.set_value('max_orders_per_month', 0);
            frm.set_value('max_api_calls_per_day', 0);
            frm.set_value('has_analytics', 0);
            frm.set_value('has_priority_support', 0);
            frm.set_value('has_api_access', 0);
            frm.set_value('has_bulk_import', 0);
            frm.set_value('has_advanced_reporting', 0);
            frm.set_value('commission_rate', 0);
            frm.set_value('auto_suspend_enabled', 0);
            frm.set_value('currency', '');
        }
    }
});
