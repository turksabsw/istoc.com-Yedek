# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate single attribute_set Link values to category_attribute_sets child table.

This patch copies existing single `attribute_set` Link values from Product Category
to the new `category_attribute_sets` child table (Category Attribute Set) with
`is_default=1`.

Previously, each Product Category had a single `attribute_set` Link field pointing
to one Attribute Set. The new multi-attribute-set system uses a child table
(`category_attribute_sets`) that supports multiple attribute sets per category.

This patch migrates the legacy single values so that existing data is preserved
in the new structure.

IMPORTANT: This patch is idempotent. It skips Product Categories that already
have entries in the `category_attribute_sets` child table.
"""

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Migrates single attribute_set Link values from Product Category to
    category_attribute_sets child table with is_default=1.
    """
    # Reload DocTypes to ensure schema is up to date
    frappe.reload_doc("TradeHub Catalog", "doctype", "category_attribute_set")
    frappe.reload_doc("TradeHub Catalog", "doctype", "product_category")

    # Check if Product Category has the legacy attribute_set field
    if not frappe.db.has_column("Product Category", "attribute_set"):
        frappe.log_error(
            title=_("Migration Skip"),
            message=_("Product Category does not have attribute_set field. Migration skipped.")
        )
        return

    # Check if the child table exists
    if not frappe.db.table_exists("tabCategory Attribute Set"):
        frappe.log_error(
            title=_("Migration Skip"),
            message=_("Category Attribute Set table does not exist. Migration skipped.")
        )
        return

    # Get Product Categories with attribute_set set but no child table entries yet
    categories_to_migrate = get_categories_to_migrate()

    if not categories_to_migrate:
        return

    migrated_count = 0
    skipped_count = 0

    for category_data in categories_to_migrate:
        try:
            if migrate_category_attribute_set(category_data):
                migrated_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            frappe.log_error(
                title=_("Attribute Set Migration Error"),
                message=_("Error migrating attribute_set for Product Category {0}: {1}").format(
                    category_data.get("name"), str(e)
                )
            )
            skipped_count += 1

    if migrated_count > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Attribute Set Migration Complete"),
        message=_("Migrated {0} Product Category attribute sets to child table, skipped {1}").format(
            migrated_count, skipped_count
        )
    )


def get_categories_to_migrate():
    """
    Get Product Categories that have a legacy attribute_set value but do not
    yet have any rows in the category_attribute_sets child table.

    Returns:
        list: List of dicts with Product Category data.
    """
    categories = frappe.db.sql(
        """
        SELECT
            pc.name,
            pc.attribute_set
        FROM `tabProduct Category` pc
        WHERE
            pc.attribute_set IS NOT NULL
            AND pc.attribute_set != ''
            AND NOT EXISTS (
                SELECT 1 FROM `tabCategory Attribute Set` cas
                WHERE cas.parent = pc.name
                AND cas.parenttype = 'Product Category'
            )
        """,
        as_dict=True
    )

    return categories


def migrate_category_attribute_set(category_data):
    """
    Migrate a single Product Category's legacy attribute_set to the child table.

    Creates a new Category Attribute Set child row with:
    - attribute_set: the legacy attribute_set value
    - is_default: 1 (it was the only/primary attribute set)
    - is_required: 0 (default)
    - display_order: 0 (first entry)

    Args:
        category_data: Dict with 'name' and 'attribute_set' keys.

    Returns:
        bool: True if migration was successful, False if skipped.
    """
    category_name = category_data.get("name")
    attribute_set_value = category_data.get("attribute_set")

    if not attribute_set_value:
        return False

    # Verify the referenced Attribute Set still exists
    if not frappe.db.exists("Attribute Set", attribute_set_value):
        frappe.log_error(
            title=_("Attribute Set Migration Warning"),
            message=_("Attribute Set '{0}' referenced by Product Category '{1}' does not exist. Skipping.").format(
                attribute_set_value, category_name
            )
        )
        return False

    # Get the Product Category document
    pc_doc = frappe.get_doc("Product Category", category_name)

    # Double-check idempotency: skip if already has child table entries
    if pc_doc.get("category_attribute_sets") and len(pc_doc.category_attribute_sets) > 0:
        return False

    # Append the legacy attribute_set as a child table row with is_default=1
    pc_doc.append("category_attribute_sets", {
        "attribute_set": attribute_set_value,
        "is_default": 1,
        "is_required": 0,
        "display_order": 0
    })

    # Save without triggering full validation (we're just migrating data)
    pc_doc.flags.ignore_validate = True
    pc_doc.flags.ignore_permissions = True
    pc_doc.save()

    return True
