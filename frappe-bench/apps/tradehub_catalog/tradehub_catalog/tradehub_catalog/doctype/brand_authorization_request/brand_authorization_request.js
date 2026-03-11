// Copyright (c) 2026, Trade Hub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Brand Authorization Request', {
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

        // Brand - show all enabled brands
        frm.set_query('brand', function() {
            return {
                filters: {
                    'enabled': 1
                }
            };
        });

        // Make tenant field read-only (fetched from requesting_seller)
        frm.set_df_property('tenant', 'read_only', 1);

        // =====================================================
        // Status-Dependent Action Buttons
        // =====================================================

        var is_admin = frappe.user_roles.includes('System Manager');
        var is_seller = frappe.user_roles.includes('Seller');

        if (!frm.is_new()) {
            // Submit for Review button - visible for Pending requests
            if (frm.doc.status === 'Pending' && (is_seller || is_admin)) {
                frm.add_custom_button(__('Submit for Review'), function() {
                    frappe.confirm(
                        __('Are you sure you want to submit this authorization request for review?'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Brand Authorization Request',
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

            // Approve button - visible for Pending/Under Review requests (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Approve'), function() {
                    frappe.confirm(
                        __('Are you sure you want to approve this authorization request? This will create or update a Brand Gating record.'),
                        function() {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.brand_authorization_request.brand_authorization_request.review_authorization_request',
                                args: {
                                    request_name: frm.doc.name,
                                    action: 'Approve'
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: __('Authorization request approved successfully'),
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

            // Reject button - visible for Pending/Under Review requests (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Reject'), function() {
                    var d = new frappe.ui.Dialog({
                        title: __('Reject Authorization Request'),
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
                                method: 'tradehub_catalog.tradehub_catalog.doctype.brand_authorization_request.brand_authorization_request.review_authorization_request',
                                args: {
                                    request_name: frm.doc.name,
                                    action: 'Reject',
                                    rejection_reason: values.rejection_reason,
                                    review_notes: values.review_notes || null
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        d.hide();
                                        frappe.show_alert({
                                            message: __('Authorization request rejected'),
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

            // Reopen button - visible for Rejected requests (System Manager only)
            if (frm.doc.status === 'Rejected' && is_admin) {
                frm.add_custom_button(__('Reopen'), function() {
                    frappe.confirm(
                        __('Are you sure you want to reopen this request? It will be set back to Pending status.'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Brand Authorization Request',
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

            // View Brand Gating button - visible when brand_gating is set (Approved requests)
            if (frm.doc.brand_gating) {
                frm.add_custom_button(__('View Brand Gating'), function() {
                    frappe.set_route('Form', 'Brand Gating', frm.doc.brand_gating);
                }, __('Actions'));
            }
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

        // =====================================================
        // Brand Owner Dashboard Info
        // =====================================================

        if (!frm.is_new() && frm.doc.brand_owner_seller && is_seller) {
            // Show info to brand owner that they can review this request
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Seller Profile',
                    filters: { 'user': frappe.session.user },
                    fieldname: 'name'
                },
                async: false,
                callback: function(r) {
                    if (r.message && r.message.name === frm.doc.brand_owner_seller) {
                        frm.dashboard.add_comment(
                            __('You are the brand owner. This authorization request is for your brand.'),
                            'blue',
                            true
                        );
                    }
                }
            });
        }
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    requesting_seller: function(frm) {
        // Clear fetch_from fields dependent on requesting_seller
        if (!frm.doc.requesting_seller) {
            frm.set_value('tenant', '');
        }
    }
});
