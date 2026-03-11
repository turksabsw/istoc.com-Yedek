# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Backfill condition field for PIM Product and Listing records.

This patch populates the new generic `condition` field on PIM Product and Listing
records that have NULL or empty condition values:

1. PIM Product records with an existing `amazon_condition` value get their
   `condition` field set using a REVERSE_AMAZON_MAP that converts Amazon-specific
   condition labels to the new generic condition options.

2. All remaining PIM Product and Listing records with NULL/empty `condition`
   are set to 'New' (the default value).

3. DB indexes are added on the Listing table:
   - Individual indexes on `condition` and `country_of_origin` (if not already
     present via search_index in field definition)
   - Composite index on (condition, country_of_origin) for filtered queries

IMPORTANT: This patch is idempotent. It only updates records where `condition`
is NULL or empty, and checks for existing indexes before creating them.
"""

import frappe
from frappe import _


# Maps Amazon-specific condition values → generic condition values.
# Amazon options: New, Refurbished, Used - Like New, Used - Very Good,
#   Used - Good, Used - Acceptable, Collectible - Like New,
#   Collectible - Very Good, Collectible - Good, Collectible - Acceptable
#
# Generic options: New, New with Defects, Refurbished, Renewed,
#   Used - Like New, Used - Good, Used - Acceptable, For Parts or Not Working
REVERSE_AMAZON_MAP = {
    "New": "New",
    "Refurbished": "Refurbished",
    "Used - Like New": "Used - Like New",
    "Used - Very Good": "Used - Good",
    "Used - Good": "Used - Good",
    "Used - Acceptable": "Used - Acceptable",
    "Collectible - Like New": "Used - Like New",
    "Collectible - Very Good": "Used - Good",
    "Collectible - Good": "Used - Good",
    "Collectible - Acceptable": "Used - Acceptable",
}


def execute():
    """
    Main entry point for the backfill patch.

    Backfills the `condition` field on PIM Product (using amazon_condition
    mapping when available) and Listing (defaulting to 'New'), then adds
    DB indexes on the Listing table.
    """
    # Reload DocTypes to ensure schema is up to date
    reload_doctypes()

    # Step 1: Backfill PIM Product records using amazon_condition mapping
    pim_mapped = backfill_pim_product_from_amazon_condition()

    # Step 2: Backfill remaining PIM Product records with default 'New'
    pim_defaulted = backfill_pim_product_default()

    # Step 3: Backfill Listing records with default 'New'
    listing_defaulted = backfill_listing_default()

    # Step 4: Add DB indexes on Listing table
    indexes_added = add_listing_indexes()

    total_updated = pim_mapped + pim_defaulted + listing_defaulted

    if total_updated > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Condition Field Backfill Complete"),
        message=_(
            "PIM Product mapped from amazon_condition: {0}, "
            "PIM Product defaulted to 'New': {1}, "
            "Listing defaulted to 'New': {2}, "
            "Indexes added: {3}"
        ).format(pim_mapped, pim_defaulted, listing_defaulted, indexes_added)
    )


def reload_doctypes():
    """Reload relevant DocTypes to ensure database schema is current."""
    frappe.reload_doc("tradehub_catalog", "doctype", "pim_product")

    # Listing is in tradehub_seller module
    try:
        frappe.reload_doc("tradehub_seller", "doctype", "listing")
    except Exception:
        # Listing DocType may not be available if tradehub_seller is not installed
        pass


def backfill_pim_product_from_amazon_condition():
    """
    Backfill PIM Product.condition from amazon_condition using REVERSE_AMAZON_MAP.

    Only updates records where:
    - condition is NULL or empty
    - amazon_condition has a non-empty value
    - amazon_condition value exists in REVERSE_AMAZON_MAP

    Returns:
        int: Number of PIM Product records updated via mapping.
    """
    if not frappe.db.table_exists("tabPIM Product"):
        return 0

    if not frappe.db.has_column("PIM Product", "condition"):
        return 0

    if not frappe.db.has_column("PIM Product", "amazon_condition"):
        return 0

    # Get PIM Products with amazon_condition but no generic condition
    records = frappe.db.sql(
        """
        SELECT name, amazon_condition
        FROM `tabPIM Product`
        WHERE (condition IS NULL OR condition = '')
            AND amazon_condition IS NOT NULL
            AND amazon_condition != ''
        """,
        as_dict=True
    )

    if not records:
        return 0

    mapped = 0

    for record in records:
        try:
            amazon_val = record.amazon_condition
            generic_condition = REVERSE_AMAZON_MAP.get(amazon_val)

            if not generic_condition:
                # Unknown amazon_condition value — skip mapping, will be
                # caught by the default backfill in the next step
                continue

            frappe.db.set_value(
                "PIM Product", record.name, "condition", generic_condition,
                update_modified=False
            )
            mapped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Condition Backfill Error"),
                message=_("Error mapping amazon_condition for PIM Product {0}: {1}").format(
                    record.name, str(e)
                )
            )

    return mapped


def backfill_pim_product_default():
    """
    Set condition='New' for all PIM Product records with NULL/empty condition.

    This catches records that were not mapped from amazon_condition (either
    because they had no amazon_condition or their value was not in the map).

    Returns:
        int: Number of PIM Product records updated.
    """
    if not frappe.db.table_exists("tabPIM Product"):
        return 0

    if not frappe.db.has_column("PIM Product", "condition"):
        return 0

    # Bulk update for efficiency — all remaining NULL/empty condition → 'New'
    result = frappe.db.sql(
        """
        UPDATE `tabPIM Product`
        SET `condition` = 'New'
        WHERE `condition` IS NULL OR `condition` = ''
        """
    )

    # Get the count of affected rows
    updated = frappe.db.sql(
        """SELECT ROW_COUNT()"""
    )
    count = updated[0][0] if updated and updated[0] else 0

    return count


def backfill_listing_default():
    """
    Set condition='New' for all Listing records with NULL/empty condition.

    Listing does not have an amazon_condition field, so all records without
    a condition value are defaulted to 'New'.

    Returns:
        int: Number of Listing records updated.
    """
    if not frappe.db.table_exists("tabListing"):
        return 0

    if not frappe.db.has_column("Listing", "condition"):
        return 0

    # Bulk update for efficiency
    frappe.db.sql(
        """
        UPDATE `tabListing`
        SET `condition` = 'New'
        WHERE `condition` IS NULL OR `condition` = ''
        """
    )

    # Get the count of affected rows
    updated = frappe.db.sql(
        """SELECT ROW_COUNT()"""
    )
    count = updated[0][0] if updated and updated[0] else 0

    return count


def add_listing_indexes():
    """
    Add DB indexes on the Listing table for condition and country_of_origin.

    Creates:
    - Individual index on `condition` (if not present)
    - Individual index on `country_of_origin` (if not present)
    - Composite index on (`condition`, `country_of_origin`)

    These indexes improve query performance for filtered listing searches.

    Returns:
        int: Number of indexes added.
    """
    if not frappe.db.table_exists("tabListing"):
        return 0

    added = 0

    # Individual index on condition
    if not index_exists("tabListing", "idx_listing_condition"):
        try:
            frappe.db.sql(
                """
                CREATE INDEX `idx_listing_condition`
                ON `tabListing` (`condition`)
                """
            )
            added += 1
        except Exception:
            # Index may already exist under a different name (e.g., search_index)
            pass

    # Individual index on country_of_origin
    if not index_exists("tabListing", "idx_listing_country_of_origin"):
        try:
            frappe.db.sql(
                """
                CREATE INDEX `idx_listing_country_of_origin`
                ON `tabListing` (`country_of_origin`)
                """
            )
            added += 1
        except Exception:
            # Index may already exist under a different name
            pass

    # Composite index on (condition, country_of_origin)
    if not index_exists("tabListing", "idx_listing_condition_country"):
        try:
            frappe.db.sql(
                """
                CREATE INDEX `idx_listing_condition_country`
                ON `tabListing` (`condition`, `country_of_origin`)
                """
            )
            added += 1
        except Exception:
            pass

    if added > 0:
        frappe.db.commit()

    return added


def index_exists(table_name, index_name):
    """
    Check if an index with the given name exists on the specified table.

    Args:
        table_name: The database table name (e.g., 'tabListing').
        index_name: The index name to check for.

    Returns:
        bool: True if the index exists.
    """
    result = frappe.db.sql(
        """
        SHOW INDEX FROM `{table}`
        WHERE Key_name = %s
        """.format(table=table_name),
        (index_name,),
        as_dict=True
    )
    return len(result) > 0
