# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate discount_percentage to Cascading Discount Fields.

This patch migrates existing single-discount data to the new 3-tier cascading
discount system across the following DocTypes:

- Order: discount_percentage -> discount_1
- Sub Order: discount_percentage -> discount_1 (if column exists)
- Marketplace Order: discount_percentage -> discount_1 (if column exists)

The cascading discount formula (applied after migration):
    final = base * (1 - d1/100) * (1 - d2/100) * (1 - d3/100)

Since existing records only have a single discount, the value is copied to
discount_1 (the first tier), leaving discount_2 and discount_3 at their
default of 0. This preserves the original discount behavior exactly.

IMPORTANT: This patch is idempotent. It only updates records where
discount_percentage has a non-zero value AND discount_1 is NULL or 0.
"""

import frappe
from frappe import _
from frappe.utils import flt


def execute():
    """
    Main entry point for the migration patch.

    Copies discount_percentage values to discount_1 for all applicable
    tradehub_commerce DocTypes.
    """
    # Reload DocTypes FIRST to ensure new discount fields are available
    reload_doctypes()

    total_migrated = 0
    total_skipped = 0
    total_errors = 0

    # Migrate each DocType
    migrations = [
        ("Order", migrate_order_discount),
        ("Sub Order", migrate_sub_order_discount),
        ("Marketplace Order", migrate_marketplace_order_discount),
    ]

    for doctype_name, migration_func in migrations:
        try:
            migrated, skipped, errors = migration_func()
            total_migrated += migrated
            total_skipped += skipped
            total_errors += errors
        except Exception as e:
            frappe.log_error(
                title=_("Discount Migration Error: {0}").format(doctype_name),
                message=_("Unexpected error migrating {0}: {1}").format(
                    doctype_name, str(e)
                )
            )
            total_errors += 1

    if total_migrated > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Discount to Cascading Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_doctypes():
    """Reload parent DocTypes to ensure they have the new cascading discount fields."""
    parent_doctypes = [
        "order",
        "sub_order",
        "marketplace_order",
    ]
    for dt in parent_doctypes:
        frappe.reload_doc("tradehub_commerce", "doctype", dt)


# ---------------------------------------------------------------------------
# Order: discount_percentage -> discount_1
# ---------------------------------------------------------------------------

def migrate_order_discount():
    """
    Migrate Order.discount_percentage to Order.discount_1.

    Only processes records where discount_percentage is non-zero and
    discount_1 is NULL or 0 (idempotent).

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Order", "discount_percentage"):
        return 0, 0, 0

    if not frappe.db.has_column("Order", "discount_1"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, discount_percentage
        FROM `tabOrder`
        WHERE discount_percentage IS NOT NULL
            AND discount_percentage != 0
            AND (discount_1 IS NULL OR discount_1 = 0)
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Order", record.name)

            # Double-check idempotency
            if flt(doc.discount_1, 2) > 0:
                skipped += 1
                continue

            doc.discount_1 = flt(record.discount_percentage, 2)
            doc.flags.ignore_validate = True
            doc.flags.ignore_permissions = True
            doc.save()
            migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("Order Discount Migration Error"),
                message=_("Error migrating discount for Order {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Sub Order: discount_percentage -> discount_1
# ---------------------------------------------------------------------------

def migrate_sub_order_discount():
    """
    Migrate Sub Order.discount_percentage to Sub Order.discount_1.

    Only processes records where discount_percentage is non-zero and
    discount_1 is NULL or 0 (idempotent). Gracefully skips if the
    discount_percentage column does not exist.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Sub Order", "discount_percentage"):
        return 0, 0, 0

    if not frappe.db.has_column("Sub Order", "discount_1"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, discount_percentage
        FROM `tabSub Order`
        WHERE discount_percentage IS NOT NULL
            AND discount_percentage != 0
            AND (discount_1 IS NULL OR discount_1 = 0)
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Sub Order", record.name)

            # Double-check idempotency
            if flt(doc.discount_1, 2) > 0:
                skipped += 1
                continue

            doc.discount_1 = flt(record.discount_percentage, 2)
            doc.flags.ignore_validate = True
            doc.flags.ignore_permissions = True
            doc.save()
            migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("Sub Order Discount Migration Error"),
                message=_("Error migrating discount for Sub Order {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Marketplace Order: discount_percentage -> discount_1
# ---------------------------------------------------------------------------

def migrate_marketplace_order_discount():
    """
    Migrate Marketplace Order.discount_percentage to Marketplace Order.discount_1.

    Only processes records where discount_percentage is non-zero and
    discount_1 is NULL or 0 (idempotent). Gracefully skips if the
    discount_percentage column does not exist.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Marketplace Order", "discount_percentage"):
        return 0, 0, 0

    if not frappe.db.has_column("Marketplace Order", "discount_1"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, discount_percentage
        FROM `tabMarketplace Order`
        WHERE discount_percentage IS NOT NULL
            AND discount_percentage != 0
            AND (discount_1 IS NULL OR discount_1 = 0)
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Marketplace Order", record.name)

            # Double-check idempotency
            if flt(doc.discount_1, 2) > 0:
                skipped += 1
                continue

            doc.discount_1 = flt(record.discount_percentage, 2)
            doc.flags.ignore_validate = True
            doc.flags.ignore_permissions = True
            doc.save()
            migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("Marketplace Order Discount Migration Error"),
                message=_("Error migrating discount for Marketplace Order {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors
