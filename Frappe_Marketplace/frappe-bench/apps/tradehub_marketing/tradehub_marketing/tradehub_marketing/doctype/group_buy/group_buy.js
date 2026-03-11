// Copyright (c) 2026, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Group Buy', {
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
        // Listing - filter by seller and tenant
        // =====================================================
        frm.set_query('listing', function() {
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
            frm.set_df_property('is_featured', 'read_only', 1);
            frm.set_df_property('is_verified', 'read_only', 1);
        }
    },

    tenant: function(frm) {
        // When tenant changes, check if current seller belongs to new tenant
        if (frm.doc.seller) {
            if (frm.doc.tenant) {
                frappe.db.get_value('Seller Profile', frm.doc.seller, 'tenant', function(r) {
                    if (r && r.tenant !== frm.doc.tenant) {
                        frm.set_value('seller', null);
                        frappe.show_alert({
                            message: __('Seller cleared because it does not belong to the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                });
            } else {
                frm.set_value('seller', null);
            }
        }
    },

    seller: function(frm) {
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

            // Check if current listing belongs to new seller
            if (frm.doc.listing) {
                frappe.db.get_value('Listing', frm.doc.listing, 'seller', function(r) {
                    if (r && r.seller !== frm.doc.seller) {
                        frm.set_value('listing', null);
                        frappe.show_alert({
                            message: __('Listing cleared because it does not belong to the selected Seller'),
                            indicator: 'orange'
                        });
                    }
                });
            }
        } else {
            // Clear dependent fields when seller is emptied
            frm.set_value('listing', null);
            frm.set_value('tenant', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    listing: function(frm) {
        // If listing is selected and seller is empty, auto-populate seller from listing
        if (frm.doc.listing && !frm.doc.seller) {
            frappe.db.get_value('Listing', frm.doc.listing, ['seller', 'tenant'], function(r) {
                if (r) {
                    if (r.seller) {
                        frm.set_value('seller', r.seller);
                    }
                    if (r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                }
            });
        }
    },

    /**
     * Max price change handler - recalculates tier discount percentages
     */
    max_price: function(frm) {
        calculate_tier_discounts(frm);
    },

    /**
     * Current quantity change handler
     */
    current_quantity: function(frm) {
        frm.set_value('current_quantity', flt(frm.doc.current_quantity));
    },

    /**
     * Current price change handler
     */
    current_price: function(frm) {
        frm.set_value('current_price', flt(frm.doc.current_price));
    }
});

/**
 * Child table event handlers for Group Buy Tier
 */
frappe.ui.form.on('Group Buy Tier', {
    /**
     * Unit price change handler - calculates discount percent from max_price
     */
    unit_price: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        calculate_tier_discount_row(frm, row, cdt, cdn);
        frm.refresh_field('tiers');
    },

    /**
     * Min quantity change handler
     */
    min_quantity: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.min_quantity = flt(row.min_quantity);
        frm.refresh_field('tiers');
    },

    /**
     * Max quantity change handler
     */
    max_quantity: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.max_quantity = flt(row.max_quantity);
        frm.refresh_field('tiers');
    },

    /**
     * Share percent change handler
     */
    share_percent: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.share_percent = flt(row.share_percent);
        frm.refresh_field('tiers');
    },

    /**
     * Tier row added handler
     */
    tiers_add: function(frm, cdt, cdn) {
        calculate_tier_discounts(frm);
    },

    /**
     * Tier row removed handler
     */
    tiers_remove: function(frm, cdt, cdn) {
        calculate_tier_discounts(frm);
    }
});

/**
 * Calculate discount percentages for all tier rows
 * Discount = (max_price - unit_price) / max_price * 100
 * @param {object} frm - Form object
 */
function calculate_tier_discounts(frm) {
    if (frm.doc.tiers) {
        frm.doc.tiers.forEach(function(row) {
            calculate_tier_discount_row(frm, row);
        });
        frm.refresh_field('tiers');
    }
}

/**
 * Calculate discount percentage for a single tier row
 * @param {object} frm - Form object
 * @param {object} row - Child table row
 * @param {string} cdt - Child DocType (optional)
 * @param {string} cdn - Child DocName (optional)
 */
function calculate_tier_discount_row(frm, row, cdt, cdn) {
    var max_price = flt(frm.doc.max_price);
    var unit_price = flt(row.unit_price);

    if (flt(max_price) > 0) {
        row.discount_percent = flt((flt(max_price) - flt(unit_price)) / flt(max_price) * 100);
    } else {
        row.discount_percent = 0;
    }
}
