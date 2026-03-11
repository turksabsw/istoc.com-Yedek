# Copyright (c) 2026, Trade Hub and contributors
# For license information, please see license.txt

"""
Migration Patch: Migrate Category references to Product Category.

This patch migrates data from the legacy Category DocType to the new
Product Category DocType across the following fields:

- Listing.category: Link field updated from Category → Product Category
- Listing.subcategory: Link field updated from Category → Product Category
- PIM Product.primary_category: Link field updated from Category → Product Category

The migration works by matching records using `category_name`, which is the
autoname field for both Category and Product Category DocTypes.

For each Category referenced in Listing or PIM Product that does not have a
corresponding Product Category record, a new Product Category is created
with mapped fields (category_name, description, image, display_order, hierarchy).

IMPORTANT: This patch is idempotent. It checks for existing Product Category
records before creating new ones and skips records that already reference
valid Product Category entries.
"""

import frappe
from frappe import _


def execute():
    """
    Main entry point for the migration patch.

    Ensures all Category references used in Listing and PIM Product have
    corresponding Product Category records, then updates broken references.
    """
    # Reload DocTypes to ensure schema is up to date
    reload_doctypes()

    # Step 1: Build mapping of Category → Product Category by category_name
    category_map = build_category_mapping()

    # Step 2: Create missing Product Category records for referenced categories
    created = create_missing_product_categories(category_map)

    # Step 3: Update Listing.category and Listing.subcategory references
    listing_migrated = migrate_listing_references(category_map)

    # Step 4: Update PIM Product.primary_category references
    pim_migrated = migrate_pim_product_references(category_map)

    # Step 5: Update PIM Product Category Link references
    link_migrated = migrate_pim_product_category_links(category_map)

    total_migrated = created + listing_migrated + pim_migrated + link_migrated

    if total_migrated > 0:
        frappe.db.commit()

    frappe.log_error(
        title=_("Category to Product Category Migration Complete"),
        message=_(
            "Created Product Categories: {0}, "
            "Listing references updated: {1}, "
            "PIM Product references updated: {2}, "
            "PIM Product Category Link references updated: {3}"
        ).format(created, listing_migrated, pim_migrated, link_migrated)
    )


def reload_doctypes():
    """Reload relevant DocTypes to ensure database schema is current."""
    frappe.reload_doc("tradehub_catalog", "doctype", "product_category")
    frappe.reload_doc("tradehub_catalog", "doctype", "category")
    frappe.reload_doc("tradehub_catalog", "doctype", "pim_product")
    frappe.reload_doc("tradehub_catalog", "doctype", "pim_product_category_link")


def build_category_mapping():
    """
    Build a mapping of Category names to Product Category names.

    Both DocTypes use `autoname: "field:category_name"`, so the record `name`
    equals the `category_name` value. The mapping is used to identify which
    Category records already have corresponding Product Category records.

    Returns:
        dict: {category_name: product_category_name or None}
    """
    # Get all Category records
    categories = frappe.db.sql(
        """
        SELECT name, category_name, parent_category, is_active,
               description, image, display_order
        FROM `tabCategory`
        """,
        as_dict=True
    )

    # Get all existing Product Category names
    existing_product_categories = set(
        row[0] for row in frappe.db.sql(
            "SELECT name FROM `tabProduct Category`"
        )
    )

    # Build mapping: Category.name → Product Category.name (or None if missing)
    category_map = {}
    for cat in categories:
        if cat.name in existing_product_categories:
            category_map[cat.name] = cat.name
        else:
            category_map[cat.name] = None

    return category_map


def create_missing_product_categories(category_map):
    """
    Create Product Category records for Category entries that don't have one.

    Processes categories in hierarchy order (parents first) to ensure parent
    references resolve correctly.

    Args:
        category_map: dict mapping Category name → Product Category name or None.

    Returns:
        int: Number of Product Category records created.
    """
    # Get full Category data for entries that need creation
    categories_to_create = [
        name for name, pc_name in category_map.items() if pc_name is None
    ]

    if not categories_to_create:
        return 0

    # Fetch full Category records
    category_records = frappe.db.sql(
        """
        SELECT name, category_name, parent_category, is_active,
               description, image, display_order, lft, rgt
        FROM `tabCategory`
        WHERE name IN ({placeholders})
        ORDER BY lft ASC
        """.format(
            placeholders=", ".join(["%s"] * len(categories_to_create))
        ),
        tuple(categories_to_create),
        as_dict=True
    )

    created = 0

    for cat in category_records:
        try:
            # Double-check idempotency: skip if Product Category already exists
            if frappe.db.exists("Product Category", cat.name):
                category_map[cat.name] = cat.name
                continue

            # Map parent_category from Category to Product Category
            parent_product_category = ""
            if cat.parent_category:
                # Check if parent exists as Product Category
                if frappe.db.exists("Product Category", cat.parent_category):
                    parent_product_category = cat.parent_category

            # Create the Product Category record
            pc_doc = frappe.new_doc("Product Category")
            pc_doc.category_name = cat.category_name
            pc_doc.parent_product_category = parent_product_category
            pc_doc.enabled = cat.is_active if cat.is_active is not None else 1
            pc_doc.is_group = 1 if has_children(cat.name) else 0
            pc_doc.description = cat.description or ""
            pc_doc.image = cat.image or ""
            pc_doc.display_order = cat.display_order or 0
            pc_doc.is_global = 1

            pc_doc.flags.ignore_validate = True
            pc_doc.flags.ignore_permissions = True
            pc_doc.flags.ignore_mandatory = True
            pc_doc.insert()

            category_map[cat.name] = pc_doc.name
            created += 1

        except Exception as e:
            frappe.log_error(
                title=_("Product Category Creation Error"),
                message=_("Error creating Product Category for Category {0}: {1}").format(
                    cat.name, str(e)
                )
            )

    return created


def has_children(category_name):
    """
    Check if a Category has child categories.

    Args:
        category_name: The Category record name.

    Returns:
        bool: True if children exist.
    """
    return frappe.db.exists("Category", {"parent_category": category_name})


# ---------------------------------------------------------------------------
# Listing: category, subcategory → Product Category references
# ---------------------------------------------------------------------------

def migrate_listing_references(category_map):
    """
    Update Listing.category and Listing.subcategory to reference Product Category.

    Since both Category and Product Category use `category_name` as autoname,
    the stored values are identical when a matching Product Category exists.
    This function only updates records where the referenced name exists as a
    Category but NOT as a Product Category (which should not happen after
    create_missing_product_categories, but we handle edge cases).

    Idempotency: Skips records where the reference already points to a valid
    Product Category record.

    Args:
        category_map: dict mapping Category name → Product Category name.

    Returns:
        int: Number of Listing records updated.
    """
    if not frappe.db.has_column("Listing", "category"):
        return 0

    migrated = 0

    # Get all existing Product Category names for validation
    existing_pcs = set(
        row[0] for row in frappe.db.sql(
            "SELECT name FROM `tabProduct Category`"
        )
    )

    # Find Listings with category values that don't exist in Product Category
    # but DO exist in Category (indicating they need migration)
    listings = frappe.db.sql(
        """
        SELECT l.name, l.category, l.subcategory
        FROM `tabListing` l
        WHERE (
            (l.category IS NOT NULL AND l.category != ''
             AND l.category IN (SELECT name FROM `tabCategory`)
             AND l.category NOT IN (SELECT name FROM `tabProduct Category`))
            OR
            (l.subcategory IS NOT NULL AND l.subcategory != ''
             AND l.subcategory IN (SELECT name FROM `tabCategory`)
             AND l.subcategory NOT IN (SELECT name FROM `tabProduct Category`))
        )
        """,
        as_dict=True
    )

    for listing in listings:
        try:
            updated = False

            # Update category reference
            if listing.category and listing.category not in existing_pcs:
                new_category = category_map.get(listing.category)
                if new_category:
                    frappe.db.set_value(
                        "Listing", listing.name, "category", new_category,
                        update_modified=False
                    )
                    updated = True

            # Update subcategory reference
            if listing.subcategory and listing.subcategory not in existing_pcs:
                new_subcategory = category_map.get(listing.subcategory)
                if new_subcategory:
                    frappe.db.set_value(
                        "Listing", listing.name, "subcategory", new_subcategory,
                        update_modified=False
                    )
                    updated = True

            if updated:
                migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("Listing Category Migration Error"),
                message=_("Error migrating category for Listing {0}: {1}").format(
                    listing.name, str(e)
                )
            )

    return migrated


# ---------------------------------------------------------------------------
# PIM Product: primary_category → Product Category reference
# ---------------------------------------------------------------------------

def migrate_pim_product_references(category_map):
    """
    Update PIM Product.primary_category to reference Product Category.

    Idempotency: Skips records where primary_category already points to a
    valid Product Category record.

    Args:
        category_map: dict mapping Category name → Product Category name.

    Returns:
        int: Number of PIM Product records updated.
    """
    if not frappe.db.has_column("PIM Product", "primary_category"):
        return 0

    # Find PIM Products with primary_category that exists in Category but not
    # in Product Category
    pim_products = frappe.db.sql(
        """
        SELECT p.name, p.primary_category
        FROM `tabPIM Product` p
        WHERE p.primary_category IS NOT NULL
            AND p.primary_category != ''
            AND p.primary_category IN (SELECT name FROM `tabCategory`)
            AND p.primary_category NOT IN (SELECT name FROM `tabProduct Category`)
        """,
        as_dict=True
    )

    migrated = 0

    for product in pim_products:
        try:
            new_category = category_map.get(product.primary_category)
            if new_category:
                frappe.db.set_value(
                    "PIM Product", product.name, "primary_category", new_category,
                    update_modified=False
                )
                migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("PIM Product Category Migration Error"),
                message=_("Error migrating primary_category for PIM Product {0}: {1}").format(
                    product.name, str(e)
                )
            )

    return migrated


# ---------------------------------------------------------------------------
# PIM Product Category Link: category → Product Category reference
# ---------------------------------------------------------------------------

def migrate_pim_product_category_links(category_map):
    """
    Update PIM Product Category Link.category to reference Product Category.

    The PIM Product Category Link child table currently references the old
    Category DocType. This function updates the stored category values to
    point to the corresponding Product Category records.

    Idempotency: Skips records where category already points to a valid
    Product Category record.

    Args:
        category_map: dict mapping Category name → Product Category name.

    Returns:
        int: Number of PIM Product Category Link records updated.
    """
    if not frappe.db.table_exists("tabPIM Product Category Link"):
        return 0

    if not frappe.db.has_column("PIM Product Category Link", "category"):
        return 0

    # Find links where category exists in Category but not in Product Category
    links = frappe.db.sql(
        """
        SELECT pcl.name, pcl.category
        FROM `tabPIM Product Category Link` pcl
        WHERE pcl.category IS NOT NULL
            AND pcl.category != ''
            AND pcl.category IN (SELECT name FROM `tabCategory`)
            AND pcl.category NOT IN (SELECT name FROM `tabProduct Category`)
        """,
        as_dict=True
    )

    migrated = 0

    for link in links:
        try:
            new_category = category_map.get(link.category)
            if new_category:
                frappe.db.set_value(
                    "PIM Product Category Link", link.name, "category", new_category,
                    update_modified=False
                )
                migrated += 1

        except Exception as e:
            frappe.log_error(
                title=_("PIM Product Category Link Migration Error"),
                message=_("Error migrating category for PIM Product Category Link {0}: {1}").format(
                    link.name, str(e)
                )
            )

    return migrated
