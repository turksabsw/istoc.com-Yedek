// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Sub Order', {
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

        // Ensure read-only fields when marketplace_order is set
        if (frm.doc.marketplace_order) {
            set_parent_order_fields_readonly(frm, true);
        }

        // Ensure tenant field is read-only when seller is set
        frm.set_df_property('tenant', 'read_only', frm.doc.seller ? 1 : 0);

        // Add custom buttons for saved records
        if (!frm.is_new()) {
            // Add button to view parent order
            if (frm.doc.marketplace_order) {
                frm.add_custom_button(__('View Parent Order'), function() {
                    frappe.set_route('Form', 'Marketplace Order', frm.doc.marketplace_order);
                }, __('Actions'));
            }

            // =====================================================
            // P2: Seller Ownership Check
            // =====================================================
            frappe.call({
                method: 'tradehub_commerce.sub_order_seller_actions.check_seller_ownership',
                args: { sub_order_name: frm.doc.name },
                callback: function(r) {
                    if (r.message && r.message.is_seller) {
                        add_seller_create_buttons(frm);
                    }
                }
            });
        }

        // Show parent order info in dashboard
        if (frm.doc.marketplace_order && frm.doc.parent_order_id) {
            frm.dashboard.add_comment(
                __('Sub order of Marketplace Order: {0}', [frm.doc.parent_order_id]),
                'blue',
                true
            );
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
            frm.set_df_property('payout_status', 'read_only', 1);
            frm.set_df_property('payment_status', 'read_only', 1);
            frm.set_df_property('escrow_status', 'read_only', 1);
            frm.set_df_property('fulfillment_status', 'read_only', 1);
            frm.set_df_property('e_invoice_status', 'read_only', 1);
            frm.set_df_property('cancellation_approved', 'read_only', 1);
            frm.set_df_property('cancellation_approved_by', 'read_only', 1);
            frm.set_df_property('refund_status', 'read_only', 1);
            frm.set_df_property('internal_notes', 'read_only', 1);

            // Hide internal notes from non-admin users
            frm.set_df_property('internal_notes', 'hidden', 1);
        }
    },

    marketplace_order: function(frm) {
        // When marketplace order is selected, auto-populate fields
        if (frm.doc.marketplace_order) {
            frappe.call({
                method: 'tr_tradehub.tr_tradehub.doctype.sub_order.sub_order.get_parent_order_details',
                args: {
                    marketplace_order: frm.doc.marketplace_order
                },
                callback: function(r) {
                    if (r.message && r.message.order) {
                        populate_from_parent_order(frm, r.message.order);
                    }
                }
            });
        } else {
            // Clear fields when marketplace order is cleared
            clear_parent_order_fields(frm);
        }
    },

    seller: function(frm) {
        // When seller is selected, fetch tenant from seller profile
        if (frm.doc.seller) {
            frappe.db.get_value('Seller Profile', frm.doc.seller, ['tenant', 'seller_name', 'commission_plan'], function(r) {
                if (r) {
                    if (r.tenant) {
                        frm.set_value('tenant', r.tenant);
                    }
                    // Make tenant read-only after auto-populating
                    frm.set_df_property('tenant', 'read_only', 1);

                    // Get commission rate from commission plan
                    if (r.commission_plan) {
                        frappe.db.get_value('Commission Plan', r.commission_plan, 'default_rate', function(plan_r) {
                            if (plan_r && plan_r.default_rate) {
                                frm.set_value('commission_rate', plan_r.default_rate);
                            }
                        });
                    }
                }
            });
        } else {
            // Clear all fetch_from fields dependent on seller
            frm.set_value('seller_name', '');
            frm.set_value('seller_company', '');
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    tenant: function(frm) {
        // Clear fetch_from field dependent on tenant
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    /**
     * Discount 1 change handler - recalculates totals with cascading discounts
     */
    discount_1: function(frm) {
        calculate_totals(frm);
    },

    /**
     * Discount 2 change handler - recalculates totals with cascading discounts
     */
    discount_2: function(frm) {
        calculate_totals(frm);
    },

    /**
     * Discount 3 change handler - recalculates totals with cascading discounts
     */
    discount_3: function(frm) {
        calculate_totals(frm);
    },

    /**
     * Show discount tiers toggle handler - shows/hides discount 2 and 3 fields
     */
    show_discount_tiers: function(frm) {
        if (!frm.doc.show_discount_tiers) {
            // Clear discount 2 and 3 when hiding tiers
            frm.set_value('discount_2', 0);
            frm.set_value('discount_3', 0);
        }
        calculate_totals(frm);
    }
});

/**
 * Child table event handlers for Sub Order Items
 */
frappe.ui.form.on('Sub Order Item', {
    /**
     * Quantity change handler
     */
    qty: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.line_subtotal = flt(row.qty) * flt(row.unit_price);
        frm.refresh_field('items');
        calculate_totals(frm);
    },

    /**
     * Unit price change handler
     */
    unit_price: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.line_subtotal = flt(row.qty) * flt(row.unit_price);
        frm.refresh_field('items');
        calculate_totals(frm);
    },

    /**
     * Item row added handler
     */
    items_add: function(frm, cdt, cdn) {
        calculate_totals(frm);
    },

    /**
     * Item row removed handler
     */
    items_remove: function(frm, cdt, cdn) {
        calculate_totals(frm);
    }
});

/**
 * Add seller-specific Create buttons based on Sub Order status
 * @param {object} frm - Form object
 */
function add_seller_create_buttons(frm) {
    let status = frm.doc.status;

    // Accept Order - Pending
    if (status === 'Pending') {
        frm.add_custom_button(__('Accept Order'), function() {
            frappe.call({
                method: 'tradehub_commerce.sub_order_seller_actions.accept_sub_order',
                args: { sub_order_name: frm.doc.name },
                callback: function(r) {
                    if (r.message) {
                        frm.reload_doc();
                    }
                }
            });
        }, __('Create'));
    }

    // Cancel - Pending/Accepted
    if (['Pending', 'Accepted'].includes(status)) {
        frm.add_custom_button(__('Cancel'), function() {
            frappe.confirm(
                __('Are you sure you want to cancel this Sub Order?'),
                function() {
                    frappe.call({
                        method: 'tradehub_commerce.sub_order_seller_actions.cancel_sub_order',
                        args: { sub_order_name: frm.doc.name },
                        callback: function(r) {
                            if (r.message) {
                                frm.reload_doc();
                            }
                        }
                    });
                }
            );
        }, __('Create'));
    }

    // Proforma Invoice - Accepted/Processing, no existing PI
    if (['Accepted', 'Processing'].includes(status)) {
        frappe.db.count('Proforma Invoice', {
            'custom_sub_order': frm.doc.name,
            'docstatus': ['!=', 2]
        }).then(count => {
            if (!count) {
                frm.add_custom_button(__('Proforma Invoice'), function() {
                    frappe.new_doc('Proforma Invoice', {
                        'custom_sub_order': frm.doc.name,
                        'seller': frm.doc.seller,
                        'tenant': frm.doc.tenant
                    });
                }, __('Create'));
            }
        });
    }

    // Sales Invoice - Accepted/Processing/Packed, no existing SI
    if (['Accepted', 'Processing', 'Packed'].includes(status)) {
        frappe.db.count('Sales Invoice', {
            'custom_sub_order': frm.doc.name,
            'docstatus': ['!=', 2]
        }).then(count => {
            if (!count) {
                frm.add_custom_button(__('Sales Invoice'), function() {
                    frappe.model.open_mapped_doc({
                        method: 'tradehub_commerce.sub_order_seller_actions.make_sales_invoice',
                        frm: frm
                    });
                }, __('Create'));
            }
        });
    }

    // Delivery Note - Processing/Packed
    if (['Processing', 'Packed'].includes(status)) {
        frm.add_custom_button(__('Delivery Note'), function() {
            frappe.model.open_mapped_doc({
                method: 'tradehub_commerce.sub_order_seller_actions.make_delivery_note',
                frm: frm
            });
        }, __('Create'));
    }

    // Payment Request - Accepted/Processing
    if (['Accepted', 'Processing'].includes(status)) {
        frm.add_custom_button(__('Payment Request'), function() {
            frappe.new_doc('Payment Request', {
                'reference_doctype': 'Sub Order',
                'reference_name': frm.doc.name,
                'grand_total': frm.doc.grand_total,
                'currency': frm.doc.currency
            });
        }, __('Create'));
    }

    // Shipment - Processing/Packed
    if (['Processing', 'Packed'].includes(status)) {
        frm.add_custom_button(__('Shipment'), function() {
            frappe.model.open_mapped_doc({
                method: 'tradehub_commerce.sub_order_seller_actions.make_shipment',
                frm: frm
            });
        }, __('Create'));
    }

    // Return / Credit Note - Delivered/Completed
    if (['Delivered', 'Completed'].includes(status)) {
        frm.add_custom_button(__('Return / Credit Note'), function() {
            frappe.model.open_mapped_doc({
                method: 'tradehub_commerce.sub_order_seller_actions.make_return_credit_note',
                frm: frm
            });
        }, __('Create'));
    }
}

/**
 * Calculate sub order totals from line items
 * @param {object} frm - Form object
 */
function calculate_totals(frm) {
    var subtotal = 0;
    var tax_amount = 0;
    var item_discount_amount = 0;
    var shipping_amount = 0;
    var commission_amount = 0;

    // Sum up item amounts (bottom-up aggregation)
    if (frm.doc.items) {
        frm.doc.items.forEach(function(item) {
            // Calculate row line_subtotal
            item.line_subtotal = flt(flt(item.qty) * flt(item.unit_price));

            // Calculate row discount
            if (item.discount_type === 'Percentage') {
                item.discount_amount = flt(flt(item.line_subtotal) * flt(item.discount_value) / 100);
            } else if (item.discount_type === 'Fixed') {
                item.discount_amount = flt(item.discount_value);
            } else {
                item.discount_amount = 0;
            }

            // Taxable amount (after discount)
            var taxable_amount = flt(item.line_subtotal) - flt(item.discount_amount);

            // Calculate row tax
            item.tax_amount = flt(taxable_amount * flt(item.tax_rate) / 100);

            // Line total
            item.line_total = flt(taxable_amount + flt(item.tax_amount));

            // Calculate row commission
            item.commission_amount = flt(taxable_amount * flt(item.commission_rate) / 100);

            // Aggregate parent totals
            subtotal += flt(item.line_subtotal);
            tax_amount += flt(item.tax_amount);
            item_discount_amount += flt(item.discount_amount);
            shipping_amount += flt(item.shipping_amount);
            commission_amount += flt(item.commission_amount);
        });
    }

    frm.set_value('subtotal', subtotal);
    frm.set_value('tax_amount', tax_amount);
    frm.set_value('shipping_amount', shipping_amount || flt(frm.doc.shipping_amount));
    frm.set_value('commission_amount', commission_amount);

    // Calculate cascading discount: base * (1-d1/100) * (1-d2/100) * (1-d3/100)
    var cascading_discount = 0;
    var effective_discount_pct = 0;
    var d1 = flt(frm.doc.discount_1);
    var d2 = flt(frm.doc.discount_2);
    var d3 = flt(frm.doc.discount_3);

    if (flt(subtotal) > 0) {
        var price_after_d1 = flt(flt(subtotal) * (1 - d1 / 100));
        var price_after_d2 = flt(price_after_d1 * (1 - d2 / 100));
        var final_price = flt(price_after_d2 * (1 - d3 / 100));
        cascading_discount = flt(flt(subtotal) - final_price);
    }

    // Total discount = item-level discounts + cascading parent discount
    var total_discount = flt(item_discount_amount) + flt(cascading_discount);
    frm.set_value('discount_amount', total_discount);

    // Effective discount percentage for display
    if (flt(subtotal) > 0) {
        effective_discount_pct = flt(total_discount / flt(subtotal) * 100);
    }
    frm.set_value('effective_discount_pct', effective_discount_pct);

    // Grand total = subtotal - discount + shipping + tax
    var grand_total = flt(subtotal) - flt(total_discount) + flt(shipping_amount || flt(frm.doc.shipping_amount)) + flt(tax_amount);
    frm.set_value('grand_total', grand_total);

    // Commission rate (average)
    if (flt(subtotal) > 0) {
        frm.set_value('commission_rate', flt(commission_amount) / flt(subtotal) * 100);
    }

    // Seller payout = grand_total - commission
    frm.set_value('seller_payout', flt(grand_total) - flt(commission_amount));

    frm.refresh_field('items');
}

/**
 * Populate Sub Order fields from parent Marketplace Order
 */
function populate_from_parent_order(frm, order) {
    // Parent order ID for display
    frm.set_value('parent_order_id', order.order_id);

    // Order date from parent
    if (!frm.doc.order_date && order.order_date) {
        frm.set_value('order_date', order.order_date);
    }

    // Buyer information
    if (!frm.doc.buyer && order.buyer) {
        frm.set_value('buyer', order.buyer);
    }
    frm.set_value('buyer_name', order.buyer_name || '');
    frm.set_value('buyer_email', order.buyer_email || '');
    frm.set_value('buyer_phone', order.buyer_phone || '');
    frm.set_value('buyer_tax_id', order.buyer_tax_id || '');

    // Currency
    if (!frm.doc.currency && order.currency) {
        frm.set_value('currency', order.currency);
    }

    // Shipping address
    frm.set_value('shipping_address_name', order.shipping_address_name || '');
    frm.set_value('shipping_address_line1', order.shipping_address_line1 || '');
    frm.set_value('shipping_address_line2', order.shipping_address_line2 || '');
    frm.set_value('shipping_city', order.shipping_city || '');
    frm.set_value('shipping_state', order.shipping_state || '');
    frm.set_value('shipping_postal_code', order.shipping_postal_code || '');
    frm.set_value('shipping_country', order.shipping_country || 'Turkey');
    frm.set_value('shipping_phone', order.shipping_phone || '');

    // Set fields as read-only since they come from parent order
    set_parent_order_fields_readonly(frm, true);

    // Show success message
    frappe.show_alert({
        message: __('Buyer and shipping information populated from parent order'),
        indicator: 'green'
    }, 3);
}

/**
 * Set parent order fields as read-only or editable
 */
function set_parent_order_fields_readonly(frm, read_only) {
    // Buyer fields
    frm.set_df_property('buyer', 'read_only', read_only);
    frm.set_df_property('buyer_name', 'read_only', 1); // Always read-only
    frm.set_df_property('buyer_email', 'read_only', 1);
    frm.set_df_property('buyer_phone', 'read_only', 1);
    frm.set_df_property('buyer_tax_id', 'read_only', 1);

    // Currency
    frm.set_df_property('currency', 'read_only', read_only);

    // Shipping address fields
    frm.set_df_property('shipping_address_name', 'read_only', read_only);
    frm.set_df_property('shipping_address_line1', 'read_only', read_only);
    frm.set_df_property('shipping_address_line2', 'read_only', read_only);
    frm.set_df_property('shipping_city', 'read_only', read_only);
    frm.set_df_property('shipping_state', 'read_only', read_only);
    frm.set_df_property('shipping_postal_code', 'read_only', read_only);
    frm.set_df_property('shipping_country', 'read_only', read_only);
    frm.set_df_property('shipping_phone', 'read_only', read_only);
}

/**
 * Clear fields populated from parent order
 */
function clear_parent_order_fields(frm) {
    // Clear parent order ID
    frm.set_value('parent_order_id', '');

    // Clear buyer info
    frm.set_value('buyer', '');
    frm.set_value('buyer_name', '');
    frm.set_value('buyer_email', '');
    frm.set_value('buyer_phone', '');
    frm.set_value('buyer_tax_id', '');

    // Clear shipping address
    frm.set_value('shipping_address_name', '');
    frm.set_value('shipping_address_line1', '');
    frm.set_value('shipping_address_line2', '');
    frm.set_value('shipping_city', '');
    frm.set_value('shipping_state', '');
    frm.set_value('shipping_postal_code', '');
    frm.set_value('shipping_country', 'Turkey');
    frm.set_value('shipping_phone', '');

    // Make fields editable again
    set_parent_order_fields_readonly(frm, false);

    // Show info message
    frappe.show_alert({
        message: __('Parent order cleared - please select a marketplace order'),
        indicator: 'yellow'
    }, 3);
}
