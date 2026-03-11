# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import os
import re

import frappe
from frappe import _
from frappe.utils import cint, flt
from frappe.utils.nestedset import NestedSet


class Category(NestedSet):
    """
    Category DocType with hierarchical structure for TR-TradeHub marketplace.

    Categories support:
    - Nested hierarchy (parent/child relationships)
    - Commission rate settings per category
    - SEO metadata for category pages
    - Integration with ERPNext Item Groups
    - Attribute Sets for product specifications
    """

    nsm_parent_field = "parent_category"
    website = frappe._dict()

    def before_insert(self):
        """Actions before inserting a new category."""
        self.generate_route()

    def validate(self):
        """Validate category data before saving."""
        self.validate_commission_rates()
        self.validate_parent_category()
        self.validate_deactivation()
        self.validate_icon()
        self.generate_route()

    def on_update(self):
        """Actions after category is updated."""
        super().on_update()
        self.clear_category_cache()
        self.update_children_routes()

    def on_trash(self):
        """Prevent deletion of category with products or children."""
        self.check_linked_documents()
        super().on_trash()

    def validate_commission_rates(self):
        """Validate commission rate settings."""
        if flt(self.commission_rate) < 0:
            frappe.throw(_("Commission Rate cannot be negative"))
        if flt(self.commission_rate) > 100:
            frappe.throw(_("Commission Rate cannot exceed 100%"))

        if flt(self.min_commission) < 0:
            frappe.throw(_("Minimum Commission cannot be negative"))

        if self.max_commission and flt(self.max_commission) < flt(self.min_commission):
            frappe.throw(_("Maximum Commission cannot be less than Minimum Commission"))

        if flt(self.fixed_commission) < 0:
            frappe.throw(_("Fixed Commission cannot be negative"))

    def validate_parent_category(self):
        """Validate parent category assignment."""
        if self.parent_category:
            # Prevent circular references
            if self.parent_category == self.name:
                frappe.throw(_("Category cannot be its own parent"))

            # Check that parent exists and is active
            parent = frappe.get_doc("Category", self.parent_category)
            if not parent.is_active:
                frappe.throw(_("Parent category must be active"))

    def validate_deactivation(self):
        """Prevent deactivation if active Listings or active sub-categories exist."""
        if cint(self.is_active):
            return

        # Only check when transitioning from active to inactive
        if not self.is_new():
            db_is_active = frappe.db.get_value("Category", self.name, "is_active")
            if not cint(db_is_active):
                # Already inactive, no need to validate
                return

        # Check for active sub-categories
        active_children = frappe.db.count(
            "Category",
            {"parent_category": self.name, "is_active": 1}
        )
        if active_children:
            frappe.throw(
                _("Cannot deactivate Category with {0} active sub-categories. Please deactivate child categories first.").format(active_children)
            )

        # Check for active listings
        active_listings = frappe.db.count(
            "Listing",
            {"category": self.name, "is_active": 1}
        )
        if active_listings:
            frappe.throw(
                _("Cannot deactivate Category with {0} active listings. Please deactivate or move listings first.").format(active_listings)
            )

    def validate_icon(self):
        """Validate icon fields: SVG file, icon_class, icon_color, and auto-populate icon_name."""
        # Validate and sanitize SVG icon file
        if self.icon:
            self._validate_svg_icon()
            self._auto_populate_icon_name()

        # Validate icon_class format
        if self.icon_class:
            self._validate_icon_class()

        # Validate icon_color format
        if self.icon_color:
            self._validate_icon_color()

    def _validate_svg_icon(self):
        """Validate SVG icon file: extension, size, and sanitize content."""
        file_url = self.icon

        # Check .svg extension
        if not file_url.lower().endswith(".svg"):
            frappe.throw(_("Icon must be an SVG file (.svg extension)"))

        # Get the file document to check size and read content
        file_doc = frappe.db.get_value(
            "File",
            {"file_url": file_url},
            ["name", "file_size", "file_url"],
            as_dict=True
        )

        if not file_doc:
            # File might be a URL or not yet saved; skip further validation
            return

        # Check file size (50KB max)
        max_size = 50 * 1024  # 50KB in bytes
        if file_doc.file_size and file_doc.file_size > max_size:
            frappe.throw(
                _("Icon file size ({0} KB) exceeds maximum allowed size of 50 KB").format(
                    round(file_doc.file_size / 1024, 1)
                )
            )

        # Read and sanitize SVG content
        try:
            file_path = frappe.get_doc("File", file_doc.name).get_full_path()
            if file_path and os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    svg_content = f.read()

                sanitized_content = sanitize_svg(svg_content)

                # Write back the sanitized content
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(sanitized_content)
        except Exception:
            frappe.log_error(
                title=_("SVG Sanitization Error"),
                message=frappe.get_traceback()
            )
            frappe.throw(_("Failed to sanitize SVG icon file. Please upload a valid SVG."))

    def _auto_populate_icon_name(self):
        """Auto-populate icon_name from the uploaded icon filename."""
        if self.icon and not self.icon_name:
            # Extract filename without extension from the file URL
            filename = os.path.basename(self.icon)
            name_without_ext = os.path.splitext(filename)[0]
            # Clean up the name: replace hyphens/underscores with spaces, title case
            clean_name = name_without_ext.replace("-", " ").replace("_", " ")
            self.icon_name = clean_name.strip().title()

    def _validate_icon_class(self):
        """Validate icon_class matches allowed pattern."""
        icon_class_pattern = re.compile(r"^[a-zA-Z0-9_\- ]+$")
        if not icon_class_pattern.match(self.icon_class):
            frappe.throw(
                _("Icon Class can only contain letters, numbers, spaces, hyphens, and underscores")
            )

    def _validate_icon_color(self):
        """Validate icon_color is a valid hex or rgb color."""
        color = self.icon_color.strip()

        # Check hex color: #RGB, #RRGGBB, #RRGGBBAA
        hex_pattern = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
        if hex_pattern.match(color):
            return

        # Check rgb/rgba color: rgb(r, g, b) or rgba(r, g, b, a)
        rgb_pattern = re.compile(
            r"^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$"
        )
        if rgb_pattern.match(color):
            return

        frappe.throw(
            _("Icon Color must be a valid hex color (e.g., #333333) or RGB color (e.g., rgb(51, 51, 51))")
        )

    def generate_route(self):
        """Generate URL route for category page if not set."""
        if not self.route:
            route_parts = ["shop"]

            # Build path including parent categories
            ancestors = self.get_ancestors()
            for ancestor_name in reversed(ancestors):
                ancestor = frappe.get_cached_doc("Category", ancestor_name)
                route_parts.append(frappe.scrub(ancestor.category_name))

            route_parts.append(frappe.scrub(self.category_name))
            self.route = "/".join(route_parts)

    def update_children_routes(self):
        """Update routes of child categories when parent route changes."""
        children = frappe.get_all(
            "Category",
            filters={"parent_category": self.name},
            pluck="name"
        )
        for child_name in children:
            child = frappe.get_doc("Category", child_name)
            child.route = None  # Force regeneration
            child.save()

    def clear_category_cache(self):
        """Clear cached category data."""
        frappe.cache().delete_value("all_categories")
        frappe.cache().delete_value(f"category:{self.name}")
        frappe.cache().delete_value("category_tree")

    def check_linked_documents(self):
        """Check for linked documents before allowing deletion."""
        # Check for child categories
        children = frappe.db.count("Category", {"parent_category": self.name})
        if children:
            frappe.throw(
                _("Cannot delete Category with {0} child categories. Please delete or move child categories first.").format(children)
            )

        # Check for linked listings
        listings_count = frappe.db.count("Listing", {"category": self.name})
        if listings_count:
            frappe.throw(
                _("Cannot delete Category with {0} linked listings. Please move or delete listings first.").format(listings_count)
            )

    def get_ancestors(self):
        """Get list of ancestor category names."""
        ancestors = []
        parent = self.parent_category
        while parent:
            ancestors.append(parent)
            parent_doc = frappe.get_cached_doc("Category", parent)
            parent = parent_doc.parent_category
        return ancestors

    def get_descendants(self, include_self=False):
        """Get list of descendant category names."""
        descendants = []
        if include_self:
            descendants.append(self.name)

        children = frappe.get_all(
            "Category",
            filters={"parent_category": self.name},
            pluck="name"
        )

        for child_name in children:
            child = frappe.get_doc("Category", child_name)
            descendants.extend(child.get_descendants(include_self=True))

        return descendants

    def get_effective_commission_rate(self):
        """
        Get effective commission rate for this category.
        Falls back to parent category if not set, or default rate.
        """
        if self.commission_rate and flt(self.commission_rate) > 0:
            return flt(self.commission_rate)

        if self.parent_category:
            parent = frappe.get_cached_doc("Category", self.parent_category)
            return parent.get_effective_commission_rate()

        # Default commission rate
        return flt(frappe.db.get_single_value("TR TradeHub Settings", "default_commission_rate") or 10.0)

    def calculate_commission(self, amount):
        """
        Calculate commission for a given amount.

        Args:
            amount: Transaction amount

        Returns:
            Commission amount after applying rate, min, max, and fixed
        """
        commission_rate = self.get_effective_commission_rate()
        calculated = flt(amount) * flt(commission_rate) / 100

        # Apply minimum commission
        if self.min_commission and calculated < flt(self.min_commission):
            calculated = flt(self.min_commission)

        # Apply maximum commission
        if self.max_commission and calculated > flt(self.max_commission):
            calculated = flt(self.max_commission)

        # Add fixed commission
        if self.fixed_commission:
            calculated += flt(self.fixed_commission)

        return calculated

    def get_product_count(self):
        """Get count of products/listings in this category."""
        return frappe.db.count("Listing", {"category": self.name})

    def get_total_product_count(self):
        """Get count of products in this category and all descendants."""
        categories = self.get_descendants(include_self=True)
        return frappe.db.count("Listing", {"category": ["in", categories]})


def sanitize_svg(content):
    """
    Sanitize SVG content by removing dangerous elements and attributes.

    Uses defusedxml for safe XML parsing (prevents XXE and XML bombs),
    then removes:
    - <script> elements
    - <foreignObject> elements
    - on* event handler attributes (onclick, onload, etc.)
    - javascript: URI values in any attribute

    Args:
        content: Raw SVG file content as string

    Returns:
        Sanitized SVG content as string
    """
    import defusedxml.ElementTree as DefusedET
    from xml.etree.ElementTree import tostring

    root = DefusedET.fromstring(content)

    # Tags to remove (lowercase for case-insensitive comparison)
    dangerous_tags = {"script", "foreignobject"}

    # Walk parent→child to safely remove dangerous elements
    # (stdlib ElementTree has no getparent(), must use parent→child iteration)
    for parent in list(root.iter()):
        for child in list(parent):
            # Handle namespace-prefixed tags: {http://www.w3.org/2000/svg}script
            tag = child.tag.split("}")[-1] if "}" in str(child.tag) else str(child.tag)
            if tag.lower() in dangerous_tags:
                parent.remove(child)

    # Strip dangerous attributes from all remaining elements
    for elem in root.iter():
        for attr in list(elem.attrib):
            # Handle namespace-prefixed attributes
            attr_local = attr.split("}")[-1] if "}" in attr else attr

            # Remove on* event handlers (onclick, onload, onerror, etc.)
            if attr_local.lower().startswith("on"):
                del elem.attrib[attr]
            # Remove javascript: URI values
            elif "javascript:" in str(elem.attrib[attr]).lower():
                del elem.attrib[attr]

    return tostring(root, encoding="unicode")


@frappe.whitelist()
def get_category_tree(parent=None, include_inactive=False):
    """
    Get category tree structure.

    Args:
        parent: Parent category name (None for root categories)
        include_inactive: Whether to include inactive categories

    Returns:
        list: List of category dictionaries with children
    """
    filters = {"parent_category": parent or ""}
    if not include_inactive:
        filters["is_active"] = 1

    categories = frappe.get_all(
        "Category",
        filters=filters,
        fields=[
            "name", "category_name", "parent_category",
            "is_active", "display_order", "image",
            "commission_rate", "route"
        ],
        order_by="display_order asc, category_name asc"
    )

    for category in categories:
        category["children"] = get_category_tree(
            parent=category["name"],
            include_inactive=include_inactive
        )
        category["product_count"] = frappe.db.count(
            "Listing",
            {"category": category["name"]}
        )
        category["expandable"] = bool(category["children"])

    return categories


@frappe.whitelist()
def get_category_path(category_name):
    """
    Get breadcrumb path for a category.

    Args:
        category_name: Name of the category

    Returns:
        list: List of category dictionaries from root to current
    """
    if not frappe.has_permission("Category", "read"):
        frappe.throw(_("Not permitted"))

    path = []
    current = category_name

    while current:
        category = frappe.get_cached_doc("Category", current)
        path.append({
            "name": category.name,
            "category_name": category.category_name,
            "route": category.route
        })
        current = category.parent_category

    return list(reversed(path))


@frappe.whitelist()
def get_all_categories_flat(include_inactive=False):
    """
    Get all categories as a flat list with hierarchy info.

    Args:
        include_inactive: Whether to include inactive categories

    Returns:
        list: List of category dictionaries with level info
    """
    filters = {}
    if not include_inactive:
        filters["is_active"] = 1

    categories = frappe.get_all(
        "Category",
        filters=filters,
        fields=[
            "name", "category_name", "parent_category",
            "is_active", "display_order", "commission_rate",
            "lft", "rgt"
        ],
        order_by="lft asc"
    )

    # Calculate levels based on lft/rgt
    for category in categories:
        ancestors = frappe.db.count(
            "Category",
            {"lft": ["<", category["lft"]], "rgt": [">", category["rgt"]]}
        )
        category["level"] = ancestors
        category["indent_label"] = "—" * category["level"] + " " + category["category_name"] if category["level"] > 0 else category["category_name"]

    return categories


@frappe.whitelist()
def move_category(category_name, new_parent):
    """
    Move a category to a new parent.

    Args:
        category_name: Name of category to move
        new_parent: Name of new parent category (or empty for root)
    """
    if not frappe.has_permission("Category", "write"):
        frappe.throw(_("Not permitted"))

    category = frappe.get_doc("Category", category_name)

    # Validate new parent
    if new_parent and new_parent in category.get_descendants():
        frappe.throw(_("Cannot move category under its own descendant"))

    category.parent_category = new_parent if new_parent else ""
    category.route = None  # Force route regeneration
    category.save()

    return {"success": True, "message": _("Category moved successfully")}
