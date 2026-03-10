# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate tradehub_seller JSON Fields to Child Tables.

This patch migrates data from deprecated JSON fields to new child table structures
across the following DocTypes:

- SKU Product: images -> SKU Product Image (product_images)
- Listing Variant: images -> Listing Variant Image (variant_images)
- Seller Balance: recent_transactions -> Seller Balance Transaction (transaction_records)
- Seller Score: special_achievements -> Seller Achievement (achievements)
- Seller Tier: custom_benefits -> Seller Tier Benefit (tier_benefits)

IMPORTANT: This patch is idempotent. It skips records that already have
child table rows for the corresponding table field.
"""

import json

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates JSON field data to child table rows for all tradehub_seller DocTypes.
    """
    # Reload all child DocTypes to ensure schema is up to date
    reload_child_doctypes()

    # Reload parent DocTypes
    reload_parent_doctypes()

    total_migrated = 0
    total_skipped = 0
    total_errors = 0

    # Migrate each DocType
    migrations = [
        ("SKU Product", migrate_sku_product_images),
        ("Listing Variant", migrate_listing_variant_images),
        ("Seller Balance", migrate_seller_balance_transactions),
        ("Seller Score", migrate_seller_score_achievements),
        ("Seller Tier", migrate_seller_tier_benefits),
    ]

    for doctype_name, migration_func in migrations:
        try:
            migrated, skipped, errors = migration_func()
            total_migrated += migrated
            total_skipped += skipped
            total_errors += errors
        except Exception as e:
            frappe.log_error(
                title=_("Migration Error: {0}").format(doctype_name),
                message=_("Unexpected error migrating {0}: {1}").format(
                    doctype_name, str(e)
                )
            )
            total_errors += 1

    if total_migrated > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Seller JSON Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_child_doctypes():
    """Reload all new child DocTypes to ensure database schema is current."""
    child_doctypes = [
        "sku_product_image",
        "listing_variant_image",
        "seller_balance_transaction",
        "seller_achievement",
        "seller_tier_benefit",
    ]
    for dt in child_doctypes:
        frappe.reload_doc("tradehub_seller", "doctype", dt)


def reload_parent_doctypes():
    """Reload parent DocTypes to ensure they have the new Table fields."""
    parent_doctypes = [
        "sku_product",
        "listing_variant",
        "seller_balance",
        "seller_score",
        "seller_tier",
    ]
    for dt in parent_doctypes:
        frappe.reload_doc("tradehub_seller", "doctype", dt)


def parse_json_field(value):
    """
    Safely parse a JSON field value.

    Args:
        value: The raw field value (str, list, dict, or None).

    Returns:
        Parsed data (list or dict), or None if parsing fails or value is empty.
    """
    if not value:
        return None

    if isinstance(value, (list, dict)):
        return value

    if isinstance(value, str):
        value = value.strip()
        if not value or value in ("null", "None", "[]", "{}"):
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError, ValueError):
            return None

    return None


# ---------------------------------------------------------------------------
# SKU Product: images -> SKU Product Image (product_images)
# ---------------------------------------------------------------------------

def migrate_sku_product_images():
    """
    Migrate SKU Product.images JSON to SKU Product Image child table.

    Expected JSON format: list of image URL strings or list of dicts with
    image/url, alt_text, sort_order, is_primary, image_angle, channel.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("SKU Product", "images"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, images
        FROM `tabSKU Product`
        WHERE images IS NOT NULL
            AND images != ''
            AND images != '[]'
            AND images != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabSKU Product Image` spi
                WHERE spi.parent = `tabSKU Product`.name
                AND spi.parenttype = 'SKU Product'
                AND spi.parentfield = 'product_images'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.images)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("SKU Product", record.name)

            # Double-check idempotency
            if doc.get("product_images") and len(doc.product_images) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if isinstance(item, str):
                    # Simple string format: just the image URL
                    if item.strip():
                        doc.append("product_images", {
                            "image": item.strip(),
                            "alt_text": "",
                            "sort_order": idx,
                            "is_primary": 1 if idx == 0 else 0,
                            "image_angle": "",
                            "channel": "",
                        })
                elif isinstance(item, dict):
                    image_url = (
                        item.get("image", "")
                        or item.get("url", "")
                        or item.get("file_url", "")
                    )
                    if image_url:
                        doc.append("product_images", {
                            "image": image_url,
                            "alt_text": item.get("alt_text", item.get("caption", "")),
                            "sort_order": item.get("sort_order", idx),
                            "is_primary": item.get("is_primary", 1 if idx == 0 else 0),
                            "image_angle": item.get("image_angle", item.get("angle", "")),
                            "channel": item.get("channel", item.get("sales_channel", "")),
                        })

            if doc.product_images:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("SKU Product Migration Error"),
                message=_("Error migrating images for SKU Product {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Listing Variant: images -> Listing Variant Image (variant_images)
# ---------------------------------------------------------------------------

def migrate_listing_variant_images():
    """
    Migrate Listing Variant.images JSON to Listing Variant Image child table.

    Expected JSON format: list of image URL strings or list of dicts with
    image/url, alt_text, sort_order, is_primary, image_angle, channel.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Listing Variant", "images"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, images
        FROM `tabListing Variant`
        WHERE images IS NOT NULL
            AND images != ''
            AND images != '[]'
            AND images != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabListing Variant Image` lvi
                WHERE lvi.parent = `tabListing Variant`.name
                AND lvi.parenttype = 'Listing Variant'
                AND lvi.parentfield = 'variant_images'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.images)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Listing Variant", record.name)

            # Double-check idempotency
            if doc.get("variant_images") and len(doc.variant_images) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if isinstance(item, str):
                    # Simple string format: just the image URL
                    if item.strip():
                        doc.append("variant_images", {
                            "image": item.strip(),
                            "alt_text": "",
                            "sort_order": idx,
                            "is_primary": 1 if idx == 0 else 0,
                            "image_angle": "",
                            "channel": "",
                        })
                elif isinstance(item, dict):
                    image_url = (
                        item.get("image", "")
                        or item.get("url", "")
                        or item.get("file_url", "")
                    )
                    if image_url:
                        doc.append("variant_images", {
                            "image": image_url,
                            "alt_text": item.get("alt_text", item.get("caption", "")),
                            "sort_order": item.get("sort_order", idx),
                            "is_primary": item.get("is_primary", 1 if idx == 0 else 0),
                            "image_angle": item.get("image_angle", item.get("angle", "")),
                            "channel": item.get("channel", item.get("sales_channel", "")),
                        })

            if doc.variant_images:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Listing Variant Migration Error"),
                message=_("Error migrating images for Listing Variant {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Seller Balance: recent_transactions -> Seller Balance Transaction (transaction_records)
# ---------------------------------------------------------------------------

def migrate_seller_balance_transactions():
    """
    Migrate Seller Balance.recent_transactions JSON to Seller Balance Transaction child table.

    Expected JSON format: list of dicts with transaction_date, transaction_type,
    amount, running_balance, reference_type, reference_name, description.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Seller Balance", "recent_transactions"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, recent_transactions
        FROM `tabSeller Balance`
        WHERE recent_transactions IS NOT NULL
            AND recent_transactions != ''
            AND recent_transactions != '[]'
            AND recent_transactions != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabSeller Balance Transaction` sbt
                WHERE sbt.parent = `tabSeller Balance`.name
                AND sbt.parenttype = 'Seller Balance'
                AND sbt.parentfield = 'transaction_records'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.recent_transactions)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Seller Balance", record.name)

            # Double-check idempotency
            if doc.get("transaction_records") and len(doc.transaction_records) > 0:
                skipped += 1
                continue

            for item in data:
                if not isinstance(item, dict):
                    continue

                transaction_date = (
                    item.get("transaction_date", "")
                    or item.get("date", "")
                    or item.get("timestamp", "")
                )

                transaction_type = (
                    item.get("transaction_type", "")
                    or item.get("type", "")
                )

                if not transaction_date and not transaction_type:
                    continue

                doc.append("transaction_records", {
                    "transaction_date": transaction_date,
                    "transaction_type": transaction_type,
                    "amount": item.get("amount", 0),
                    "running_balance": item.get("running_balance", item.get("balance", 0)),
                    "reference_type": item.get("reference_type", item.get("ref_type", "")),
                    "reference_name": item.get("reference_name", item.get("ref_name", item.get("reference", ""))),
                    "description": item.get("description", item.get("remarks", item.get("notes", ""))),
                })

            if doc.transaction_records:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Seller Balance Migration Error"),
                message=_("Error migrating recent_transactions for Seller Balance {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Seller Score: special_achievements -> Seller Achievement (achievements)
# ---------------------------------------------------------------------------

def migrate_seller_score_achievements():
    """
    Migrate Seller Score.special_achievements JSON to Seller Achievement child table.

    Expected JSON format: list of achievement name strings or list of dicts with
    achievement_name, achievement_type, achieved_date, description, badge_icon.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Seller Score", "special_achievements"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, special_achievements
        FROM `tabSeller Score`
        WHERE special_achievements IS NOT NULL
            AND special_achievements != ''
            AND special_achievements != '[]'
            AND special_achievements != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabSeller Achievement` sa
                WHERE sa.parent = `tabSeller Score`.name
                AND sa.parenttype = 'Seller Score'
                AND sa.parentfield = 'achievements'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.special_achievements)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Seller Score", record.name)

            # Double-check idempotency
            if doc.get("achievements") and len(doc.achievements) > 0:
                skipped += 1
                continue

            for item in data:
                if isinstance(item, str):
                    # Simple string format: just the achievement name
                    if item.strip():
                        doc.append("achievements", {
                            "achievement_name": item.strip(),
                            "achievement_type": "",
                            "achieved_date": "",
                            "description": "",
                            "badge_icon": "",
                        })
                elif isinstance(item, dict):
                    achievement_name = (
                        item.get("achievement_name", "")
                        or item.get("name", "")
                        or item.get("title", "")
                    )
                    if achievement_name:
                        doc.append("achievements", {
                            "achievement_name": achievement_name,
                            "achievement_type": item.get("achievement_type", item.get("type", "")),
                            "achieved_date": item.get("achieved_date", item.get("date", "")),
                            "description": item.get("description", item.get("details", "")),
                            "badge_icon": item.get("badge_icon", item.get("icon", "")),
                        })

            if doc.achievements:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Seller Score Migration Error"),
                message=_("Error migrating special_achievements for Seller Score {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Seller Tier: custom_benefits -> Seller Tier Benefit (tier_benefits)
# ---------------------------------------------------------------------------

def migrate_seller_tier_benefits():
    """
    Migrate Seller Tier.custom_benefits JSON to Seller Tier Benefit child table.

    Expected JSON format: list of benefit name strings or list of dicts with
    benefit_name, benefit_type, benefit_value, is_active, description, sort_order.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Seller Tier", "custom_benefits"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, custom_benefits
        FROM `tabSeller Tier`
        WHERE custom_benefits IS NOT NULL
            AND custom_benefits != ''
            AND custom_benefits != '[]'
            AND custom_benefits != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabSeller Tier Benefit` stb
                WHERE stb.parent = `tabSeller Tier`.name
                AND stb.parenttype = 'Seller Tier'
                AND stb.parentfield = 'tier_benefits'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.custom_benefits)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Seller Tier", record.name)

            # Double-check idempotency
            if doc.get("tier_benefits") and len(doc.tier_benefits) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if isinstance(item, str):
                    # Simple string format: just the benefit name
                    if item.strip():
                        doc.append("tier_benefits", {
                            "benefit_name": item.strip(),
                            "benefit_type": "",
                            "benefit_value": "",
                            "is_active": 1,
                            "description": "",
                            "sort_order": idx,
                        })
                elif isinstance(item, dict):
                    benefit_name = (
                        item.get("benefit_name", "")
                        or item.get("name", "")
                        or item.get("title", "")
                    )
                    if benefit_name:
                        doc.append("tier_benefits", {
                            "benefit_name": benefit_name,
                            "benefit_type": item.get("benefit_type", item.get("type", "")),
                            "benefit_value": item.get("benefit_value", item.get("value", "")),
                            "is_active": item.get("is_active", 1),
                            "description": item.get("description", item.get("details", "")),
                            "sort_order": item.get("sort_order", idx),
                        })

            if doc.tier_benefits:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Seller Tier Migration Error"),
                message=_("Error migrating custom_benefits for Seller Tier {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors
