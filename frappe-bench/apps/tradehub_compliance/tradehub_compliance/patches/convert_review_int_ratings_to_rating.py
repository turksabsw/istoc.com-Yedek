# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Convert Review Sub-Rating Int Values to Frappe Rating (0-1) Scale.

The Review DocType has 5 sub-rating fields that were originally stored as Int (1-5).
These fields have been changed to the Frappe Rating fieldtype which uses a 0-1 scale.

This patch divides all non-zero values by 5.0 to convert:
    5 -> 1.0
    4 -> 0.8
    3 -> 0.6
    2 -> 0.4
    1 -> 0.2
    0 -> 0 (unchanged)

Fields migrated:
    - product_quality_rating
    - value_for_money_rating
    - shipping_rating
    - seller_communication_rating
    - accuracy_rating

IMPORTANT: Uses a single UPDATE per field (SET field = field / 5.0 WHERE field > 0).
Do NOT use a two-step approach as it would corrupt data — e.g., 5/5.0=1.0 would then
be incorrectly matched by a WHERE field=1 query intended for original Int value 1.

IMPORTANT: This patch is idempotent only on first run. Already-migrated values
(0.2-1.0) divided again would produce incorrect results. The patch checks whether
values > 1 exist before running, to guard against re-execution.
"""

import frappe
from frappe import _


# The 5 sub-rating fields to migrate
RATING_FIELDS = [
    "product_quality_rating",
    "value_for_money_rating",
    "shipping_rating",
    "seller_communication_rating",
    "accuracy_rating",
]


def execute():
    """
    Main entry point for the migration patch.

    Converts Review sub-rating Int values (1-5) to Rating scale (0.2-1.0)
    by dividing all non-zero values by 5.0.
    """
    # Reload Review DocType to ensure the fieldtype change (Int -> Rating) is applied
    frappe.reload_doc("tradehub_compliance", "doctype", "review")

    # Check if tabReview table exists
    if not frappe.db.table_exists("tabReview"):
        return

    # Guard against re-execution: if no values > 1 exist, migration was already done
    needs_migration = check_needs_migration()
    if not needs_migration:
        frappe.log_error(
            title=_("Rating Migration Skip"),
            message=_("Review sub-rating fields already appear migrated (no values > 1). Skipping.")
        )
        return

    migrated_count = 0

    for field in RATING_FIELDS:
        try:
            count = migrate_rating_field(field)
            migrated_count += count
        except Exception as e:
            frappe.log_error(
                title=_("Rating Migration Error"),
                message=_("Error migrating {0}: {1}").format(field, str(e))
            )

    if migrated_count > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Rating Migration Complete"),
        message=_("Converted {0} Review sub-rating values across {1} fields from Int (1-5) to Rating (0.2-1.0)").format(
            migrated_count, len(RATING_FIELDS)
        )
    )


def check_needs_migration():
    """
    Check whether any of the 5 rating fields still contain Int-scale values (> 1).

    Returns:
        bool: True if migration is needed, False if already migrated.
    """
    for field in RATING_FIELDS:
        if not frappe.db.has_column("Review", field):
            continue

        count = frappe.db.sql(
            """
            SELECT COUNT(*) FROM `tabReview`
            WHERE `{field}` > 1
            """.format(field=field)
        )[0][0]

        if count > 0:
            return True

    return False


def migrate_rating_field(field):
    """
    Migrate a single rating field from Int scale (1-5) to Rating scale (0.2-1.0).

    Uses a single UPDATE statement: SET field = field / 5.0 WHERE field > 0.

    Args:
        field: The fieldname to migrate.

    Returns:
        int: Number of rows updated.
    """
    if not frappe.db.has_column("Review", field):
        frappe.log_error(
            title=_("Rating Migration Skip"),
            message=_("Review does not have column {0}. Skipping.").format(field)
        )
        return 0

    # Count rows that will be affected (for logging)
    affected = frappe.db.sql(
        """
        SELECT COUNT(*) FROM `tabReview`
        WHERE `{field}` > 0
        """.format(field=field)
    )[0][0]

    if affected == 0:
        return 0

    # Single UPDATE: divide all non-zero values by 5.0
    frappe.db.sql(
        """
        UPDATE `tabReview`
        SET `{field}` = `{field}` / 5.0
        WHERE `{field}` > 0
        """.format(field=field)
    )

    return affected
