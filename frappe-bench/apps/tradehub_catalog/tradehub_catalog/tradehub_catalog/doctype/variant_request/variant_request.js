// Copyright (c) 2026, Trade Hub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Variant Request', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Requesting Seller - filter by active, verified sellers
        frm.set_query('requesting_seller', function() {
            var filters = {
                'status': 'Active',
                'verification_status': 'Verified'
            };
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return { filters: filters };
        });

        // Brand - filter by seller authorization (authorized or open/ungated brands)
        frm.set_query('brand', function() {
            if (!frm.doc.requesting_seller) {
                return {};
            }
            if (frm._excluded_brands && frm._excluded_brands.length) {
                return {
                    filters: {
                        'name': ['not in', frm._excluded_brands]
                    }
                };
            }
            return {};
        });

        // Fetch authorized brands for brand field filter
        frm.events.fetch_authorized_brands(frm);

        // Parent product - filter by selected brand and non-archived status
        frm.set_query('parent_product', function() {
            var filters = { 'status': ['in', ['Active', 'Draft']] };
            if (frm.doc.brand) {
                filters['brand'] = frm.doc.brand;
            }
            return { filters: filters };
        });

        // Make tenant field read-only (fetched from requesting_seller)
        frm.set_df_property('tenant', 'read_only', 1);

        // =====================================================
        // Status-Dependent Action Buttons
        // =====================================================

        var is_admin = frappe.user_roles.includes('System Manager');
        var is_seller = frappe.user_roles.includes('Seller');

        if (!frm.is_new()) {
            // Submit for Review button - visible for Pending requests (Seller or Admin)
            if (frm.doc.status === 'Pending' && (is_seller || is_admin)) {
                frm.add_custom_button(__('Submit for Review'), function() {
                    frappe.confirm(
                        __('Are you sure you want to submit this variant request for review?'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Variant Request',
                                    name: frm.doc.name,
                                    fieldname: 'status',
                                    value: 'Under Review'
                                },
                                callback: function() {
                                    frm.reload_doc();
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // Mark Under Review button - visible for Pending requests (System Manager only)
            if (frm.doc.status === 'Pending' && is_admin) {
                frm.add_custom_button(__('Mark Under Review'), function() {
                    frappe.confirm(
                        __('Are you sure you want to mark this variant request as under review?'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Variant Request',
                                    name: frm.doc.name,
                                    fieldname: 'status',
                                    value: 'Under Review'
                                },
                                callback: function() {
                                    frappe.show_alert({
                                        message: __('Variant request marked as under review'),
                                        indicator: 'blue'
                                    });
                                    frm.reload_doc();
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // Approve button - visible for Pending/Under Review requests (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Approve'), function() {
                    frappe.prompt(
                        {
                            fieldname: 'review_notes',
                            label: __('Review Notes'),
                            fieldtype: 'Small Text',
                            description: __('Optional notes about the approval')
                        },
                        function(values) {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.variant_request.variant_request.bulk_approve_variant_requests',
                                args: {
                                    request_names: JSON.stringify([frm.doc.name]),
                                    review_notes: values.review_notes || null
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: __('Variant request approved successfully'),
                                            indicator: 'green'
                                        });
                                        frm.reload_doc();
                                    }
                                }
                            });
                        },
                        __('Approve Variant Request')
                    );
                }, __('Actions'));
            }

            // Reject button - visible for Pending/Under Review requests (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Reject'), function() {
                    var d = new frappe.ui.Dialog({
                        title: __('Reject Variant Request'),
                        fields: [
                            {
                                label: __('Rejection Reason'),
                                fieldname: 'rejection_reason',
                                fieldtype: 'Data',
                                reqd: 1,
                                description: __('Brief reason for rejection')
                            },
                            {
                                label: __('Review Notes'),
                                fieldname: 'review_notes',
                                fieldtype: 'Small Text',
                                description: __('Internal review notes')
                            }
                        ],
                        primary_action_label: __('Reject'),
                        primary_action: function(values) {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.variant_request.variant_request.bulk_reject_variant_requests',
                                args: {
                                    request_names: JSON.stringify([frm.doc.name]),
                                    rejection_reason: values.rejection_reason,
                                    review_notes: values.review_notes || null
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        d.hide();
                                        frappe.show_alert({
                                            message: __('Variant request rejected'),
                                            indicator: 'red'
                                        });
                                        frm.reload_doc();
                                    }
                                }
                            });
                        }
                    });
                    d.show();
                }, __('Actions'));
            }

            // Cancel (Reopen) button - visible for Rejected requests (System Manager only)
            if (frm.doc.status === 'Rejected' && is_admin) {
                frm.add_custom_button(__('Reopen'), function() {
                    frappe.confirm(
                        __('Are you sure you want to reopen this request? It will be set back to Pending status.'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Variant Request',
                                    name: frm.doc.name,
                                    fieldname: 'status',
                                    value: 'Pending'
                                },
                                callback: function() {
                                    frm.reload_doc();
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // Approve Demand Group button - visible when demand group has multiple requests
            if (frm.doc.demand_request_count > 1
                && (frm.doc.status === 'Pending' || frm.doc.status === 'Under Review')
                && is_admin) {
                frm.add_custom_button(__('Approve Demand Group'), function() {
                    frappe.confirm(
                        __('Are you sure you want to approve all {0} requests in this demand group?',
                            [frm.doc.demand_request_count]),
                        function() {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.variant_request.variant_request.approve_demand_group',
                                args: {
                                    demand_group_key: frm.doc.demand_group_key
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: r.message.message,
                                            indicator: 'green'
                                        });
                                        frm.reload_doc();
                                    }
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // View Created Variant button - visible when created_variant is set (Approved)
            if (frm.doc.created_variant) {
                frm.add_custom_button(__('View Created Variant'), function() {
                    frappe.set_route('Form', 'Product Variant', frm.doc.created_variant);
                }, __('Actions'));
            }
        }

        // =====================================================
        // Demand Signal Indicator (Dashboard)
        // =====================================================

        if (!frm.is_new() && frm.doc.demand_request_count > 1) {
            frm.dashboard.add_indicator(
                __('{0} sellers requesting this variant', [frm.doc.demand_request_count]),
                frm.doc.demand_request_count >= 5 ? 'red' : 'orange'
            );
        }

        // =====================================================
        // Approved Variant Link Display (Dashboard)
        // =====================================================

        if (!frm.is_new() && frm.doc.created_variant) {
            frm.dashboard.add_indicator(
                __('Variant Created: {0}', [frm.doc.created_variant]),
                'green'
            );
        }

        // =====================================================
        // Role-Based Field Authorization
        // =====================================================

        if (!is_admin) {
            // Review fields are read-only for non-admin users (controlled by permlevel)
            frm.set_df_property('rejection_reason', 'read_only', 1);
            frm.set_df_property('review_notes', 'read_only', 1);
        }

        // =====================================================
        // Read-Only Enforcement for Non-Pending Requests (Seller)
        // =====================================================

        if (is_seller && !is_admin) {
            // Once a request is no longer Pending, Seller cannot edit it
            if (frm.doc.status && frm.doc.status !== 'Pending') {
                frm.set_read_only();
            }
        }
    },

    // =========================================================================
    // CUSTOM METHODS
    // =========================================================================

    /**
     * Fetch authorized brands for the current seller to filter brand field.
     * Computes excluded brands (gated but not authorized) so the brand dropdown
     * shows only authorized brands and open/ungated brands.
     */
    fetch_authorized_brands: function(frm) {
        // Reset cached data
        frm._excluded_brands = [];

        if (!frm.doc.requesting_seller) {
            return;
        }

        // System Manager bypasses brand authorization
        if (frappe.user_roles.includes('System Manager')) {
            return;
        }

        frappe.call({
            method: 'tradehub_catalog.tradehub_catalog.doctype.brand_authorization_request.brand_authorization_request.get_authorized_brands_for_seller',
            args: { requesting_seller: frm.doc.requesting_seller },
            async: true,
            callback: function(r) {
                var authorized_brands = (r.message || []).map(function(b) { return b.brand; });

                // Get all gated brands to compute excluded list
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Brand Gating',
                        fields: ['brand'],
                        limit_page_length: 0
                    },
                    async: true,
                    callback: function(r2) {
                        var gated_brands_raw = (r2.message || []).map(function(b) { return b.brand; });

                        // Deduplicate gated brand names
                        var gated_brands = [];
                        gated_brands_raw.forEach(function(b) {
                            if (gated_brands.indexOf(b) === -1) {
                                gated_brands.push(b);
                            }
                        });

                        // Excluded = gated but NOT authorized for this seller
                        frm._excluded_brands = gated_brands.filter(function(b) {
                            return authorized_brands.indexOf(b) === -1;
                        });
                    }
                });
            }
        });
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from and dependent fields)
    // =========================================================================

    requesting_seller: function(frm) {
        // Clear fetch_from fields dependent on requesting_seller
        if (!frm.doc.requesting_seller) {
            frm.set_value('tenant', '');
        }
        // Clear dependent fields when seller changes
        frm.set_value('brand', '');
        frm.set_value('parent_product', '');
        // Re-fetch authorized brands for new seller
        frm.events.fetch_authorized_brands(frm);
    },

    brand: function(frm) {
        // Clear parent_product when brand changes (parent_product is filtered by brand)
        frm.set_value('parent_product', '');
    }
});
