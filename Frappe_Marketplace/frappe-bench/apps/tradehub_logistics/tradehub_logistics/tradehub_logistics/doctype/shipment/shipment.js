// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Shipment', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Order - filter by tenant
        frm.set_query('order', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            return {};
        });

        // Sub Order - filter by order
        frm.set_query('sub_order', function() {
            let filters = {};
            if (frm.doc.order) {
                filters['order'] = frm.doc.order;
            }
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // =====================================================
        // Carrier - filter by tenant
        // =====================================================
        frm.set_query('carrier', function() {
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
        // UOM Filters
        // =====================================================
        frm.set_query('weight_uom', function() {
            return {
                filters: {
                    'name': ['in', [
                        'Kilogram', 'Gram', 'Pound', 'Ounce', 'Kg', 'Gm',
                        'g', 'kg', 'lb', 'oz', 'Milligram', 'Ton'
                    ]]
                }
            };
        });

        frm.set_query('volume_uom', function() {
            return {
                filters: {
                    'name': ['in', [
                        'Cubic Meter', 'Cubic Centimeter', 'Liter', 'Cubic Foot',
                        'Cubic Inch', 'Milliliter', 'Gallon'
                    ]]
                }
            };
        });

        frm.set_query('dimension_uom', function() {
            return {
                filters: {
                    'name': ['in', [
                        'Centimeter', 'Meter', 'Inch', 'Foot', 'Cm', 'M',
                        'cm', 'm', 'in', 'ft', 'Millimeter', 'Yard'
                    ]]
                }
            };
        });

        // =====================================================
        // Currency Filter
        // =====================================================
        frm.set_query('customs_currency', function() {
            return {
                filters: {
                    'enabled': 1
                }
            };
        });

        // Make tenant, buyer, seller fields read-only (populated from order)
        frm.set_df_property('tenant', 'read_only', frm.doc.order ? 1 : 0);
        frm.set_df_property('buyer', 'read_only', frm.doc.order ? 1 : 0);
        frm.set_df_property('seller', 'read_only', frm.doc.order ? 1 : 0);
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
            frm.set_df_property('priority', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    order: function(frm) {
        if (!frm.doc.order) {
            // Clear all fetch_from fields dependent on order
            frm.set_value('order_number', '');
            frm.set_value('order_status', '');
            frm.set_value('order_type', '');
            frm.set_value('order_total', 0);
            frm.set_value('buyer', null);
            frm.set_value('buyer_name', '');
            frm.set_value('buyer_company', '');
            frm.set_value('buyer_email', '');
            frm.set_value('buyer_phone', '');
            frm.set_value('seller', null);
            frm.set_value('seller_name', '');
            frm.set_value('seller_company', '');
            frm.set_value('seller_email', '');
            frm.set_value('seller_phone', '');
            frm.set_value('tenant', null);
            frm.set_value('tenant_name', '');
            frm.set_value('sub_order', null);
        }
    },

    sub_order: function(frm) {
        if (!frm.doc.sub_order) {
            // Clear fetch_from fields dependent on sub_order
            frm.set_value('sub_order_id', '');
            frm.set_value('sub_order_status', '');
            frm.set_value('sub_order_total', 0);
        }
    },

    carrier: function(frm) {
        if (!frm.doc.carrier) {
            // Clear fetch_from field dependent on carrier
            frm.set_value('carrier_name', '');
        }
    }
});
