// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cart', {
    refresh: function(frm) {
        // =====================================================
        // Organization Field - Filter by Tenant
        // =====================================================
        // Only show organizations belonging to the selected tenant
        frm.set_query('organization', function() {
            if (frm.doc.tenant) {
                return {
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            // If no tenant selected, return empty to show all
            return {};
        });

        // Make tenant field read-only when organization is selected
        // (since tenant is auto-populated from organization)
        frm.set_df_property('tenant', 'read_only', frm.doc.organization ? 1 : 0);

        // =====================================================
        // Buyer Field - Filter Users with Buyer Profile in Same Tenant
        // =====================================================
        // Filter buyers to show only users who have a Buyer Profile
        // belonging to the same tenant
        frm.set_query('buyer', function() {
            if (frm.doc.tenant) {
                // Return users who have a Buyer Profile with matching tenant
                return {
                    query: 'tr_tradehub.tr_tradehub.doctype.cart.cart.get_buyers_for_tenant',
                    filters: {
                        'tenant': frm.doc.tenant
                    }
                };
            }
            // If no tenant, show all users
            return {};
        });

        // =====================================================
        // Cart Line Child Table - Cascading Dropdown Filters
        // =====================================================

        // Listing filter - show only active listings from same tenant
        frm.set_query('listing', 'items', function(doc, cdt, cdn) {
            let filters = {
                'status': 'Active'
            };

            if (doc.tenant) {
                filters['tenant'] = doc.tenant;
            }

            return {
                filters: filters
            };
        });

        // Listing Variant filter - show only variants belonging to selected listing
        frm.set_query('listing_variant', 'items', function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.listing) {
                return {
                    filters: {
                        'listing': row.listing
                    }
                };
            }
            return {
                filters: {
                    'name': ''  // Return nothing if no listing selected
                }
            };
        });

        // =====================================================
        // Marketplace Order Field - Filter by tenant
        // =====================================================
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

        // =====================================================
        // UI Updates for Cart Status
        // =====================================================
        // Disable editing for converted/expired/merged carts
        if (frm.doc.status && ['Converted', 'Expired', 'Merged'].includes(frm.doc.status)) {
            frm.disable_save();
            frm.set_intro(__('This cart is {0} and cannot be modified.', [frm.doc.status.toLowerCase()]), 'yellow');
        }

        // Show cart summary info
        if (!frm.is_new() && frm.doc.items && frm.doc.items.length > 0) {
            let seller_count = new Set(frm.doc.items.map(item => item.seller)).size;
            frm.set_intro(__('Cart contains {0} items from {1} seller(s).',
                [frm.doc.items.length, seller_count]), 'blue');
        }
    
        // =====================================================
        // Role-Based Field Authorization
        // =====================================================
        var is_admin = frappe.user_roles.includes('Satici Admin')
            || frappe.user_roles.includes('Alici Admin')
            || frappe.user_roles.includes('System Manager');

        if (!is_admin) {
            // Lock admin-editable fields for non-admin users
            frm.set_df_property('status', 'read_only', 1);
        }
    },

    tenant: function(frm) {
        // Clear fetch_from field dependent on tenant
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }

        // When tenant changes, validate organization still belongs to new tenant
        if (frm.doc.organization) {
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

        // Also validate buyer belongs to new tenant
        if (frm.doc.buyer && frm.doc.tenant) {
            // Check if buyer has a Buyer Profile in the new tenant
            frappe.call({
                method: 'frappe.client.get_count',
                args: {
                    doctype: 'Buyer Profile',
                    filters: {
                        'user': frm.doc.buyer,
                        'tenant': frm.doc.tenant
                    }
                },
                callback: function(r) {
                    if (r && r.message === 0) {
                        // No Buyer Profile found for this user in the new tenant
                        frm.set_value('buyer', null);
                        frappe.show_alert({
                            message: __('Buyer cleared because they do not have a profile in the selected Tenant'),
                            indicator: 'orange'
                        });
                    }
                }
            });
        }

        // Validate cart items - check if sellers belong to new tenant
        if (frm.doc.tenant && frm.doc.items && frm.doc.items.length > 0) {
            let invalid_items = [];
            let promises = [];

            frm.doc.items.forEach(function(item, idx) {
                if (item.seller) {
                    let promise = new Promise(function(resolve) {
                        frappe.db.get_value('Seller Profile', item.seller, 'tenant', function(r) {
                            if (r && r.tenant && r.tenant !== frm.doc.tenant) {
                                invalid_items.push(item.title || item.listing);
                            }
                            resolve();
                        });
                    });
                    promises.push(promise);
                }
            });

            Promise.all(promises).then(function() {
                if (invalid_items.length > 0) {
                    frappe.msgprint({
                        title: __('Tenant Mismatch Warning'),
                        indicator: 'orange',
                        message: __('The following cart items have sellers from a different tenant and may cause validation errors on save:<br><br>{0}',
                            [invalid_items.join('<br>')])
                    });
                }
            });
        }
    },

    organization: function(frm) {
        // When organization changes, update read-only state of tenant field
        frm.set_df_property('tenant', 'read_only', frm.doc.organization ? 1 : 0);

        // If organization is selected, auto-populate tenant from organization
        if (frm.doc.organization) {
            frappe.db.get_value('Organization', frm.doc.organization, 'tenant', function(r) {
                if (r && r.tenant) {
                    if (!frm.doc.tenant || frm.doc.tenant !== r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                }
            });

            // Also set buyer_type to Organization if not already
            if (frm.doc.buyer_type !== 'Organization') {
                frm.set_value('buyer_type', 'Organization');
            }
        } else {
            // If organization is cleared, allow tenant to be edited again
            // and clear fetch_from field
            frm.set_value('organization_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    buyer_type: function(frm) {
        // When buyer type changes, clear organization if not Organization type
        if (frm.doc.buyer_type !== 'Organization' && frm.doc.organization) {
            frm.set_value('organization', null);
            frappe.show_alert({
                message: __('Organization cleared because buyer type is not Organization'),
                indicator: 'blue'
            });
        }

        // Enable/disable is_b2b_cart based on buyer type
        if (frm.doc.buyer_type === 'Organization') {
            frm.set_value('is_b2b_cart', 1);
        }
    },

    buyer: function(frm) {
        // Clear fetch_from field dependent on buyer when buyer is cleared
        if (!frm.doc.buyer) {
            frm.set_value('buyer_name', '');
        }

        // When buyer changes, optionally auto-populate tenant from buyer's Buyer Profile
        if (frm.doc.buyer && !frm.doc.tenant) {
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Buyer Profile',
                    filters: {
                        'user': frm.doc.buyer
                    },
                    fieldname: ['tenant', 'organization']
                },
                callback: function(r) {
                    if (r && r.message) {
                        if (r.message.tenant && !frm.doc.tenant) {
                            frm.set_value('tenant', r.message.tenant);
                        }
                        // If buyer has an organization and buyer_type is Organization
                        if (r.message.organization && frm.doc.buyer_type === 'Organization' && !frm.doc.organization) {
                            frm.set_value('organization', r.message.organization);
                        }
                    }
                }
            });
        }
    },

    is_b2b_cart: function(frm) {
        // When B2B cart flag changes, update related settings
        if (frm.doc.is_b2b_cart && frm.doc.buyer_type !== 'Organization') {
            frm.set_value('buyer_type', 'Organization');
        }
    }
});

// =====================================================
// Cart Line Child Table - Event Handlers
// =====================================================

frappe.ui.form.on('Cart Line', {
    listing: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // When listing changes, clear listing_variant
        // because it may not belong to the new listing
        if (row.listing_variant) {
            frappe.model.set_value(cdt, cdn, 'listing_variant', '');
            frappe.show_alert({
                message: __('Listing Variant cleared due to listing change'),
                indicator: 'blue'
            });
        }

        // Auto-populate seller and other fields from listing
        if (row.listing) {
            frappe.db.get_value('Listing', row.listing,
                ['seller', 'title', 'sku', 'price', 'compare_at_price', 'primary_image',
                 'stock_uom', 'tax_rate', 'weight', 'weight_uom', 'tenant'],
                function(r) {
                    if (r) {
                        // Validate listing tenant matches cart tenant
                        if (frm.doc.tenant && r.tenant && r.tenant !== frm.doc.tenant) {
                            frappe.model.set_value(cdt, cdn, 'listing', '');
                            frappe.msgprint({
                                title: __('Tenant Mismatch'),
                                indicator: 'red',
                                message: __('This listing belongs to a different tenant and cannot be added to this cart.')
                            });
                            return;
                        }

                        // Set auto-populated fields
                        frappe.model.set_value(cdt, cdn, 'seller', r.seller);
                        frappe.model.set_value(cdt, cdn, 'title', r.title);
                        frappe.model.set_value(cdt, cdn, 'sku', r.sku);
                        frappe.model.set_value(cdt, cdn, 'unit_price', r.price);
                        frappe.model.set_value(cdt, cdn, 'compare_at_price', r.compare_at_price);
                        frappe.model.set_value(cdt, cdn, 'primary_image', r.primary_image);
                        frappe.model.set_value(cdt, cdn, 'stock_uom', r.stock_uom);
                        frappe.model.set_value(cdt, cdn, 'tax_rate', r.tax_rate);
                        frappe.model.set_value(cdt, cdn, 'weight', r.weight);
                        frappe.model.set_value(cdt, cdn, 'weight_uom', r.weight_uom);
                    }
                }
            );
        }
    },

    qty: function(frm, cdt, cdn) {
        // Recalculate line totals when quantity changes
        calculate_line_totals(frm, cdt, cdn);
    },

    unit_price: function(frm, cdt, cdn) {
        // Recalculate line totals when price changes
        calculate_line_totals(frm, cdt, cdn);
    },

    discount_value: function(frm, cdt, cdn) {
        // Recalculate line totals when discount changes
        calculate_line_totals(frm, cdt, cdn);
    },

    discount_type: function(frm, cdt, cdn) {
        // Recalculate line totals when discount type changes
        calculate_line_totals(frm, cdt, cdn);
    },

    tax_rate: function(frm, cdt, cdn) {
        // Recalculate line totals when tax rate changes
        calculate_line_totals(frm, cdt, cdn);
    },

    /**
     * Cascading discount tier 1 change handler
     */
    discount_1: function(frm, cdt, cdn) {
        calculate_line_totals(frm, cdt, cdn);
    },

    /**
     * Cascading discount tier 2 change handler
     */
    discount_2: function(frm, cdt, cdn) {
        calculate_line_totals(frm, cdt, cdn);
    },

    /**
     * Cascading discount tier 3 change handler
     */
    discount_3: function(frm, cdt, cdn) {
        calculate_line_totals(frm, cdt, cdn);
    },

    /**
     * Show discount tiers toggle handler - clears D2/D3 when toggled off
     */
    show_discount_tiers: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (!row.show_discount_tiers) {
            // Clear discount 2 and 3 when hiding tiers
            frappe.model.set_value(cdt, cdn, 'discount_2', 0);
            frappe.model.set_value(cdt, cdn, 'discount_3', 0);
        }
        calculate_line_totals(frm, cdt, cdn);
    },

    // When row is added, recalculate totals
    items_add: function(frm, cdt, cdn) {
        calculate_cart_totals(frm);
    },

    // When row is removed, recalculate totals
    items_remove: function(frm) {
        calculate_cart_totals(frm);
    }
});

// =====================================================
// Helper Functions
// =====================================================

/**
 * Calculate line totals for a cart line item.
 * Handles both regular discount (discount_type/discount_value) and
 * cascading discount tiers (discount_1/2/3).
 * Uses flt() on ALL numeric operations per Pattern 1.
 * CRITICAL: Always use frappe.model.set_value for child table updates.
 */
function calculate_line_totals(frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    var qty = flt(row.qty);
    var unit_price = flt(row.unit_price);
    var discount_value = flt(row.discount_value);
    var tax_rate = flt(row.tax_rate);

    // Calculate discount based on type (regular discount)
    var discount_amount_per_unit = 0;
    if (row.discount_type === 'Percentage' && flt(discount_value) > 0) {
        discount_amount_per_unit = flt(flt(unit_price) * flt(discount_value) / 100);
    } else if (row.discount_type === 'Fixed Amount' && flt(discount_value) > 0) {
        discount_amount_per_unit = flt(discount_value);
    }

    var discounted_price = flt(Math.max(0, flt(unit_price) - flt(discount_amount_per_unit)));
    var total_discount = flt(flt(discount_amount_per_unit) * flt(qty));

    // Apply cascading discount tiers if set (discount_1, discount_2, discount_3)
    var d1 = flt(row.discount_1);
    var d2 = flt(row.discount_2);
    var d3 = flt(row.discount_3);
    var effective_discount_pct = 0;

    if (d1 || d2 || d3) {
        var base_price = flt(discounted_price);
        var price_after_d1 = flt(flt(base_price) * (1 - flt(d1) / 100));
        var price_after_d2 = flt(flt(price_after_d1) * (1 - flt(d2) / 100));
        var final_price = flt(flt(price_after_d2) * (1 - flt(d3) / 100));

        // Calculate cascading discount amount
        var cascading_discount_per_unit = flt(flt(base_price) - flt(final_price));
        total_discount = flt(flt(total_discount) + flt(flt(cascading_discount_per_unit) * flt(qty)));
        discounted_price = flt(final_price);

        // Calculate effective discount percentage
        if (flt(unit_price) > 0) {
            effective_discount_pct = flt(flt(flt(unit_price) - flt(discounted_price)) / flt(unit_price) * 100);
        }
    }

    var line_subtotal = flt(flt(qty) * flt(discounted_price));

    // Calculate tax
    var taxable_amount = flt(line_subtotal);
    var tax_amount = 0;

    if (row.price_includes_tax) {
        // Extract tax from price (VAT inclusive)
        if (flt(tax_rate) > 0) {
            taxable_amount = flt(flt(line_subtotal) / (1 + flt(tax_rate) / 100));
            tax_amount = flt(flt(line_subtotal) - flt(taxable_amount));
        }
    } else {
        // Add tax to price (VAT exclusive)
        if (flt(tax_rate) > 0) {
            tax_amount = flt(flt(line_subtotal) * flt(tax_rate) / 100);
        }
    }

    // Final line total (subtotal + tax for VAT exclusive, or just subtotal for VAT inclusive)
    var line_total = row.price_includes_tax ? flt(line_subtotal) : flt(flt(line_subtotal) + flt(tax_amount));

    // Update all calculated fields using frappe.model.set_value
    // CRITICAL: Never use direct assignment for child table fields
    frappe.model.set_value(cdt, cdn, 'discount_amount', flt(total_discount));
    frappe.model.set_value(cdt, cdn, 'discounted_price', flt(discounted_price));
    frappe.model.set_value(cdt, cdn, 'effective_discount_pct', flt(effective_discount_pct));
    frappe.model.set_value(cdt, cdn, 'line_total', flt(line_total));
    frappe.model.set_value(cdt, cdn, 'taxable_amount', flt(taxable_amount));
    frappe.model.set_value(cdt, cdn, 'tax_amount', flt(tax_amount));

    // Recalculate cart totals
    calculate_cart_totals(frm);
}

/**
 * Calculate cart totals from all items.
 * Uses flt() on ALL numeric operations per Pattern 1.
 */
function calculate_cart_totals(frm) {
    var items = frm.doc.items || [];

    var subtotal = 0;
    var total_discount = 0;
    var total_tax = 0;
    var total_qty = 0;
    var total_weight = 0;
    var item_count = items.length;

    items.forEach(function(item) {
        var line_subtotal = flt(flt(item.qty) * flt(item.discounted_price || item.unit_price));
        subtotal += flt(line_subtotal);
        total_discount += flt(item.discount_amount);
        total_tax += flt(item.tax_amount);
        total_qty += flt(item.qty);
        total_weight += flt(flt(item.weight) * flt(item.qty));
    });

    // Apply cart-level discounts (coupon, promotion)
    var coupon_discount = flt(frm.doc.coupon_discount);
    var promotion_discount = flt(frm.doc.promotion_discount);
    var order_discount = flt(flt(coupon_discount) + flt(promotion_discount));

    // Calculate shipping (estimated)
    var shipping_total = flt(frm.doc.shipping_estimate);

    // Calculate grand total
    var grand_total = flt(flt(subtotal) - flt(order_discount) + flt(total_tax) + flt(shipping_total));

    // Update parent totals
    frm.set_value('subtotal', flt(subtotal));
    frm.set_value('total_discount', flt(flt(total_discount) + flt(order_discount)));
    frm.set_value('tax_total', flt(total_tax));
    frm.set_value('grand_total', flt(grand_total));
    frm.set_value('item_count', item_count);
    frm.set_value('total_qty', flt(total_qty));
    frm.set_value('total_weight', flt(total_weight));
}
