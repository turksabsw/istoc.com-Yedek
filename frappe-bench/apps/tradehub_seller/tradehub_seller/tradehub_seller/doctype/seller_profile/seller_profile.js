// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Seller Profile', {
    refresh: function(frm) {
        // Set up query filter for organization dropdown
        // Only show organizations belonging to the selected tenant
        frm.set_query('organization', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            // If no tenant selected, return empty to prevent selection
            // User should select tenant first, or organization will auto-populate tenant
            return {};
        });

        // Make tenant field read-only when organization is selected
        // (since tenant is auto-populated from organization via fetch_from)
        frm.set_df_property('tenant', 'read_only', frm.doc.organization ? 1 : 0);

        // =====================================================
        // Seller Tier Field - Filter by Tenant
        // =====================================================
        // Only show seller tiers belonging to the selected tenant
        frm.set_query('seller_tier', function() {
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
        // KYC Profile Field - Filter by Tenant
        // =====================================================
        // Only show KYC profiles belonging to the selected tenant
        frm.set_query('kyc_profile', function() {
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
        // Parent-Level District/Neighborhood Cascade Filters
        // =====================================================
        // District - filter by parent city field
        frm.set_query('district', function() {
            let filters = {
                'is_active': 1
            };
            if (frm.doc.city) {
                filters['city'] = frm.doc.city;
            }
            return {
                filters: filters
            };
        });

        // Neighborhood - filter by parent district field
        frm.set_query('neighborhood', function() {
            let filters = {
                'is_active': 1
            };
            if (frm.doc.district) {
                filters['district'] = frm.doc.district;
            }
            return {
                filters: filters
            };
        });

        // =====================================================
        // Commission Plan Field - Filter by Tenant
        // =====================================================
        frm.set_query('commission_plan', function() {
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
        // Default Shipping Rule Field - Filter by Tenant
        // =====================================================
        frm.set_query('default_shipping_rule', function() {
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
        // Address Item Child Table - Cascading Dropdown Filters
        // =====================================================

        // City filter - show only active cities
        frm.set_query('city', 'addresses', function(doc, cdt, cdn) {
            return {
                filters: {
                    is_active: 1
                }
            };
        });

        // District filter - show only districts belonging to selected city
        frm.set_query('district', 'addresses', function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    city: row.city || '',
                    is_active: 1
                }
            };
        });

        // Neighborhood filter - show only neighborhoods belonging to selected district
        frm.set_query('neighborhood', 'addresses', function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    district: row.district || '',
                    is_active: 1
                }
            };
        });

        // =====================================================
        // Location Item Child Table - Cascading Dropdown Filters
        // =====================================================

        // City filter - show only active cities
        frm.set_query('city', 'locations', function(doc, cdt, cdn) {
            return {
                filters: {
                    is_active: 1
                }
            };
        });

        // District filter - show only districts belonging to selected city
        frm.set_query('district', 'locations', function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    city: row.city || '',
                    is_active: 1
                }
            };
        });

        // Neighborhood filter - show only neighborhoods belonging to selected district
        frm.set_query('neighborhood', 'locations', function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    district: row.district || '',
                    is_active: 1
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
            frm.set_df_property('verification_status', 'read_only', 1);
            frm.set_df_property('identity_verified', 'read_only', 1);
            frm.set_df_property('business_verified', 'read_only', 1);
            frm.set_df_property('bank_verified', 'read_only', 1);
            frm.set_df_property('verification_notes', 'read_only', 1);
            frm.set_df_property('seller_tier', 'read_only', 1);
            frm.set_df_property('seller_score', 'read_only', 1);
            frm.set_df_property('commission_plan', 'read_only', 1);
            frm.set_df_property('max_listings', 'read_only', 1);
            frm.set_df_property('is_restricted', 'read_only', 1);
            frm.set_df_property('restriction_reason', 'read_only', 1);
            frm.set_df_property('can_sell', 'read_only', 1);
            frm.set_df_property('can_withdraw', 'read_only', 1);
            frm.set_df_property('can_create_listings', 'read_only', 1);
            frm.set_df_property('is_featured', 'read_only', 1);
            frm.set_df_property('featured_from', 'read_only', 1);
            frm.set_df_property('featured_until', 'read_only', 1);
            frm.set_df_property('is_top_seller', 'read_only', 1);
            frm.set_df_property('is_premium_seller', 'read_only', 1);
        }
    },

    tenant: function(frm) {
        // When tenant changes, clear the organization field
        // because the previously selected organization may not belong to the new tenant
        if (frm.doc.organization) {
            // Check if current organization belongs to new tenant
            if (frm.doc.tenant) {
                frappe.db.get_value('Organization', frm.doc.organization, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        // Organization doesn't belong to new tenant, clear it
                        frm.set_value('organization', null);
                        frappe.show_alert({
                            message: __('Organization cleared because it does not belong to the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                });
            } else {
                // Tenant was cleared, also clear organization
                frm.set_value('organization', null);
            }
        }

        // When tenant changes, check if seller_tier belongs to new tenant
        if (frm.doc.seller_tier) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Tier', frm.doc.seller_tier, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('seller_tier', null);
                        frappe.show_alert({
                            message: __('Seller Tier cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('seller_tier', null);
            }
        }

        // When tenant changes, check if kyc_profile belongs to new tenant
        if (frm.doc.kyc_profile) {
            if (frm.doc.tenant) {
                frappe.db.get_value('KYC Profile', frm.doc.kyc_profile, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('kyc_profile', null);
                        frappe.show_alert({
                            message: __('KYC Profile cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('kyc_profile', null);
            }
        }

        // When tenant changes, check if commission_plan belongs to new tenant
        if (frm.doc.commission_plan) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Commission Plan', frm.doc.commission_plan, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('commission_plan', null);
                        frappe.show_alert({
                            message: __('Commission Plan cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('commission_plan', null);
            }
        }

        // When tenant changes, check if default_shipping_rule belongs to new tenant
        if (frm.doc.default_shipping_rule) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Shipping Rule', frm.doc.default_shipping_rule, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('default_shipping_rule', null);
                        frappe.show_alert({
                            message: __('Default Shipping Rule cleared because it does not belong to the selected Tenant'),
                            indicator: 'blue'
                        });
                    }
                });
            } else {
                frm.set_value('default_shipping_rule', null);
            }
        }
    },

    organization: function(frm) {
        // When organization changes, update read-only state of tenant field
        frm.set_df_property('tenant', 'read_only', frm.doc.organization ? 1 : 0);

        // If organization is cleared, allow tenant to be edited again
        if (!frm.doc.organization) {
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    // =====================================================
    // Parent-Level City→District→Neighborhood Cascade
    // =====================================================

    city: function(frm) {
        // When city changes, clear district and neighborhood
        // because they may not belong to the new city
        if (frm.doc.district || frm.doc.neighborhood) {
            frm.set_value('district', '');
            frm.set_value('district_name', '');
            frm.set_value('neighborhood', '');
            frm.set_value('neighborhood_name', '');

            if (frm.doc.city) {
                frappe.show_alert({
                    message: __('District and Neighborhood cleared due to city change'),
                    indicator: 'blue'
                });
            }
        }
    },

    district: function(frm) {
        // When district changes, clear neighborhood
        // because it may not belong to the new district
        if (frm.doc.neighborhood) {
            frm.set_value('neighborhood', '');
            frm.set_value('neighborhood_name', '');

            if (frm.doc.district) {
                frappe.show_alert({
                    message: __('Neighborhood cleared due to district change'),
                    indicator: 'blue'
                });
            }
        }
    }
});

// =====================================================
// Address Item Child Table - Cascading Clear on Change
// =====================================================

frappe.ui.form.on('Address Item', {
    city: function(frm, cdt, cdn) {
        // When city changes, clear district and neighborhood
        // because they may not belong to the new city
        let row = locals[cdt][cdn];
        if (row.district || row.neighborhood) {
            frappe.model.set_value(cdt, cdn, 'district', '');
            frappe.model.set_value(cdt, cdn, 'district_name', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood_name', '');

            if (row.city) {
                frappe.show_alert({
                    message: __('District and Neighborhood cleared due to city change'),
                    indicator: 'blue'
                });
            }
        }
    },

    district: function(frm, cdt, cdn) {
        // When district changes, clear neighborhood
        // because it may not belong to the new district
        let row = locals[cdt][cdn];
        if (row.neighborhood) {
            frappe.model.set_value(cdt, cdn, 'neighborhood', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood_name', '');

            if (row.district) {
                frappe.show_alert({
                    message: __('Neighborhood cleared due to district change'),
                    indicator: 'blue'
                });
            }
        }
    }
});

// =====================================================
// Location Item Child Table - Cascading Clear on Change
// =====================================================

frappe.ui.form.on('Location Item', {
    is_default: function(frm, cdt, cdn) {
        // Radio-button behavior: only one location can be default at a time
        // When user checks is_default on a row, uncheck all other rows
        let row = locals[cdt][cdn];
        if (row.is_default) {
            (frm.doc.locations || []).forEach(function(loc) {
                if (loc.name !== row.name && loc.is_default) {
                    frappe.model.set_value(loc.doctype, loc.name, 'is_default', 0);
                }
            });
            frm.refresh_field('locations');
        }
    },

    city: function(frm, cdt, cdn) {
        // When city changes, clear district and neighborhood
        // because they may not belong to the new city
        let row = locals[cdt][cdn];
        if (row.district || row.neighborhood) {
            frappe.model.set_value(cdt, cdn, 'district', '');
            frappe.model.set_value(cdt, cdn, 'district_name', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood_name', '');

            if (row.city) {
                frappe.show_alert({
                    message: __('District and Neighborhood cleared due to city change'),
                    indicator: 'blue'
                });
            }
        }
    },

    district: function(frm, cdt, cdn) {
        // When district changes, clear neighborhood
        // because it may not belong to the new district
        let row = locals[cdt][cdn];
        if (row.neighborhood) {
            frappe.model.set_value(cdt, cdn, 'neighborhood', '');
            frappe.model.set_value(cdt, cdn, 'neighborhood_name', '');

            if (row.district) {
                frappe.show_alert({
                    message: __('Neighborhood cleared due to district change'),
                    indicator: 'blue'
                });
            }
        }
    }
});
