/**
 * TradeHub Seller — Desk JS
 *
 * Adds a fixed "Go to Storefront" button to the bottom-left corner of
 * every Frappe Desk page.
 *
 * Storefront URL priority:
 *   1. frappe.boot.tradehub_storefront_url  (set via boot_session hook or site_config.json)
 *   2. Hard-coded fallback: http://localhost:5173/
 *
 * To configure for production, add to site_config.json:
 *   "tradehub_storefront_url": "https://marketplace.example.com"
 * and add a boot_session hook that reads frappe.conf.tradehub_storefront_url.
 */
(function () {
	'use strict';

	var STOREFRONT_URL =
		(frappe.boot && frappe.boot.tradehub_storefront_url) ||
		'http://localhost:5173/';

	var BTN_ID = 'th-go-storefront-btn';

	function addStorefrontButton() {
		// Avoid duplicate if Frappe hot-reloads the desk
		if (document.getElementById(BTN_ID)) return;

		var btn = document.createElement('a');
		btn.id = BTN_ID;
		btn.href = STOREFRONT_URL;
		btn.target = '_blank';
		btn.rel = 'noopener noreferrer';
		btn.title = 'Storefront\'a Git';
		btn.setAttribute('aria-label', 'Storefront\'a Git');

		// Icon + label
		btn.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" ' +
			'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" ' +
			'style="flex-shrink:0;margin-top:1px">' +
			'<path stroke-linecap="round" stroke-linejoin="round" ' +
			'd="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75' +
			'm-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84' +
			'M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z' +
			'm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>' +
			'</svg>' +
			'<span style="margin-left:6px">Storefront</span>';

		Object.assign(btn.style, {
			position:       'fixed',
			bottom:         '20px',
			left:           '20px',
			zIndex:         '9999',
			display:        'flex',
			alignItems:     'center',
			padding:        '8px 14px',
			background:     '#2c3e50',
			color:          '#ffffff',
			borderRadius:   '8px',
			textDecoration: 'none',
			fontSize:       '13px',
			fontWeight:     '500',
			boxShadow:      '0 2px 8px rgba(0,0,0,0.25)',
			transition:     'background 0.15s ease',
			cursor:         'pointer',
			lineHeight:     '1',
		});

		btn.addEventListener('mouseenter', function () {
			btn.style.background = '#1a252f';
		});
		btn.addEventListener('mouseleave', function () {
			btn.style.background = '#2c3e50';
		});

		document.body.appendChild(btn);
	}

	// frappe.ready fires after the full desk UI is initialized
	frappe.ready(function () {
		addStorefrontButton();
	});
})();
