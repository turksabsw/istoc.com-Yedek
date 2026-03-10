// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('RFQ', {
    refresh: function(frm) {
        // =====================================================
        // P1: Tenant Isolation Filters
        // =====================================================
        // Buyer - filter by tenant
        frm.set_query('buyer', function() {
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
        // Commerce Filters
        // =====================================================
        // Category - filter active categories
        frm.set_query('category', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // NDA Template - filter by active templates
        frm.set_query('nda_template', function() {
            return {
                filters: {
                    'is_active': 1
                }
            };
        });

        // Accepted Quote - filter by this RFQ
        frm.set_query('accepted_quote', function() {
            if (frm.doc.name) {
                return {
                    filters: {
                        'rfq': frm.doc.name
                    }
                };
            }
            return {};
        });

        // =====================================================
        // Child Table Filters
        // =====================================================
        // RFQ Item - listing filter by tenant
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

        // Make tenant field read-only when organization is set
        frm.set_df_property('tenant', 'read_only', frm.doc.organization ? 1 : 0);

        // Update views remaining display
        frm.trigger('calculate_views_remaining');

        // Add viewing stats indicator
        if (!frm.is_new()) {
            frm.trigger('show_viewing_stats');
        }

        // Add custom buttons based on status
        if (!frm.is_new() && frm.doc.status === 'Draft') {
            frm.add_custom_button(__('Open for Quotes'), function() {
                frm.set_value('status', 'Open');
                frm.save();
            }, __('Actions'));
        }

        if (!frm.is_new() && ['Open', 'In Progress', 'Quotes Received'].includes(frm.doc.status)) {
            frm.add_custom_button(__('Close RFQ'), function() {
                frappe.confirm(
                    __('Are you sure you want to close this RFQ?'),
                    function() {
                        frm.set_value('status', 'Closed');
                        frm.save();
                    }
                );
            }, __('Actions'));
        }

        // Add button to refresh quote statistics
        if (!frm.is_new() && frm.doc.quote_count > 0) {
            frm.add_custom_button(__('Refresh Quote Statistics'), function() {
                frm.call({
                    doc: frm.doc,
                    method: 'update_quote_statistics',
                    callback: function(r) {
                        frm.reload_doc();
                    }
                });
            }, __('Actions'));
        }

        // Show warning if view limit reached
        if (frm.doc.is_view_limited && frm.doc.max_views > 0 && frm.doc.current_views >= frm.doc.max_views) {
            frm.dashboard.add_comment(
                __('Maximum viewing limit reached. No new sellers can view this RFQ.'),
                'yellow',
                true
            );
        }

        // Show deadline warning
        if (frm.doc.submission_deadline) {
            const deadline = frappe.datetime.str_to_obj(frm.doc.submission_deadline);
            const now = new Date();
            const diff_days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

            if (diff_days < 0 && ['Open', 'In Progress'].includes(frm.doc.status)) {
                frm.dashboard.add_comment(
                    __('Submission deadline has passed. Consider closing this RFQ.'),
                    'red',
                    true
                );
            } else if (diff_days <= 3 && diff_days > 0) {
                frm.dashboard.add_comment(
                    __('Submission deadline is in {0} days.', [diff_days]),
                    'orange',
                    true
                );
            }
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

    is_view_limited: function(frm) {
        frm.trigger('calculate_views_remaining');
        frm.trigger('toggle_viewing_fields');
    },

    max_views: function(frm) {
        frm.trigger('calculate_views_remaining');
    },

    calculate_views_remaining: function(frm) {
        if (frm.doc.is_view_limited && frm.doc.max_views > 0) {
            const remaining = Math.max(0, frm.doc.max_views - (frm.doc.current_views || 0));
            frm.set_value('views_remaining', remaining);
        } else {
            frm.set_value('views_remaining', 0);
        }
    },

    toggle_viewing_fields: function(frm) {
        const is_limited = frm.doc.is_view_limited;
        frm.set_df_property('max_views', 'reqd', is_limited ? 1 : 0);
    },

    show_viewing_stats: function(frm) {
        if (frm.doc.is_view_limited && frm.doc.max_views > 0) {
            const percent_used = Math.round((frm.doc.current_views / frm.doc.max_views) * 100);
            let color = 'blue';
            if (percent_used >= 90) {
                color = 'red';
            } else if (percent_used >= 70) {
                color = 'orange';
            } else if (percent_used >= 50) {
                color = 'yellow';
            }

            frm.dashboard.add_indicator(
                __('Views: {0}/{1} ({2}%)', [frm.doc.current_views, frm.doc.max_views, percent_used]),
                color
            );
        }
    },

    buyer: function(frm) {
        // Clear all fetch_from fields dependent on buyer
        if (!frm.doc.buyer) {
            frm.set_value('buyer_name', '');
            frm.set_value('buyer_company', '');
            frm.set_value('buyer_email', '');
        }
    },

    organization: function(frm) {
        // Auto-populate tenant from organization
        if (frm.doc.organization) {
            frappe.db.get_value('Organization', frm.doc.organization, 'tenant', function(r) {
                if (r && r.tenant) {
                    frm.set_value('tenant', r.tenant);
                    frm.set_df_property('tenant', 'read_only', 1);
                }
            });
        } else {
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

    require_all_items: function(frm) {
        // If require all items is checked, uncheck allow partial quotes
        if (frm.doc.require_all_items) {
            frm.set_value('allow_partial_quotes', 0);
        }
    },

    allow_partial_quotes: function(frm) {
        // If allow partial quotes is checked, uncheck require all items
        if (frm.doc.allow_partial_quotes) {
            frm.set_value('require_all_items', 0);
        }
    },

    before_save: function(frm) {
        // Set created_date if new
        if (frm.is_new() && !frm.doc.created_date) {
            frm.set_value('created_date', frappe.datetime.get_today());
        }

        // Recalculate totals before save
        calculate_totals(frm);
    }
});

// RFQ Item child table events
frappe.ui.form.on('RFQ Item', {
    /**
     * Listing field change handler - fetches item details from listing
     */
    listing: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (row.listing) {
            frappe.db.get_value('Listing', row.listing, ['title', 'category', 'selling_price', 'currency', 'stock_uom'], function(r) {
                if (r) {
                    frappe.model.set_value(cdt, cdn, 'item_name', r.title || '');
                    frappe.model.set_value(cdt, cdn, 'category', r.category || '');
                    frappe.model.set_value(cdt, cdn, 'target_price', r.selling_price || 0);
                    frappe.model.set_value(cdt, cdn, 'currency', r.currency || 'TRY');
                    frappe.model.set_value(cdt, cdn, 'uom', r.stock_uom || 'Nos');
                }
            });
        }
    },

    /**
     * Quantity change handler - validates and recalculates totals
     */
    quantity: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (flt(row.quantity) <= 0) {
            frappe.model.set_value(cdt, cdn, 'quantity', 1);
            frappe.msgprint(__('Quantity must be greater than zero'));
        }
        calculate_totals(frm);
    },

    /**
     * Target price change handler - recalculates totals
     */
    target_price: function(frm, cdt, cdn) {
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
 * Calculate RFQ totals from child table items
 * Sums up total quantity from all RFQ items
 * @param {object} frm - Form object
 */
function calculate_totals(frm) {
    var total_quantity = 0;

    if (frm.doc.items) {
        frm.doc.items.forEach(function(item) {
            total_quantity += flt(item.quantity);
        });
    }

    frm.set_value('quantity', flt(total_quantity));
}
