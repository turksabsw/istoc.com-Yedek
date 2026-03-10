# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate tradehub_compliance JSON Fields to Child Tables.

This patch migrates data from deprecated JSON fields to new child table structures
across the following DocTypes:

- Message: attachments -> Message Attachment (attachments_table)
- Moderation Case:
    - related_cases -> Moderation Case Link (related_cases_table)
    - moderation_history -> Moderation Action Log (moderation_history_table)
- Review:
    - images -> Review Image (images_table)
    - flags -> Review Flag (flags_table)
- Certificate: additional_documents -> Certificate Document (additional_documents_table)

IMPORTANT: This patch is idempotent. It skips records that already have
child table rows for the corresponding table field.
"""

import json

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates JSON field data to child table rows for all tradehub_compliance DocTypes.
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
        ("Message", migrate_message_attachments),
        ("Moderation Case", migrate_moderation_case),
        ("Review", migrate_review),
        ("Certificate", migrate_certificate_additional_documents),
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
        title=_("Compliance JSON Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_child_doctypes():
    """Reload all new child DocTypes to ensure database schema is current."""
    child_doctypes = [
        "message_attachment",
        "moderation_case_link",
        "moderation_action_log",
        "review_image",
        "review_flag",
        "certificate_document",
    ]
    for dt in child_doctypes:
        frappe.reload_doc("tradehub_compliance", "doctype", dt)


def reload_parent_doctypes():
    """Reload parent DocTypes to ensure they have the new Table fields."""
    parent_doctypes = [
        "message",
        "moderation_case",
        "review",
        "certificate",
    ]
    for dt in parent_doctypes:
        frappe.reload_doc("tradehub_compliance", "doctype", dt)


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


def has_child_rows(parent_doctype, parent_name, child_doctype, child_table_fieldname):
    """
    Check if a parent document already has rows in a specific child table.

    Args:
        parent_doctype: The parent DocType name.
        parent_name: The parent document name.
        child_doctype: The child DocType name.
        child_table_fieldname: The parentfield name of the child table.

    Returns:
        bool: True if child rows exist.
    """
    count = frappe.db.count(
        child_doctype,
        filters={
            "parent": parent_name,
            "parenttype": parent_doctype,
            "parentfield": child_table_fieldname,
        }
    )
    return count > 0


# ---------------------------------------------------------------------------
# Message: attachments -> Message Attachment
# ---------------------------------------------------------------------------

def migrate_message_attachments():
    """
    Migrate Message.attachments JSON to Message Attachment child table.

    Expected JSON format: list of dicts with file/file_url, file_name, file_type, file_size.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Message", "attachments"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, attachments
        FROM `tabMessage`
        WHERE attachments IS NOT NULL
            AND attachments != ''
            AND attachments != '[]'
            AND attachments != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabMessage Attachment` ma
                WHERE ma.parent = `tabMessage`.name
                AND ma.parenttype = 'Message'
                AND ma.parentfield = 'attachments_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.attachments)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Message", record.name)

            # Double-check idempotency
            if doc.get("attachments_table") and len(doc.attachments_table) > 0:
                skipped += 1
                continue

            for item in data:
                if isinstance(item, str):
                    # Simple string format: just the file URL
                    if item.strip():
                        doc.append("attachments_table", {
                            "file": item.strip(),
                            "file_name": "",
                            "file_type": "",
                            "file_size": 0,
                        })
                elif isinstance(item, dict):
                    file_url = item.get("file", "") or item.get("file_url", "") or item.get("url", "")
                    if file_url:
                        doc.append("attachments_table", {
                            "file": file_url,
                            "file_name": item.get("file_name", item.get("name", "")),
                            "file_type": item.get("file_type", item.get("type", item.get("content_type", ""))),
                            "file_size": item.get("file_size", item.get("size", 0)),
                        })

            if doc.attachments_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Message Migration Error"),
                message=_("Error migrating attachments for Message {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Moderation Case: related_cases + moderation_history -> child tables
# ---------------------------------------------------------------------------

def migrate_moderation_case():
    """
    Migrate Moderation Case JSON fields to child tables.

    Fields:
    - related_cases -> related_cases_table (Moderation Case Link)
    - moderation_history -> moderation_history_table (Moderation Action Log)

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    # Check at least one legacy field exists
    has_any_field = False
    for field in ["related_cases", "moderation_history"]:
        if frappe.db.has_column("Moderation Case", field):
            has_any_field = True
            break

    if not has_any_field:
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name,
            related_cases, moderation_history
        FROM `tabModeration Case`
        WHERE (
            (related_cases IS NOT NULL AND related_cases != '' AND related_cases != '[]' AND related_cases != 'null')
            OR (moderation_history IS NOT NULL AND moderation_history != '' AND moderation_history != '[]' AND moderation_history != 'null')
        )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Moderation Case", record.name)
            any_migrated = False

            # Migrate related_cases
            any_migrated |= _migrate_related_cases(doc, record)

            # Migrate moderation_history
            any_migrated |= _migrate_moderation_history(doc, record)

            if any_migrated:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Moderation Case Migration Error"),
                message=_("Error migrating Moderation Case {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


def _migrate_related_cases(doc, record):
    """
    Migrate Moderation Case.related_cases JSON to Moderation Case Link child table.

    Expected JSON format: list of case name strings or list of dicts with
    'linked_case'/'case'/'name' and optional 'relation_type' keys.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get("related_cases_table") and len(doc.related_cases_table) > 0:
        return False

    data = parse_json_field(record.get("related_cases"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if isinstance(item, str):
            # Simple string format: just the case name/ID
            if item.strip():
                doc.append("related_cases_table", {
                    "linked_case": item.strip(),
                    "relation_type": "Related To",
                })
                added = True
        elif isinstance(item, dict):
            linked_case = (
                item.get("linked_case", "")
                or item.get("case", "")
                or item.get("name", "")
            )
            if linked_case:
                doc.append("related_cases_table", {
                    "linked_case": linked_case,
                    "relation_type": item.get("relation_type", "Related To"),
                })
                added = True

    return added


def _migrate_moderation_history(doc, record):
    """
    Migrate Moderation Case.moderation_history JSON to Moderation Action Log child table.

    Expected JSON format: list of dicts with action_date, action_type, action_by,
    previous_status, new_status, details.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get("moderation_history_table") and len(doc.moderation_history_table) > 0:
        return False

    data = parse_json_field(record.get("moderation_history"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if not isinstance(item, dict):
            continue

        action_date = (
            item.get("action_date", "")
            or item.get("date", "")
            or item.get("timestamp", "")
        )

        action_type = (
            item.get("action_type", "")
            or item.get("type", "")
            or item.get("action", "")
        )

        if not action_date and not action_type:
            continue

        doc.append("moderation_history_table", {
            "action_date": action_date,
            "action_type": action_type,
            "action_by": item.get("action_by", item.get("user", "")),
            "previous_status": item.get("previous_status", item.get("from_status", "")),
            "new_status": item.get("new_status", item.get("to_status", "")),
            "details": item.get("details", item.get("notes", item.get("comment", ""))),
        })
        added = True

    return added


# ---------------------------------------------------------------------------
# Review: images + flags -> child tables
# ---------------------------------------------------------------------------

def migrate_review():
    """
    Migrate Review JSON fields to child tables.

    Fields:
    - images -> images_table (Review Image)
    - flags -> flags_table (Review Flag)

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    # Check at least one legacy field exists
    has_any_field = False
    for field in ["images", "flags"]:
        if frappe.db.has_column("Review", field):
            has_any_field = True
            break

    if not has_any_field:
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name,
            images, flags
        FROM `tabReview`
        WHERE (
            (images IS NOT NULL AND images != '' AND images != '[]' AND images != 'null')
            OR (flags IS NOT NULL AND flags != '' AND flags != '[]' AND flags != 'null')
        )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Review", record.name)
            any_migrated = False

            # Migrate images
            any_migrated |= _migrate_review_images(doc, record)

            # Migrate flags
            any_migrated |= _migrate_review_flags(doc, record)

            if any_migrated:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Review Migration Error"),
                message=_("Error migrating Review {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


def _migrate_review_images(doc, record):
    """
    Migrate Review.images JSON to Review Image child table.

    Expected JSON format: list of image URL strings or list of dicts with
    'image'/'url', 'alt_text', 'sort_order'.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get("images_table") and len(doc.images_table) > 0:
        return False

    data = parse_json_field(record.get("images"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for idx, item in enumerate(data):
        if isinstance(item, str):
            # Simple string format: just the image URL
            if item.strip():
                doc.append("images_table", {
                    "image": item.strip(),
                    "alt_text": "",
                    "sort_order": idx,
                })
                added = True
        elif isinstance(item, dict):
            image_url = (
                item.get("image", "")
                or item.get("url", "")
                or item.get("file_url", "")
            )
            if image_url:
                doc.append("images_table", {
                    "image": image_url,
                    "alt_text": item.get("alt_text", item.get("caption", "")),
                    "sort_order": item.get("sort_order", idx),
                })
                added = True

    return added


def _migrate_review_flags(doc, record):
    """
    Migrate Review.flags JSON to Review Flag child table.

    Expected JSON format: list of dicts with flag_type, flagged_by, flagged_at,
    description, is_resolved, resolved_at.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get("flags_table") and len(doc.flags_table) > 0:
        return False

    data = parse_json_field(record.get("flags"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if not isinstance(item, dict):
            continue

        flag_type = (
            item.get("flag_type", "")
            or item.get("type", "")
            or item.get("reason", "")
        )

        if not flag_type:
            continue

        doc.append("flags_table", {
            "flag_type": flag_type,
            "flagged_by": item.get("flagged_by", item.get("user", "")),
            "flagged_at": item.get("flagged_at", item.get("date", item.get("timestamp", ""))),
            "description": item.get("description", item.get("details", item.get("notes", ""))),
            "is_resolved": item.get("is_resolved", 0),
            "resolved_at": item.get("resolved_at", ""),
        })
        added = True

    return added


# ---------------------------------------------------------------------------
# Certificate: additional_documents -> Certificate Document
# ---------------------------------------------------------------------------

def migrate_certificate_additional_documents():
    """
    Migrate Certificate.additional_documents to Certificate Document child table.

    The source field is Text type, so it may contain JSON or plain text.
    Expected JSON format: list of dicts with document/file/url, document_name,
    document_type, description, sort_order.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Certificate", "additional_documents"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, additional_documents
        FROM `tabCertificate`
        WHERE additional_documents IS NOT NULL
            AND additional_documents != ''
            AND additional_documents != '[]'
            AND additional_documents != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabCertificate Document` cd
                WHERE cd.parent = `tabCertificate`.name
                AND cd.parenttype = 'Certificate'
                AND cd.parentfield = 'additional_documents_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.additional_documents)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Certificate", record.name)

            # Double-check idempotency
            if doc.get("additional_documents_table") and len(doc.additional_documents_table) > 0:
                skipped += 1
                continue

            for idx, item in enumerate(data):
                if isinstance(item, str):
                    # Simple string format: just the document URL
                    if item.strip():
                        doc.append("additional_documents_table", {
                            "document": item.strip(),
                            "document_name": "",
                            "document_type": "",
                            "description": "",
                            "sort_order": idx,
                        })
                elif isinstance(item, dict):
                    document_url = (
                        item.get("document", "")
                        or item.get("file", "")
                        or item.get("file_url", "")
                        or item.get("url", "")
                    )
                    if document_url:
                        doc.append("additional_documents_table", {
                            "document": document_url,
                            "document_name": item.get("document_name", item.get("name", item.get("title", ""))),
                            "document_type": item.get("document_type", item.get("type", "")),
                            "description": item.get("description", item.get("notes", "")),
                            "sort_order": item.get("sort_order", idx),
                        })

            if doc.additional_documents_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Certificate Migration Error"),
                message=_("Error migrating additional_documents for Certificate {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors
