# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate tradehub_logistics JSON Fields to Child Tables.

This patch migrates data from deprecated JSON fields to new child table structures
across the following DocTypes:

- Shipment: tracking_events -> Shipment Tracking Event (tracking_events_table)

Expected JSON format for tracking_events: list of dicts with event_timestamp,
event_status, event_type, event_description, location, is_exception.
Also handles list of strings (event descriptions) gracefully.

IMPORTANT: This patch is idempotent. It skips records that already have
child table rows for the corresponding table field.
"""

import json

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates JSON field data to child table rows for all tradehub_logistics DocTypes.
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
        ("Shipment", migrate_shipment_tracking_events),
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
        title=_("Logistics JSON Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_child_doctypes():
    """Reload all new child DocTypes to ensure database schema is current."""
    child_doctypes = [
        "shipment_tracking_event",
    ]
    for dt in child_doctypes:
        frappe.reload_doc("tradehub_logistics", "doctype", dt)


def reload_parent_doctypes():
    """Reload parent DocTypes to ensure they have the new Table fields."""
    parent_doctypes = [
        "shipment",
    ]
    for dt in parent_doctypes:
        frappe.reload_doc("tradehub_logistics", "doctype", dt)


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
# Shipment: tracking_events -> Shipment Tracking Event (tracking_events_table)
# ---------------------------------------------------------------------------

def migrate_shipment_tracking_events():
    """
    Migrate Shipment.tracking_events JSON to Shipment Tracking Event child table.

    Expected JSON format: list of dicts with event_timestamp, event_status,
    event_type, event_description, location, is_exception.
    Also handles list of strings (treated as event descriptions).

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Shipment", "tracking_events"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, tracking_events
        FROM `tabShipment`
        WHERE tracking_events IS NOT NULL
            AND tracking_events != ''
            AND tracking_events != '[]'
            AND tracking_events != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabShipment Tracking Event` ste
                WHERE ste.parent = `tabShipment`.name
                AND ste.parenttype = 'Shipment'
                AND ste.parentfield = 'tracking_events_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.tracking_events)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Shipment", record.name)

            # Double-check idempotency
            if doc.get("tracking_events_table") and len(doc.tracking_events_table) > 0:
                skipped += 1
                continue

            for item in data:
                if isinstance(item, str):
                    # Simple string format: treat as event description
                    if item.strip():
                        doc.append("tracking_events_table", {
                            "event_timestamp": "",
                            "event_status": "",
                            "event_type": "",
                            "event_description": item.strip(),
                            "location": "",
                            "is_exception": 0,
                        })
                elif isinstance(item, dict):
                    event_timestamp = (
                        item.get("event_timestamp", "")
                        or item.get("timestamp", "")
                        or item.get("date", "")
                        or item.get("datetime", "")
                    )

                    event_status = (
                        item.get("event_status", "")
                        or item.get("status", "")
                    )

                    event_description = (
                        item.get("event_description", "")
                        or item.get("description", "")
                        or item.get("details", "")
                        or item.get("message", "")
                    )

                    # Skip items with no meaningful data
                    if not event_timestamp and not event_status and not event_description:
                        continue

                    doc.append("tracking_events_table", {
                        "event_timestamp": event_timestamp,
                        "event_status": event_status,
                        "event_type": item.get("event_type", item.get("type", "")),
                        "event_description": event_description,
                        "location": item.get("location", item.get("city", item.get("facility", ""))),
                        "is_exception": item.get("is_exception", 0),
                    })

            if doc.tracking_events_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Shipment Migration Error"),
                message=_("Error migrating tracking_events for Shipment {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors
