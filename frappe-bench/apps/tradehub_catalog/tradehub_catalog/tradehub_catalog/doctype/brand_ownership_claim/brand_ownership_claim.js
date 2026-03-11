// Copyright (c) 2026, Trade Hub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Brand Ownership Claim', {
    refresh: function(frm) {
        // =====================================================
        // Dynamic Link Filters (set_query in refresh)
        // =====================================================

        // Claiming Seller - filter by active, verified sellers
        frm.set_query('claiming_seller', function() {
            var filters = {
                'status': 'Active',
                'verification_status': 'Verified'
            };
            if (frm.doc.tenant) {
                filters['tenant'] = frm.doc.tenant;
            }
            return { filters: filters };
        });

        // Brand - show all brands (no gating filter for ownership claims)
        frm.set_query('brand', function() {
            return {};
        });

        // Make tenant field read-only (fetched from claiming_seller)
        frm.set_df_property('tenant', 'read_only', 1);

        // =====================================================
        // Status-Dependent Action Buttons
        // =====================================================

        var is_admin = frappe.user_roles.includes('System Manager');
        var is_seller = frappe.user_roles.includes('Seller');

        if (!frm.is_new()) {
            // Submit for Review button - visible for Pending claims
            if (frm.doc.status === 'Pending' && (is_seller || is_admin)) {
                frm.add_custom_button(__('Submit for Review'), function() {
                    frappe.confirm(
                        __('Are you sure you want to submit this claim for review?'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Brand Ownership Claim',
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

            // Approve button - visible for Pending/Under Review claims (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Approve'), function() {
                    frappe.confirm(
                        __('Are you sure you want to approve this ownership claim? This will set the brand owner to the claiming seller.'),
                        function() {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.brand_ownership_claim.brand_ownership_claim.review_ownership_claim',
                                args: {
                                    claim_name: frm.doc.name,
                                    action: 'Approve'
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: __('Ownership claim approved successfully'),
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

            // Reject button - visible for Pending/Under Review claims (System Manager only)
            if ((frm.doc.status === 'Pending' || frm.doc.status === 'Under Review') && is_admin) {
                frm.add_custom_button(__('Reject'), function() {
                    var d = new frappe.ui.Dialog({
                        title: __('Reject Ownership Claim'),
                        fields: [
                            {
                                label: __('Rejection Reason'),
                                fieldname: 'rejection_reason',
                                fieldtype: 'Data',
                                reqd: 1,
                                description: __('Brief reason for rejection')
                            },
                            {
                                label: __('Rejection Details'),
                                fieldname: 'rejection_details',
                                fieldtype: 'Small Text',
                                description: __('Detailed explanation')
                            },
                            {
                                label: __('Admin Notes'),
                                fieldname: 'admin_notes',
                                fieldtype: 'Small Text',
                                description: __('Internal notes (not visible to seller)')
                            }
                        ],
                        primary_action_label: __('Reject'),
                        primary_action: function(values) {
                            frappe.call({
                                method: 'tradehub_catalog.tradehub_catalog.doctype.brand_ownership_claim.brand_ownership_claim.review_ownership_claim',
                                args: {
                                    claim_name: frm.doc.name,
                                    action: 'Reject',
                                    rejection_reason: values.rejection_reason,
                                    rejection_details: values.rejection_details || null,
                                    admin_notes: values.admin_notes || null
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        d.hide();
                                        frappe.show_alert({
                                            message: __('Ownership claim rejected'),
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

            // Reopen button - visible for Rejected claims (System Manager only)
            if (frm.doc.status === 'Rejected' && is_admin) {
                frm.add_custom_button(__('Reopen'), function() {
                    frappe.confirm(
                        __('Are you sure you want to reopen this claim? It will be set back to Pending status.'),
                        function() {
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Brand Ownership Claim',
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

            // Compare Competing Claims button - visible when is_competing_claim (System Manager only)
            if (frm.doc.is_competing_claim && is_admin) {
                frm.add_custom_button(__('Compare Competing Claims'), function() {
                    frappe.call({
                        method: 'tradehub_catalog.tradehub_catalog.doctype.brand_ownership_claim.brand_ownership_claim.compare_competing_claims',
                        args: {
                            brand: frm.doc.brand
                        },
                        callback: function(r) {
                            if (r.message) {
                                var data = r.message;
                                var html = '<div class="competing-claims-comparison">';
                                html += '<p><strong>' + __('Brand') + ':</strong> ' + data.brand_name + '</p>';
                                if (data.current_owner) {
                                    html += '<p><strong>' + __('Current Owner') + ':</strong> ' + data.current_owner_name + '</p>';
                                }
                                html += '<p><strong>' + __('Total Active Claims') + ':</strong> ' + data.total_competing_claims + '</p>';
                                html += '<hr>';

                                data.claims.forEach(function(claim) {
                                    html += '<div class="claim-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #d1d8dd; border-radius: 4px;">';
                                    html += '<p><strong>' + claim.claim_name + '</strong></p>';
                                    html += '<p>' + __('Seller') + ': ' + (claim.seller_name || claim.claiming_seller) + '</p>';
                                    html += '<p>' + __('Company') + ': ' + (claim.company_name || '-') + '</p>';
                                    html += '<p>' + __('Ownership Type') + ': ' + claim.ownership_type + '</p>';
                                    html += '<p>' + __('Status') + ': ' + claim.status + '</p>';
                                    html += '<p>' + __('Documents') + ': ';
                                    html += (claim.has_trademark_certificate ? '&#10003; Trademark' : '&#10007; Trademark') + ', ';
                                    html += (claim.has_trade_registry_document ? '&#10003; Trade Registry' : '&#10007; Trade Registry') + ', ';
                                    html += (claim.has_justification ? '&#10003; Justification' : '&#10007; Justification');
                                    html += '</p>';
                                    html += '</div>';
                                });

                                html += '</div>';

                                frappe.msgprint({
                                    title: __('Competing Claims for {0}', [data.brand_name]),
                                    message: html,
                                    wide: true
                                });
                            }
                        }
                    });
                }, __('Actions'));
            }
        }

        // =====================================================
        // Role-Based Field Authorization
        // =====================================================

        if (!is_admin) {
            // Hide admin-only fields from non-admin users
            frm.set_df_property('admin_notes', 'hidden', 1);
            frm.set_df_property('admin_section', 'hidden', 1);

            // Rejection details are visible (controlled by depends_on in JSON)
            // but read-only for non-admins
            frm.set_df_property('rejection_reason', 'read_only', 1);
            frm.set_df_property('rejection_details', 'read_only', 1);
        }

        // =====================================================
        // Read-Only Enforcement for Non-Pending Claims (Seller)
        // =====================================================

        if (is_seller && !is_admin) {
            // Once a claim is no longer Pending, Seller cannot edit it
            if (frm.doc.status && frm.doc.status !== 'Pending') {
                frm.set_read_only();
            }
        }

        // =====================================================
        // Status Indicator in Form
        // =====================================================

        if (frm.doc.is_competing_claim && !frm.is_new()) {
            frm.dashboard.add_comment(
                __('This is a competing claim. Another seller has also claimed ownership of this brand.'),
                'yellow',
                true
            );
        }
    },

    // =========================================================================
    // CLEAR-ON-CHANGE HANDLERS (for fetch_from fields)
    // =========================================================================

    claiming_seller: function(frm) {
        // Clear fetch_from fields dependent on claiming_seller
        if (!frm.doc.claiming_seller) {
            frm.set_value('tenant', '');
        }
    }
});
