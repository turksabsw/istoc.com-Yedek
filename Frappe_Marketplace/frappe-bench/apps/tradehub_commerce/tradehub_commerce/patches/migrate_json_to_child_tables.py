# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate tradehub_commerce JSON Fields to Child Tables.

This patch migrates data from deprecated JSON fields to new child table structures
across the following DocTypes:

- Cart: seller_summary -> Cart Seller Summary (seller_summary_table)
- Commission Rule:
    - restricted_sellers -> Commission Rule Seller (restricted_sellers_table, is_excluded=0)
    - excluded_sellers -> Commission Rule Seller (excluded_sellers_table, is_excluded=1)
    - restricted_categories -> Commission Rule Category (restricted_categories_table, is_excluded=0)
    - excluded_categories -> Commission Rule Category (excluded_categories_table, is_excluded=1)
    - override_by -> Commission Rule Override Role (override_by_table)
- Escrow Account: partial_releases -> Escrow Partial Release (partial_releases_table)
- Escrow Event: related_events -> Escrow Event Link (related_events_table)
- Marketplace Order: seller_summary -> Order Seller Summary (seller_summary_table)
- Order Event: related_events -> Order Event Link (related_events_table)
- Payment Intent:
    - installment_plan -> Payment Intent Installment (installment_plan_table)
    - partial_refunds -> Payment Refund (partial_refunds_table)
    - fraud_flags -> Payment Fraud Flag (fraud_flags_table)

IMPORTANT: This patch is idempotent. It skips records that already have
child table rows for the corresponding table field.
"""

import json

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates JSON field data to child table rows for all tradehub_commerce DocTypes.
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
        ("Cart", migrate_cart_seller_summary),
        ("Commission Rule", migrate_commission_rule),
        ("Escrow Account", migrate_escrow_account_partial_releases),
        ("Escrow Event", migrate_escrow_event_related_events),
        ("Marketplace Order", migrate_marketplace_order_seller_summary),
        ("Order Event", migrate_order_event_related_events),
        ("Payment Intent", migrate_payment_intent),
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
        title=_("Commerce JSON Migration Complete"),
        message=_("Migrated: {0}, Skipped: {1}, Errors: {2}").format(
            total_migrated, total_skipped, total_errors
        )
    )


def reload_child_doctypes():
    """Reload all new child DocTypes to ensure database schema is current."""
    child_doctypes = [
        "cart_seller_summary",
        "commission_rule_seller",
        "commission_rule_category",
        "commission_rule_override_role",
        "escrow_partial_release",
        "escrow_event_link",
        "order_seller_summary",
        "order_event_link",
        "payment_intent_installment",
        "payment_refund",
        "payment_fraud_flag",
    ]
    for dt in child_doctypes:
        frappe.reload_doc("tradehub_commerce", "doctype", dt)


def reload_parent_doctypes():
    """Reload parent DocTypes to ensure they have the new Table fields."""
    parent_doctypes = [
        "cart",
        "commission_rule",
        "escrow_account",
        "escrow_event",
        "marketplace_order",
        "order_event",
        "payment_intent",
    ]
    for dt in parent_doctypes:
        frappe.reload_doc("tradehub_commerce", "doctype", dt)


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
# Cart: seller_summary -> Cart Seller Summary
# ---------------------------------------------------------------------------

def migrate_cart_seller_summary():
    """
    Migrate Cart.seller_summary JSON to Cart Seller Summary child table.

    Expected JSON format: list of dicts with seller, seller_name, item_count, subtotal.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Cart", "seller_summary"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, seller_summary
        FROM `tabCart`
        WHERE seller_summary IS NOT NULL
            AND seller_summary != ''
            AND seller_summary != '[]'
            AND seller_summary != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabCart Seller Summary` css
                WHERE css.parent = `tabCart`.name
                AND css.parenttype = 'Cart'
                AND css.parentfield = 'seller_summary_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.seller_summary)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Cart", record.name)

            # Double-check idempotency
            if doc.get("seller_summary_table") and len(doc.seller_summary_table) > 0:
                skipped += 1
                continue

            for item in data:
                if not isinstance(item, dict):
                    continue
                doc.append("seller_summary_table", {
                    "seller": item.get("seller", ""),
                    "seller_name": item.get("seller_name", ""),
                    "item_count": item.get("item_count", 0),
                    "subtotal": item.get("subtotal", 0),
                })

            if doc.seller_summary_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Cart Migration Error"),
                message=_("Error migrating seller_summary for Cart {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Commission Rule: 5 JSON fields -> child tables
# ---------------------------------------------------------------------------

def migrate_commission_rule():
    """
    Migrate Commission Rule JSON fields to child tables.

    Fields:
    - restricted_sellers -> restricted_sellers_table (Commission Rule Seller, is_excluded=0)
    - excluded_sellers -> excluded_sellers_table (Commission Rule Seller, is_excluded=1)
    - restricted_categories -> restricted_categories_table (Commission Rule Category, is_excluded=0)
    - excluded_categories -> excluded_categories_table (Commission Rule Category, is_excluded=1)
    - override_by -> override_by_table (Commission Rule Override Role)

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    # Check at least one legacy field exists
    has_any_field = False
    for field in ["restricted_sellers", "excluded_sellers", "restricted_categories",
                   "excluded_categories", "override_by"]:
        if frappe.db.has_column("Commission Rule", field):
            has_any_field = True
            break

    if not has_any_field:
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name,
            restricted_sellers, excluded_sellers,
            restricted_categories, excluded_categories,
            override_by
        FROM `tabCommission Rule`
        WHERE (
            (restricted_sellers IS NOT NULL AND restricted_sellers != '' AND restricted_sellers != '[]' AND restricted_sellers != 'null')
            OR (excluded_sellers IS NOT NULL AND excluded_sellers != '' AND excluded_sellers != '[]' AND excluded_sellers != 'null')
            OR (restricted_categories IS NOT NULL AND restricted_categories != '' AND restricted_categories != '[]' AND restricted_categories != 'null')
            OR (excluded_categories IS NOT NULL AND excluded_categories != '' AND excluded_categories != '[]' AND excluded_categories != 'null')
            OR (override_by IS NOT NULL AND override_by != '' AND override_by != '[]' AND override_by != 'null')
        )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Commission Rule", record.name)
            any_migrated = False

            # Migrate restricted_sellers (is_excluded=0)
            any_migrated |= _migrate_commission_sellers(
                doc, record, "restricted_sellers", "restricted_sellers_table", is_excluded=0
            )

            # Migrate excluded_sellers (is_excluded=1)
            any_migrated |= _migrate_commission_sellers(
                doc, record, "excluded_sellers", "excluded_sellers_table", is_excluded=1
            )

            # Migrate restricted_categories (is_excluded=0)
            any_migrated |= _migrate_commission_categories(
                doc, record, "restricted_categories", "restricted_categories_table", is_excluded=0
            )

            # Migrate excluded_categories (is_excluded=1)
            any_migrated |= _migrate_commission_categories(
                doc, record, "excluded_categories", "excluded_categories_table", is_excluded=1
            )

            # Migrate override_by
            any_migrated |= _migrate_commission_override_by(doc, record)

            if any_migrated:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Commission Rule Migration Error"),
                message=_("Error migrating Commission Rule {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


def _migrate_commission_sellers(doc, record, json_field, table_field, is_excluded):
    """
    Migrate a Commission Rule seller JSON field to Commission Rule Seller child table.

    Expected JSON format: list of seller profile names (strings) or list of dicts
    with 'seller' and optional 'seller_name' keys.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get(table_field) and len(doc.get(table_field)) > 0:
        return False

    data = parse_json_field(record.get(json_field))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if isinstance(item, str):
            # Simple string format: just the seller name/ID
            if item.strip():
                doc.append(table_field, {
                    "seller": item.strip(),
                    "seller_name": "",
                    "is_excluded": is_excluded,
                })
                added = True
        elif isinstance(item, dict):
            seller = item.get("seller", "") or item.get("name", "")
            if seller:
                doc.append(table_field, {
                    "seller": seller,
                    "seller_name": item.get("seller_name", ""),
                    "is_excluded": is_excluded,
                })
                added = True

    return added


def _migrate_commission_categories(doc, record, json_field, table_field, is_excluded):
    """
    Migrate a Commission Rule category JSON field to Commission Rule Category child table.

    Expected JSON format: list of category names (strings) or list of dicts
    with 'category' and optional 'category_name' keys.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get(table_field) and len(doc.get(table_field)) > 0:
        return False

    data = parse_json_field(record.get(json_field))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if isinstance(item, str):
            if item.strip():
                doc.append(table_field, {
                    "category": item.strip(),
                    "category_name": "",
                    "is_excluded": is_excluded,
                })
                added = True
        elif isinstance(item, dict):
            category = item.get("category", "") or item.get("name", "")
            if category:
                doc.append(table_field, {
                    "category": category,
                    "category_name": item.get("category_name", ""),
                    "is_excluded": is_excluded,
                })
                added = True

    return added


def _migrate_commission_override_by(doc, record):
    """
    Migrate Commission Rule.override_by JSON to Commission Rule Override Role child table.

    Expected JSON format: list of role names (strings) or list of dicts with 'role' key.

    Returns:
        bool: True if any rows were added.
    """
    # Skip if child table already has rows
    if doc.get("override_by_table") and len(doc.override_by_table) > 0:
        return False

    data = parse_json_field(record.get("override_by"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if isinstance(item, str):
            if item.strip():
                doc.append("override_by_table", {
                    "role": item.strip(),
                })
                added = True
        elif isinstance(item, dict):
            role = item.get("role", "") or item.get("name", "")
            if role:
                doc.append("override_by_table", {
                    "role": role,
                })
                added = True

    return added


# ---------------------------------------------------------------------------
# Escrow Account: partial_releases -> Escrow Partial Release
# ---------------------------------------------------------------------------

def migrate_escrow_account_partial_releases():
    """
    Migrate Escrow Account.partial_releases JSON to Escrow Partial Release child table.

    Expected JSON format: list of dicts with release_date, amount, released_by,
    reason, reference, status.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Escrow Account", "partial_releases"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, partial_releases
        FROM `tabEscrow Account`
        WHERE partial_releases IS NOT NULL
            AND partial_releases != ''
            AND partial_releases != '[]'
            AND partial_releases != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabEscrow Partial Release` epr
                WHERE epr.parent = `tabEscrow Account`.name
                AND epr.parenttype = 'Escrow Account'
                AND epr.parentfield = 'partial_releases_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.partial_releases)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Escrow Account", record.name)

            if doc.get("partial_releases_table") and len(doc.partial_releases_table) > 0:
                skipped += 1
                continue

            for item in data:
                if not isinstance(item, dict):
                    continue
                doc.append("partial_releases_table", {
                    "release_date": item.get("release_date", ""),
                    "amount": item.get("amount", 0),
                    "released_by": item.get("released_by", ""),
                    "reason": item.get("reason", ""),
                    "reference": item.get("reference", ""),
                    "status": item.get("status", "Completed"),
                })

            if doc.partial_releases_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Escrow Account Migration Error"),
                message=_("Error migrating partial_releases for Escrow Account {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Escrow Event: related_events -> Escrow Event Link
# ---------------------------------------------------------------------------

def migrate_escrow_event_related_events():
    """
    Migrate Escrow Event.related_events JSON to Escrow Event Link child table.

    Expected JSON format: list of event name strings or list of dicts with
    'linked_event' and optional 'relation_type' keys.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Escrow Event", "related_events"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, related_events
        FROM `tabEscrow Event`
        WHERE related_events IS NOT NULL
            AND related_events != ''
            AND related_events != '[]'
            AND related_events != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabEscrow Event Link` eel
                WHERE eel.parent = `tabEscrow Event`.name
                AND eel.parenttype = 'Escrow Event'
                AND eel.parentfield = 'related_events_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.related_events)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Escrow Event", record.name)

            if doc.get("related_events_table") and len(doc.related_events_table) > 0:
                skipped += 1
                continue

            for item in data:
                if isinstance(item, str):
                    if item.strip():
                        doc.append("related_events_table", {
                            "linked_event": item.strip(),
                            "relation_type": "Related To",
                        })
                elif isinstance(item, dict):
                    linked_event = item.get("linked_event", "") or item.get("event", "") or item.get("name", "")
                    if linked_event:
                        doc.append("related_events_table", {
                            "linked_event": linked_event,
                            "relation_type": item.get("relation_type", "Related To"),
                        })

            if doc.related_events_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Escrow Event Migration Error"),
                message=_("Error migrating related_events for Escrow Event {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Marketplace Order: seller_summary -> Order Seller Summary
# ---------------------------------------------------------------------------

def migrate_marketplace_order_seller_summary():
    """
    Migrate Marketplace Order.seller_summary JSON to Order Seller Summary child table.

    Expected JSON format: list of dicts with seller, seller_name, item_count,
    subtotal, shipping_total, tax_total, grand_total.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Marketplace Order", "seller_summary"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, seller_summary
        FROM `tabMarketplace Order`
        WHERE seller_summary IS NOT NULL
            AND seller_summary != ''
            AND seller_summary != '[]'
            AND seller_summary != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabOrder Seller Summary` oss
                WHERE oss.parent = `tabMarketplace Order`.name
                AND oss.parenttype = 'Marketplace Order'
                AND oss.parentfield = 'seller_summary_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.seller_summary)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Marketplace Order", record.name)

            if doc.get("seller_summary_table") and len(doc.seller_summary_table) > 0:
                skipped += 1
                continue

            for item in data:
                if not isinstance(item, dict):
                    continue
                doc.append("seller_summary_table", {
                    "seller": item.get("seller", ""),
                    "seller_name": item.get("seller_name", ""),
                    "item_count": item.get("item_count", 0),
                    "subtotal": item.get("subtotal", 0),
                    "shipping_total": item.get("shipping_total", 0),
                    "tax_total": item.get("tax_total", 0),
                    "grand_total": item.get("grand_total", 0),
                })

            if doc.seller_summary_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Marketplace Order Migration Error"),
                message=_("Error migrating seller_summary for Marketplace Order {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Order Event: related_events -> Order Event Link
# ---------------------------------------------------------------------------

def migrate_order_event_related_events():
    """
    Migrate Order Event.related_events JSON to Order Event Link child table.

    Expected JSON format: list of event name strings or list of dicts with
    'linked_event' and optional 'relation_type' keys.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    if not frappe.db.has_column("Order Event", "related_events"):
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name, related_events
        FROM `tabOrder Event`
        WHERE related_events IS NOT NULL
            AND related_events != ''
            AND related_events != '[]'
            AND related_events != 'null'
            AND NOT EXISTS (
                SELECT 1 FROM `tabOrder Event Link` oel
                WHERE oel.parent = `tabOrder Event`.name
                AND oel.parenttype = 'Order Event'
                AND oel.parentfield = 'related_events_table'
            )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            data = parse_json_field(record.related_events)
            if not data or not isinstance(data, list):
                skipped += 1
                continue

            doc = frappe.get_doc("Order Event", record.name)

            if doc.get("related_events_table") and len(doc.related_events_table) > 0:
                skipped += 1
                continue

            for item in data:
                if isinstance(item, str):
                    if item.strip():
                        doc.append("related_events_table", {
                            "linked_event": item.strip(),
                            "relation_type": "Related To",
                        })
                elif isinstance(item, dict):
                    linked_event = item.get("linked_event", "") or item.get("event", "") or item.get("name", "")
                    if linked_event:
                        doc.append("related_events_table", {
                            "linked_event": linked_event,
                            "relation_type": item.get("relation_type", "Related To"),
                        })

            if doc.related_events_table:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Order Event Migration Error"),
                message=_("Error migrating related_events for Order Event {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


# ---------------------------------------------------------------------------
# Payment Intent: installment_plan, partial_refunds, fraud_flags
# ---------------------------------------------------------------------------

def migrate_payment_intent():
    """
    Migrate Payment Intent JSON fields to child tables.

    Fields:
    - installment_plan -> installment_plan_table (Payment Intent Installment)
    - partial_refunds -> partial_refunds_table (Payment Refund)
    - fraud_flags -> fraud_flags_table (Payment Fraud Flag)

    CRITICAL: Financial data — extra care with error handling.

    Returns:
        tuple: (migrated_count, skipped_count, error_count)
    """
    # Check at least one legacy field exists
    has_any_field = False
    for field in ["installment_plan", "partial_refunds", "fraud_flags"]:
        if frappe.db.has_column("Payment Intent", field):
            has_any_field = True
            break

    if not has_any_field:
        return 0, 0, 0

    records = frappe.db.sql(
        """
        SELECT name,
            installment_plan, partial_refunds, fraud_flags
        FROM `tabPayment Intent`
        WHERE (
            (installment_plan IS NOT NULL AND installment_plan != '' AND installment_plan != '[]' AND installment_plan != 'null')
            OR (partial_refunds IS NOT NULL AND partial_refunds != '' AND partial_refunds != '[]' AND partial_refunds != 'null')
            OR (fraud_flags IS NOT NULL AND fraud_flags != '' AND fraud_flags != '[]' AND fraud_flags != 'null')
        )
        """,
        as_dict=True
    )

    migrated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            doc = frappe.get_doc("Payment Intent", record.name)
            any_migrated = False

            # Migrate installment_plan
            any_migrated |= _migrate_installment_plan(doc, record)

            # Migrate partial_refunds
            any_migrated |= _migrate_partial_refunds(doc, record)

            # Migrate fraud_flags
            any_migrated |= _migrate_fraud_flags(doc, record)

            if any_migrated:
                doc.flags.ignore_validate = True
                doc.flags.ignore_permissions = True
                doc.save()
                migrated += 1
            else:
                skipped += 1

        except Exception as e:
            frappe.log_error(
                title=_("Payment Intent Migration Error"),
                message=_("Error migrating Payment Intent {0}: {1}").format(
                    record.name, str(e)
                )
            )
            errors += 1

    return migrated, skipped, errors


def _migrate_installment_plan(doc, record):
    """
    Migrate Payment Intent.installment_plan JSON to Payment Intent Installment child table.

    Expected JSON format: list of dicts with installment_number, due_date, amount,
    status, paid_amount, paid_date, gateway_reference, notes.
    Also handles dict format with an 'installments' key containing the list.

    Returns:
        bool: True if any rows were added.
    """
    if doc.get("installment_plan_table") and len(doc.installment_plan_table) > 0:
        return False

    data = parse_json_field(record.get("installment_plan"))
    if not data:
        return False

    # Handle both list format and dict format with 'installments' key
    items = data
    if isinstance(data, dict):
        items = data.get("installments", [])
        if not isinstance(items, list):
            return False

    if not isinstance(items, list):
        return False

    added = False
    for item in items:
        if not isinstance(item, dict):
            continue
        doc.append("installment_plan_table", {
            "installment_number": item.get("installment_number", 1),
            "due_date": item.get("due_date", ""),
            "amount": item.get("amount", 0),
            "status": item.get("status", "Pending"),
            "paid_amount": item.get("paid_amount", 0),
            "paid_date": item.get("paid_date", ""),
            "gateway_reference": item.get("gateway_reference", ""),
            "notes": item.get("notes", ""),
        })
        added = True

    return added


def _migrate_partial_refunds(doc, record):
    """
    Migrate Payment Intent.partial_refunds JSON to Payment Refund child table.

    Expected JSON format: list of dicts with refund_amount, refund_date, status,
    reason, gateway_refund_id, gateway_response, initiated_by, notes.

    Returns:
        bool: True if any rows were added.
    """
    if doc.get("partial_refunds_table") and len(doc.partial_refunds_table) > 0:
        return False

    data = parse_json_field(record.get("partial_refunds"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if not isinstance(item, dict):
            continue

        # Handle gateway_response: keep as JSON string if it's a dict
        gateway_response = item.get("gateway_response", "")
        if isinstance(gateway_response, dict):
            gateway_response = json.dumps(gateway_response)

        doc.append("partial_refunds_table", {
            "refund_amount": item.get("refund_amount", item.get("amount", 0)),
            "refund_date": item.get("refund_date", item.get("date", "")),
            "status": item.get("status", "Pending"),
            "reason": item.get("reason", ""),
            "gateway_refund_id": item.get("gateway_refund_id", ""),
            "gateway_response": gateway_response,
            "initiated_by": item.get("initiated_by", ""),
            "notes": item.get("notes", ""),
        })
        added = True

    return added


def _migrate_fraud_flags(doc, record):
    """
    Migrate Payment Intent.fraud_flags JSON to Payment Fraud Flag child table.

    Expected JSON format: list of dicts with flag_type, severity, detected_at,
    source, description, is_resolved, resolved_at, resolution_notes.

    Returns:
        bool: True if any rows were added.
    """
    if doc.get("fraud_flags_table") and len(doc.fraud_flags_table) > 0:
        return False

    data = parse_json_field(record.get("fraud_flags"))
    if not data or not isinstance(data, list):
        return False

    added = False
    for item in data:
        if not isinstance(item, dict):
            continue
        doc.append("fraud_flags_table", {
            "flag_type": item.get("flag_type", item.get("type", "")),
            "severity": item.get("severity", "Medium"),
            "detected_at": item.get("detected_at", item.get("timestamp", "")),
            "source": item.get("source", "System"),
            "description": item.get("description", item.get("details", "")),
            "is_resolved": item.get("is_resolved", 0),
            "resolved_at": item.get("resolved_at", ""),
            "resolution_notes": item.get("resolution_notes", ""),
        })
        added = True

    return added
