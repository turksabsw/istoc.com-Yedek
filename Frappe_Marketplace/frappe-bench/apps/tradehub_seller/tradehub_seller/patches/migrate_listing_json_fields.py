# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate Listing JSON Fields to Child Tables.

This patch migrates data from deprecated JSON fields to new child table structures
for the Listing DocType:

- Listing: attributes -> Listing Attribute Value (attribute_values)
- Listing: images -> Listing Image (listing_images)
- Listing: bulk_pricing_tiers -> Listing Bulk Pricing Tier (pricing_tiers)

IMPORTANT: Child DocTypes ALREADY EXIST — this patch only migrates data.
This patch is idempotent. It skips records that already have
child table rows for the corresponding table field.
"""

import json

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates JSON field data to child table rows for Listing DocType.
    """
    # Reload all child DocTypes to ensure schema is up to date
    reload_child_doctypes()

    # Reload parent DocType
    reload_parent_doctypes()

    total_migrated = 0
    total_skipped = 0
    total_errors = 0

    # Migrate each JSON field
    migrations = [
        ("Listing attributes", migrate_listing_attributes),
        ("Listing images", migrate_listing_images),
        ("Listing bulk_pricing_tiers", migrate_listing_bulk_pricing_tiers),
    ]

    for migration_name, migration_func in migrations:
        try:
            migrated, skipped, errors = migration_func()
            total_migrated += migrated
            total_skipped += skipped
            total_errors += errors
        except Exception as e:
            frappe.log_error(
                title=_("Migration Error: {0}").format(migration_name),
                message=_("Unexpected error migrating {0}: {1}").format(
                    migration_name, str(e)
                )
            )
            total_errors += 1

    if total_migrated > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Listing JSON Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_child_doctypes():
    """Reload all child DocTypes to ensure database schema is current."""
    child_doctypes = [
        "listing_attribute_value",
        "listing_image",
        "listing_bulk_pricing_tier",
    ]
    for dt in child_doctypes:
        frappe.reload_doc("tradehub_seller", "doctype", dt)


def reload_parent_doctypes():
    """Reload parent DocType to ensure it has the new Table fields."""
    frappe.reload_doc("tradehub_seller", "doctype", "listing")


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
# Listing: attributes -> Listing Attribute Value (attribute_values)
# ---------------------------------------------------------------------------

def migrate_listing_attributes():
    """
    Migrate Listing.attributes JSON to Listing Attribute Value child table.

    Expected JSON format: list of dicts with attribute/attribute_name, value,
    value_label, unit, sort_order, is_variant_attribute.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Listing", "attributes"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, attributes
        FROM `tabListing`
        WHERE attributes IS NOT NULL
            AND attributes != ''
            AND attributes != '[]'
            AND attributes != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabListing Attribute Value` lav
                WHERE lav.parent = `tabListing`.name
                AND lav.parenttype = 'Listing'
                AND lav.parentfield = 'attribute_values'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.attributes)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Listing", record.name)

            # Double-check idempotency
            if doc.get("attribute_values") and len(doc.attribute_values) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if not isinstance(item, dict):
                    continue

                attribute = (
                    item.get("attribute", "")
                    or item.get("attribute_link", "")
                )

                attribute_name = (
                    item.get("attribute_name", "")
                    or item.get("name", "")
                    or item.get("label", "")
                )

                value = (
                    item.get("value", "")
                    or item.get("attribute_value", "")
                )

                if not value and not attribute and not attribute_name:
                    continue

                doc.append("attribute_values", {
                    "attribute": attribute,
                    "attribute_name": attribute_name,
                    "value": value,
                    "value_label": item.get("value_label", item.get("display_label", "")),
                    "unit": item.get("unit", item.get("uom", "")),
                    "sort_order": item.get("sort_order", idx),
                    "is_variant_attribute": item.get("is_variant_attribute", item.get("is_variant", 0)),
                })

            if doc.attribute_values:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Listing Attribute Migration Error"),
                message=_("Error migrating attributes for Listing {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Listing: images -> Listing Image (listing_images)
# ---------------------------------------------------------------------------

def migrate_listing_images():
    """
    Migrate Listing.images JSON to Listing Image child table.

    Expected JSON format: list of image URL strings or list of dicts with
    image/url, alt_text, sort_order, is_primary, image_angle, channel.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Listing", "images"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, images
        FROM `tabListing`
        WHERE images IS NOT NULL
            AND images != ''
            AND images != '[]'
            AND images != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabListing Image` li
                WHERE li.parent = `tabListing`.name
                AND li.parenttype = 'Listing'
                AND li.parentfield = 'listing_images'
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

            doc = frappe.get_doc("Listing", record.name)

            # Double-check idempotency
            if doc.get("listing_images") and len(doc.listing_images) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if isinstance(item, str):
                    # Simple string format: just the image URL
                    if item.strip():
                        doc.append("listing_images", {
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
                        doc.append("listing_images", {
                            "image": image_url,
                            "alt_text": item.get("alt_text", item.get("caption", "")),
                            "sort_order": item.get("sort_order", idx),
                            "is_primary": item.get("is_primary", 1 if idx == 0 else 0),
                            "image_angle": item.get("image_angle", item.get("angle", "")),
                            "channel": item.get("channel", item.get("sales_channel", "")),
                        })

            if doc.listing_images:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Listing Image Migration Error"),
                message=_("Error migrating images for Listing {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Listing: bulk_pricing_tiers -> Listing Bulk Pricing Tier (pricing_tiers)
# ---------------------------------------------------------------------------

def migrate_listing_bulk_pricing_tiers():
    """
    Migrate Listing.bulk_pricing_tiers JSON to Listing Bulk Pricing Tier child table.

    Expected JSON format: list of dicts with min_qty, max_qty, price,
    discount_percentage, description, is_active.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Listing", "bulk_pricing_tiers"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, bulk_pricing_tiers
        FROM `tabListing`
        WHERE bulk_pricing_tiers IS NOT NULL
            AND bulk_pricing_tiers != ''
            AND bulk_pricing_tiers != '[]'
            AND bulk_pricing_tiers != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabListing Bulk Pricing Tier` lbpt
                WHERE lbpt.parent = `tabListing`.name
                AND lbpt.parenttype = 'Listing'
                AND lbpt.parentfield = 'pricing_tiers'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.bulk_pricing_tiers)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Listing", record.name)

            # Double-check idempotency
            if doc.get("pricing_tiers") and len(doc.pricing_tiers) > 0:
                skipped += 1
                continue

            for item in data:
                if not isinstance(item, dict):
                    continue

                min_qty = item.get("min_qty", item.get("minimum_quantity", 0))
                price = (
                    item.get("price", 0)
                    or item.get("unit_price", 0)
                    or item.get("tier_price", 0)
                )

                if not min_qty and not price:
                    continue

                doc.append("pricing_tiers", {
                    "min_qty": min_qty,
                    "max_qty": item.get("max_qty", item.get("maximum_quantity", 0)),
                    "price": price,
                    "discount_percentage": item.get("discount_percentage", item.get("discount", 0)),
                    "description": item.get("description", item.get("tier_description", "")),
                    "is_active": item.get("is_active", 1),
                })

            if doc.pricing_tiers:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Listing Bulk Pricing Migration Error"),
                message=_("Error migrating bulk_pricing_tiers for Listing {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors
