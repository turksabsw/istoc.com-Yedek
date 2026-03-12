import frappe


SELLER_TIERS = [
	{
		"tier_code": "BRONZE",
		"tier_name": "Bronze",
		"tier_level": 1,
		"is_default": 1,
		"badge_color": "#cd7f32",
		"badge_icon": "fa-medal",
		"min_seller_score": 0,
		"commission_discount_percent": 0,
		"short_description": "Entry-level tier for all new sellers",
		"display_order": 1,
		"downgrade_grace_days": 0,
		"next_tier": "SILVER",
		"previous_tier": "",
	},
	{
		"tier_code": "SILVER",
		"tier_name": "Silver",
		"tier_level": 2,
		"is_default": 0,
		"badge_color": "#c0c0c0",
		"badge_icon": "fa-medal",
		"min_seller_score": 40,
		"commission_discount_percent": 2,
		"short_description": "Sellers with consistent performance and growing sales",
		"display_order": 2,
		"downgrade_grace_days": 30,
		"next_tier": "GOLD",
		"previous_tier": "BRONZE",
	},
	{
		"tier_code": "GOLD",
		"tier_name": "Gold",
		"tier_level": 3,
		"is_default": 0,
		"badge_color": "#ffd700",
		"badge_icon": "fa-star",
		"min_seller_score": 60,
		"commission_discount_percent": 5,
		"short_description": "High-performing sellers with strong metrics",
		"display_order": 3,
		"downgrade_grace_days": 30,
		"next_tier": "PLATINUM",
		"previous_tier": "SILVER",
	},
	{
		"tier_code": "PLATINUM",
		"tier_name": "Platinum",
		"tier_level": 4,
		"is_default": 0,
		"badge_color": "#e5e4e2",
		"badge_icon": "fa-gem",
		"min_seller_score": 80,
		"commission_discount_percent": 8,
		"short_description": "Elite sellers with exceptional performance across all metrics",
		"display_order": 4,
		"downgrade_grace_days": 45,
		"next_tier": "TOP_RATED",
		"previous_tier": "GOLD",
	},
	{
		"tier_code": "TOP_RATED",
		"tier_name": "Top Rated",
		"tier_level": 5,
		"is_default": 0,
		"badge_color": "#4169e1",
		"badge_icon": "fa-crown",
		"min_seller_score": 90,
		"commission_discount_percent": 12,
		"short_description": "The highest tier for top-performing marketplace sellers",
		"display_order": 5,
		"downgrade_grace_days": 60,
		"next_tier": "",
		"previous_tier": "PLATINUM",
	},
]


def execute():
	"""Idempotent seed script for default Seller Tier records.

	Creates 5 Seller Tier records (BRONZE, SILVER, GOLD, PLATINUM, TOP_RATED)
	if they do not already exist. Safe to run multiple times.
	"""
	for tier_data in SELLER_TIERS:
		tier_code = tier_data["tier_code"]

		if frappe.db.exists("Seller Tier", tier_code):
			continue

		doc = frappe.new_doc("Seller Tier")
		doc.tier_code = tier_data["tier_code"]
		doc.tier_name = tier_data["tier_name"]
		doc.tier_level = tier_data["tier_level"]
		doc.status = "Active"
		doc.is_default = tier_data["is_default"]
		doc.badge_color = tier_data["badge_color"]
		doc.badge_icon = tier_data["badge_icon"]
		doc.min_seller_score = tier_data["min_seller_score"]
		doc.commission_discount_percent = tier_data["commission_discount_percent"]
		doc.short_description = tier_data["short_description"]
		doc.display_order = tier_data["display_order"]
		doc.show_in_marketplace = 1
		doc.show_badge_on_listings = 1
		doc.auto_upgrade = 1
		doc.auto_downgrade = 1
		doc.downgrade_grace_days = tier_data["downgrade_grace_days"]

		if tier_data.get("next_tier"):
			doc.next_tier = tier_data["next_tier"]
		if tier_data.get("previous_tier"):
			doc.previous_tier = tier_data["previous_tier"]

		doc.insert(ignore_permissions=True)

	frappe.db.commit()
