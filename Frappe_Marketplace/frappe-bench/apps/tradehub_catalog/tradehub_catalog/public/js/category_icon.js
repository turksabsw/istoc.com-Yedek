// Copyright (c) 2026, TradeHub and contributors
// For license information, please see license.txt

/**
 * Category Icon Renderer
 *
 * Renders category icons with a fallback chain:
 *   1. SVG icon (Attach Image field) — rendered as <img>
 *   2. Icon class (e.g. "fa fa-tag") — rendered as <i> element
 *   3. Default SVG — inline folder/tag icon
 *
 * Usage:
 *   tradehub_catalog.renderCategoryIcon(category_doc, 'md');
 *   tradehub_catalog.renderCategoryIcon({ icon: '/files/cat.svg', icon_class: '', icon_color: '#333' }, 'lg');
 */

frappe.provide('tradehub_catalog');

(function () {
	'use strict';

	// Default SVG icon (simple tag/category shape)
	var DEFAULT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
		+ '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>'
		+ '<line x1="7" y1="7" x2="7.01" y2="7"/>'
		+ '</svg>';

	/**
	 * Sanitize a string for safe insertion into HTML attributes.
	 * Escapes &, <, >, ", and ' characters.
	 *
	 * @param {string} str - The string to escape
	 * @returns {string} The escaped string
	 */
	function escapeHtml(str) {
		if (!str) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	/**
	 * Validate a CSS color value (hex format).
	 *
	 * @param {string} color - The color string to validate
	 * @returns {boolean} True if valid hex color
	 */
	function isValidColor(color) {
		if (!color) return false;
		return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
	}

	/**
	 * Validate an icon class string.
	 * Only allows alphanumeric characters, hyphens, underscores, and spaces.
	 *
	 * @param {string} iconClass - The icon class string to validate
	 * @returns {boolean} True if valid icon class
	 */
	function isValidIconClass(iconClass) {
		if (!iconClass) return false;
		return /^[a-zA-Z0-9_\- ]+$/.test(iconClass);
	}

	/**
	 * Render a category icon with fallback chain.
	 *
	 * Fallback order:
	 *   1. SVG/image icon from the `icon` (Attach Image) field
	 *   2. Icon class from the `icon_class` field (e.g. "fa fa-tag")
	 *   3. Default inline SVG tag icon
	 *
	 * @param {object|string} category - Category document object or category name.
	 *   If an object, expects fields: icon, icon_class, icon_color, icon_name.
	 *   If a string, will render the default icon (async fetch not supported here).
	 * @param {string} [size='md'] - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
	 * @returns {string} HTML string for the icon element
	 */
	function renderCategoryIcon(category, size) {
		size = size || 'md';

		// Validate size parameter
		var validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
		if (validSizes.indexOf(size) === -1) {
			size = 'md';
		}

		// Handle string input (just category name) - render default
		if (!category || typeof category === 'string') {
			return _renderDefault(size, '#333333');
		}

		var iconUrl = category.icon || '';
		var iconClass = category.icon_class || '';
		var iconColor = category.icon_color || '#333333';
		var iconName = category.icon_name || '';

		// Validate color - fall back to default if invalid
		if (!isValidColor(iconColor)) {
			iconColor = '#333333';
		}

		// Fallback 1: SVG/Image icon from Attach Image field
		if (iconUrl) {
			return _renderImage(iconUrl, iconName, size, iconColor);
		}

		// Fallback 2: Icon class (e.g. "fa fa-tag", "octicon octicon-package")
		if (iconClass && isValidIconClass(iconClass)) {
			return _renderIconClass(iconClass, size, iconColor);
		}

		// Fallback 3: Default SVG
		return _renderDefault(size, iconColor);
	}

	/**
	 * Render an image-based icon (SVG or other image from Attach Image field).
	 *
	 * @param {string} url - The image URL
	 * @param {string} name - Alt text for the image
	 * @param {string} size - Size variant
	 * @param {string} color - Icon color (used as CSS variable for SVG tinting)
	 * @returns {string} HTML string
	 */
	function _renderImage(url, name, size, color) {
		var altText = escapeHtml(name || 'Category icon');
		var escapedUrl = escapeHtml(url);
		var isSvg = url.toLowerCase().endsWith('.svg');
		var svgClass = isSvg ? ' category-icon--svg' : '';

		return '<span class="category-icon category-icon--' + size + svgClass + '"'
			+ ' style="--category-icon-color: ' + escapeHtml(color) + ';">'
			+ '<img src="' + escapedUrl + '" alt="' + altText + '" loading="lazy" />'
			+ '</span>';
	}

	/**
	 * Render a class-based icon (Font Awesome, Octicons, etc.).
	 *
	 * @param {string} iconClass - CSS class(es) for the icon
	 * @param {string} size - Size variant
	 * @param {string} color - Icon color
	 * @returns {string} HTML string
	 */
	function _renderIconClass(iconClass, size, color) {
		return '<span class="category-icon category-icon--' + size + ' category-icon--class"'
			+ ' style="--category-icon-color: ' + escapeHtml(color) + ';">'
			+ '<i class="' + escapeHtml(iconClass) + '"></i>'
			+ '</span>';
	}

	/**
	 * Render the default inline SVG icon.
	 *
	 * @param {string} size - Size variant
	 * @param {string} color - Icon color
	 * @returns {string} HTML string
	 */
	function _renderDefault(size, color) {
		return '<span class="category-icon category-icon--' + size + ' category-icon--default"'
			+ ' style="--category-icon-color: ' + escapeHtml(color) + ';">'
			+ DEFAULT_SVG
			+ '</span>';
	}

	/**
	 * Render a category icon asynchronously by fetching category data.
	 * Useful when you only have the category name and need to look up icon fields.
	 *
	 * @param {string} categoryName - The category document name
	 * @param {string} categoryDoctype - The DocType ('Category' or 'Product Category')
	 * @param {string} [size='md'] - Size variant
	 * @param {function} callback - Callback receiving the HTML string
	 */
	function renderCategoryIconAsync(categoryName, categoryDoctype, size, callback) {
		if (!categoryName || !categoryDoctype) {
			if (callback) {
				callback(renderCategoryIcon(null, size));
			}
			return;
		}

		frappe.db.get_value(
			categoryDoctype,
			categoryName,
			['icon', 'icon_class', 'icon_color', 'icon_name'],
			function (r) {
				var html;
				if (r) {
					html = renderCategoryIcon(r, size);
				} else {
					html = renderCategoryIcon(null, size);
				}
				if (callback) {
					callback(html);
				}
			}
		);
	}

	// Export to namespace
	tradehub_catalog.renderCategoryIcon = renderCategoryIcon;
	tradehub_catalog.renderCategoryIconAsync = renderCategoryIconAsync;
})();
