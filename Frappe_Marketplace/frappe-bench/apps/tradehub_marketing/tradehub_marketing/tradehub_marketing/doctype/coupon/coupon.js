// Copyright (c) 2026, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Coupon', {
    refresh: function(frm) {
        // Set up form styling and indicators
        frm.trigger('set_status_indicator');
        frm.trigger('add_action_buttons');
        frm.trigger('setup_bogo_preview');

        // Auto-uppercase coupon code on blur
        if (frm.fields_dict.coupon_code) {
            frm.fields_dict.coupon_code.$input.on('blur', function() {
                let val = $(this).val();
                if (val) {
                    frm.set_value('coupon_code', val.toUpperCase());
                }
            });
        }

        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Seller - filter by tenant and active status
        frm.set_query('seller', function() {
            let filters = {
                'status': 'Active'
            };
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return {
                filters: filters
            };
        });

        // =====================================================
        // Campaign - filter by seller/tenant and active status
        // =====================================================
        frm.set_query('campaign', function() {
            let filters = {
                'status': ['in', ['Active', 'Scheduled']]
            };
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
            frm.set_df_property('is_active', 'read_only', 1);
        }
    },

    discount_type: function(frm) {
        // Update discount_value label based on type
        frm.trigger('update_discount_labels');
        frm.trigger('toggle_bogo_sections');
        frm.trigger('validate_discount_value');
    },

    discount_value: function(frm) {
        frm.trigger('validate_discount_value');
    },

    max_discount_amount: function(frm) {
        frm.set_value('max_discount_amount', flt(frm.doc.max_discount_amount));
    },

    min_order_amount: function(frm) {
        frm.set_value('min_order_amount', flt(frm.doc.min_order_amount));
    },

    onload: function(frm) {
        // Initial setup
        frm.trigger('update_discount_labels');
        frm.trigger('toggle_bogo_sections');
    },

    set_status_indicator: function(frm) {
        // Add visual indicator based on status
        let status = frm.doc.status;
        let indicator_color = {
            'Draft': 'orange',
            'Active': 'green',
            'Expired': 'grey',
            'Used Up': 'red',
            'Deactivated': 'darkgrey'
        };

        if (indicator_color[status]) {
            frm.page.set_indicator(status, indicator_color[status]);
        }
    },

    add_action_buttons: function(frm) {
        if (!frm.is_new()) {
            // Add "Deactivate" button if active
            if (frm.doc.is_active && frm.doc.status === 'Active') {
                frm.add_custom_button(__('Deactivate'), function() {
                    frappe.confirm(
                        __('Are you sure you want to deactivate this coupon?'),
                        function() {
                            frm.set_value('is_active', 0);
                            frm.save();
                        }
                    );
                }, __('Actions'));
            }

            // Add "Activate" button if deactivated
            if (!frm.doc.is_active) {
                frm.add_custom_button(__('Activate'), function() {
                    frm.set_value('is_active', 1);
                    frm.save();
                }, __('Actions'));
            }

            // Add "Duplicate" button
            frm.add_custom_button(__('Duplicate'), function() {
                frappe.prompt([
                    {
                        fieldname: 'new_code',
                        fieldtype: 'Data',
                        label: __('New Coupon Code'),
                        reqd: 1
                    }
                ], function(values) {
                    frappe.call({
                        method: 'frappe.client.insert',
                        args: {
                            doc: {
                                doctype: 'Coupon',
                                coupon_code: values.new_code.toUpperCase(),
                                title: frm.doc.title + ' (Copy)',
                                discount_type: frm.doc.discount_type,
                                discount_value: frm.doc.discount_value,
                                max_discount_amount: frm.doc.max_discount_amount,
                                min_order_amount: frm.doc.min_order_amount,
                                valid_from: frm.doc.valid_from,
                                valid_until: frm.doc.valid_until,
                                usage_limit: frm.doc.usage_limit,
                                usage_per_customer: frm.doc.usage_per_customer,
                                seller: frm.doc.seller,
                                applies_to: frm.doc.applies_to,
                                buy_quantity: frm.doc.buy_quantity,
                                get_quantity: frm.doc.get_quantity,
                                get_discount_percent: frm.doc.get_discount_percent,
                                same_product_only: frm.doc.same_product_only,
                                is_active: 1
                            }
                        },
                        callback: function(r) {
                            if (r.message) {
                                frappe.set_route('Form', 'Coupon', r.message.name);
                            }
                        }
                    });
                }, __('Duplicate Coupon'), __('Create'));
            }, __('Actions'));

            // Add usage statistics button
            frm.add_custom_button(__('View Usage'), function() {
                frappe.set_route('List', 'Marketplace Order', {
                    'coupon_code': frm.doc.coupon_code
                });
            }, __('Actions'));
        }
    },

    update_discount_labels: function(frm) {
        let discount_type = frm.doc.discount_type;

        if (discount_type === 'Percentage') {
            frm.set_df_property('discount_value', 'label', __('Discount Percentage'));
            frm.set_df_property('discount_value', 'description', __('Percentage to discount (0-100)'));
        } else if (discount_type === 'Fixed Amount') {
            frm.set_df_property('discount_value', 'label', __('Discount Amount'));
            frm.set_df_property('discount_value', 'description', __('Fixed amount to discount'));
        } else if (discount_type === 'Free Shipping') {
            frm.set_df_property('discount_value', 'label', __('Discount Value'));
            frm.set_df_property('discount_value', 'description', __('Not used for Free Shipping'));
        } else if (discount_type === 'Buy X Get Y') {
            frm.set_df_property('discount_value', 'label', __('Discount Value'));
            frm.set_df_property('discount_value', 'description', __('Not used for BOGO - configure in BOGO section'));
        }
    },

    toggle_bogo_sections: function(frm) {
        let is_bogo = frm.doc.discount_type === 'Buy X Get Y';

        // Toggle BOGO sections visibility
        frm.toggle_display('bogo_section', is_bogo);
        frm.toggle_display('buy_quantity', is_bogo);
        frm.toggle_display('get_quantity', is_bogo);
        frm.toggle_display('get_discount_percent', is_bogo);
        frm.toggle_display('same_product_only', is_bogo);

        // Toggle BOGO product section based on same_product_only
        let show_product_section = is_bogo && !frm.doc.same_product_only;
        frm.toggle_display('bogo_product_section', show_product_section);
        frm.toggle_display('bogo_buy_products', show_product_section);
        frm.toggle_display('bogo_get_products', show_product_section);
        frm.toggle_display('bogo_categories', is_bogo);

        // Hide discount_value for BOGO (it's not used)
        if (is_bogo) {
            frm.set_df_property('discount_value', 'hidden', 1);
        } else {
            frm.set_df_property('discount_value', 'hidden', 0);
        }
    },

    same_product_only: function(frm) {
        frm.trigger('toggle_bogo_sections');
    },

    validate_discount_value: function(frm) {
        // Validate discount value based on type
        var discount_type = frm.doc.discount_type;
        var discount_value = flt(frm.doc.discount_value);

        if (discount_type === 'Percentage') {
            if (discount_value < 0 || discount_value > 100) {
                frappe.msgprint({
                    title: __('Invalid Discount'),
                    message: __('Discount percentage must be between 0 and 100'),
                    indicator: 'orange'
                });
                frm.set_value('discount_value', Math.min(Math.max(flt(discount_value), 0), 100));
            }
        } else if (discount_type === 'Fixed Amount') {
            if (discount_value < 0) {
                frm.set_value('discount_value', 0);
            }
        }
    },

    setup_bogo_preview: function(frm) {
        if (frm.doc.discount_type === 'Buy X Get Y' && !frm.is_new()) {
            // Add BOGO preview section in the form
            let buy_qty = flt(frm.doc.buy_quantity) || 1;
            let get_qty = flt(frm.doc.get_quantity) || 1;
            let get_pct = flt(frm.doc.get_discount_percent) || 100;

            let promo_text = '';
            if (flt(get_pct) >= 100) {
                promo_text = __('Buy {0}, Get {1} FREE', [buy_qty, get_qty]);
            } else {
                promo_text = __('Buy {0}, Get {1} at {2}% off', [buy_qty, get_qty, get_pct]);
            }

            // Show the promotion text as an intro
            frm.set_intro(promo_text, 'green');
        }
    },

    buy_quantity: function(frm) {
        frm.trigger('setup_bogo_preview');
    },

    get_quantity: function(frm) {
        frm.trigger('setup_bogo_preview');
    },

    get_discount_percent: function(frm) {
        frm.trigger('setup_bogo_preview');
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
        if (!frm.doc.tenant) {
            frm.set_value('tenant_name', '');
        }
    },

    // Auto-populate seller fields and clear on change
    seller: function(frm) {
        if (frm.doc.seller) {
            frappe.db.get_value('Seller Profile', frm.doc.seller, ['seller_name', 'tenant'], function(r) {
                if (r) {
                    frm.set_value('seller_name', r.seller_name);
                    frm.set_value('tenant', r.tenant);
                }
            });
            frm.set_df_property('tenant', 'read_only', 1);
        } else {
            // Clear fetch_from fields dependent on seller
            frm.set_value('seller_name', '');
            frm.set_value('tenant', '');
            frm.set_value('tenant_name', '');
            frm.set_df_property('tenant', 'read_only', 0);
        }
    },

    campaign: function(frm) {
        if (!frm.doc.campaign) {
            // Clear fetch_from field dependent on campaign
            frm.set_value('campaign_name', '');
        }
    },

    // Validate coupon code format
    coupon_code: function(frm) {
        if (frm.doc.coupon_code) {
            let code = frm.doc.coupon_code.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            if (code !== frm.doc.coupon_code) {
                frm.set_value('coupon_code', code);
                frappe.show_alert({
                    message: __('Coupon code formatted: Only uppercase letters, numbers, underscores, and hyphens allowed'),
                    indicator: 'orange'
                }, 3);
            }
        }
    }
});

/**
 * Child table event handlers for Coupon Product Item
 */
frappe.ui.form.on('Coupon Product Item', {
    /**
     * Product (listing) field change handler - fetch product details
     */
    listing: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.listing) {
            // Fetch product details
            frappe.db.get_value('Listing', row.listing, ['listing_title', 'selling_price'], function(r) {
                if (r) {
                    frappe.model.set_value(cdt, cdn, 'listing_title', r.listing_title);
                }
            });
        } else {
            frappe.model.set_value(cdt, cdn, 'listing_title', '');
        }
    },

    /**
     * Row added handler
     */
    applicable_products_add: function(frm, cdt, cdn) {
        frm.refresh_field('applicable_products');
    },

    /**
     * Row removed handler
     */
    applicable_products_remove: function(frm, cdt, cdn) {
        frm.refresh_field('applicable_products');
    },

    /**
     * BOGO buy products row added
     */
    bogo_buy_products_add: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_buy_products');
    },

    /**
     * BOGO buy products row removed
     */
    bogo_buy_products_remove: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_buy_products');
    },

    /**
     * BOGO get products row added
     */
    bogo_get_products_add: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_get_products');
    },

    /**
     * BOGO get products row removed
     */
    bogo_get_products_remove: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_get_products');
    },

    /**
     * Excluded products row added
     */
    excluded_products_add: function(frm, cdt, cdn) {
        frm.refresh_field('excluded_products');
    },

    /**
     * Excluded products row removed
     */
    excluded_products_remove: function(frm, cdt, cdn) {
        frm.refresh_field('excluded_products');
    }
});

/**
 * Child table event handlers for Coupon Category Item
 */
frappe.ui.form.on('Coupon Category Item', {
    /**
     * Category field change handler - fetch category details
     */
    category: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.category) {
            // Fetch category details
            frappe.db.get_value('Category', row.category, 'category_name', function(r) {
                if (r) {
                    frappe.model.set_value(cdt, cdn, 'category_name', r.category_name);
                }
            });
        } else {
            frappe.model.set_value(cdt, cdn, 'category_name', '');
        }
    },

    /**
     * Applicable categories row added
     */
    applicable_categories_add: function(frm, cdt, cdn) {
        frm.refresh_field('applicable_categories');
    },

    /**
     * Applicable categories row removed
     */
    applicable_categories_remove: function(frm, cdt, cdn) {
        frm.refresh_field('applicable_categories');
    },

    /**
     * BOGO categories row added
     */
    bogo_categories_add: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_categories');
    },

    /**
     * BOGO categories row removed
     */
    bogo_categories_remove: function(frm, cdt, cdn) {
        frm.refresh_field('bogo_categories');
    },

    /**
     * Excluded categories row added
     */
    excluded_categories_add: function(frm, cdt, cdn) {
        frm.refresh_field('excluded_categories');
    },

    /**
     * Excluded categories row removed
     */
    excluded_categories_remove: function(frm, cdt, cdn) {
        frm.refresh_field('excluded_categories');
    }
});
