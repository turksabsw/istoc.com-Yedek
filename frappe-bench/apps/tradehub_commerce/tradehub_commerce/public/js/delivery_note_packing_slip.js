// Copyright (c) 2024, TR TradeHub and contributors
// For license information, please see license.txt

frappe.ui.form.on('Delivery Note', {
    refresh: function(frm) {
        if (!frm.doc.custom_marketplace_order) {
            return;
        }

        if (!(frm.doc.items && frm.doc.items.length)) {
            return;
        }

        frm.add_custom_button(__('Packing Slip'), function() {
            var w = window.open(
                frappe.urllib.get_full_url(
                    '/api/method/frappe.utils.print_format.download_pdf?'
                    + 'doctype=' + encodeURIComponent('Delivery Note')
                    + '&name=' + encodeURIComponent(frm.doc.name)
                    + '&format=' + encodeURIComponent('Marketplace Packing Slip')
                    + '&no_letterhead=0'
                )
            );
            if (!w) {
                frappe.msgprint(__('Please enable pop-ups'));
            }
        }, __('Print'));

        frm.add_custom_button(__('Print Packing Slip (Direct)'), function() {
            frm.print_doc('Marketplace Packing Slip');
        }, __('Print'));
    }
});
