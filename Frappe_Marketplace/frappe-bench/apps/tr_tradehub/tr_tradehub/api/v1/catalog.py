# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

"""
Catalog API Endpoints — Product ve Listing yönetimi için backend API.

Satıcı ürün eklerken hem Product (katalog) hem Listing (storefront)
kaydı otomatik oluşturulur.

API URL Pattern:
    POST /api/method/tr_tradehub.api.v1.catalog.<function_name>
"""

import frappe
from frappe import _
from frappe.utils import cstr, flt, now_datetime

DEFAULT_STOCK_UOM = "Nos"
DEFAULT_CURRENCY = "TRY"


def _require_catalog_access():
    """Kullanıcının katalog erişim yetkisi olup olmadığını kontrol eder."""
    if frappe.session.user == "Guest":
        frappe.throw(_("Bu işlem için giriş yapmanız gerekiyor."), frappe.AuthenticationError)

    allowed_roles = {
        "System Manager", "Marketplace Manager", "Catalog Manager",
        "Administrator", "Seller", "Buyer",
    }
    user_roles = set(frappe.get_roles(frappe.session.user))
    if not (allowed_roles & user_roles):
        frappe.throw(
            _("Ürün oluşturmak için yetkiniz bulunmuyor."),
            frappe.PermissionError,
        )


def _get_seller_profile() -> str | None:
    """Mevcut kullanıcının Seller Profile adını döner, yoksa None."""
    return frappe.db.get_value(
        "Seller Profile",
        {"user": frappe.session.user},
        "name",
    )


def _get_default_uom() -> str:
    if frappe.db.exists("UOM", DEFAULT_STOCK_UOM):
        return DEFAULT_STOCK_UOM
    uom = frappe.db.get_value("UOM", {}, "name")
    return uom or DEFAULT_STOCK_UOM


def _get_default_currency() -> str:
    if frappe.db.exists("Currency", DEFAULT_CURRENCY):
        return DEFAULT_CURRENCY
    cur = frappe.db.get_value("Currency", {"enabled": 1}, "name")
    return cur or DEFAULT_CURRENCY


def _create_listing_for_seller(
    seller: str,
    product_name: str,
    status: str,
    base_price: float,
    product_code: str = None,
    barcode: str = None,
    category: str = None,
    description: str = None,
    stock: float = None,
    min_order: float = None,
    weight: float = None,
) -> str:
    """
    Satıcı için Listing kaydı oluşturur.
    Zorunlu alanlar için güvenli varsayılanlar kullanır.
    """
    # Listing statüsünü map'le
    listing_status = "Active" if status == "Active" else "Draft"

    # Geçerli kategori kontrolü
    valid_category = None
    if category and frappe.db.exists("Category", category):
        valid_category = category

    stock_uom = _get_default_uom()
    currency = _get_default_currency()
    price = flt(base_price) if base_price else 0.0

    listing = frappe.new_doc("Listing")
    listing.naming_series = "LST-.YYYY.-.#####"
    listing.title = cstr(product_name).strip()
    listing.seller = seller
    listing.status = listing_status
    listing.listing_type = "Fixed Price"
    listing.condition = "New"
    listing.currency = currency
    listing.base_price = price
    listing.selling_price = price
    listing.stock_uom = stock_uom
    listing.is_visible = 1
    listing.is_searchable = 1
    listing.published_at = now_datetime()

    if valid_category:
        listing.category = valid_category
    if product_code:
        listing.sku = cstr(product_code).strip()
    if barcode:
        listing.barcode = cstr(barcode).strip()
    if description:
        listing.short_description = cstr(description)[:200]
        listing.description = cstr(description)
    if stock is not None:
        listing.stock_qty = flt(stock)
    if min_order is not None:
        listing.min_order_qty = flt(min_order)
    if weight is not None:
        listing.weight = flt(weight)

    listing.flags.ignore_permissions = True
    listing.flags.ignore_mandatory = True  # category zorunlu ama dinamik yönetilir
    listing.insert()

    return listing.name


@frappe.whitelist()
def create_product(
    product_name: str,
    status: str = "Active",
    product_code: str = None,
    barcode: str = None,
    category: str = None,
    brand: str = None,
    base_price: float = None,
    description: str = None,
    stock: float = None,
    min_order: float = None,
    weight: float = None,
) -> dict:
    """
    Katalog ürünü oluşturur. Kullanıcı bir satıcıysa aynı zamanda
    Listing kaydı da oluşturulur (storefrontta görünmesi için).

    Returns:
        {"success": True, "name": "PRD-...", "listing_name": "LST-...", ...}
    """
    _require_catalog_access()

    if not product_name or not cstr(product_name).strip():
        frappe.throw(_("Ürün adı zorunludur."))

    valid_statuses = {"Active", "Draft", "Inactive", "Archived"}
    if status not in valid_statuses:
        status = "Draft"

    # ── 1. Product (katalog) kaydı ──────────────────────────
    doc = frappe.new_doc("Product")
    doc.naming_series = "PRD-.YYYY.-.#####"
    doc.product_name = cstr(product_name).strip()
    doc.status = status

    if product_code:
        doc.product_code = cstr(product_code).strip()
    if barcode:
        doc.barcode = cstr(barcode).strip()
    if description:
        doc.description = cstr(description)
    if base_price is not None:
        doc.base_price = flt(base_price)

    if category and frappe.db.exists("Category", category):
        doc.category = category
    if brand and frappe.db.exists("Brand", brand):
        doc.brand = brand

    doc.flags.ignore_permissions = True
    doc.insert()

    # ── 2. Seller Listing kaydı (satıcıysa) ─────────────────
    listing_name = None
    seller = _get_seller_profile()
    if seller:
        try:
            listing_name = _create_listing_for_seller(
                seller=seller,
                product_name=doc.product_name,
                status=status,
                base_price=flt(base_price) if base_price else 0.0,
                product_code=product_code,
                barcode=barcode,
                category=category,
                description=description,
                stock=stock,
                min_order=min_order,
                weight=weight,
            )
        except Exception as e:
            frappe.log_error(f"Listing oluşturulamadı: {e}", "catalog.create_product")

    frappe.db.commit()

    return {
        "success": True,
        "name": doc.name,
        "product_name": doc.product_name,
        "status": doc.status,
        "listing_name": listing_name,
        "has_listing": bool(listing_name),
    }


@frappe.whitelist(allow_guest=True)
def get_categories() -> dict:
    """
    Aktif kategorileri döner (frontend dropdown için).

    Returns:
        {"data": [{"name": "...", "category_name": "..."}, ...]}
    """
    data = frappe.get_list(
        "Category",
        fields=["name", "category_name", "parent_category"],
        filters={"is_group": 0} if frappe.db.has_column("Category", "is_group") else {},
        order_by="category_name asc",
        limit_page_length=200,
        ignore_permissions=True,
    )
    return {"data": data}


@frappe.whitelist(allow_guest=True)
def get_brands() -> dict:
    """
    Markaları döner (frontend dropdown için).

    Returns:
        {"data": [{"name": "...", "brand_name": "..."}, ...]}
    """
    data = frappe.get_list(
        "Brand",
        fields=["name", "brand_name"],
        order_by="brand_name asc",
        limit_page_length=200,
        ignore_permissions=True,
    )
    return {"data": data}


@frappe.whitelist()
def get_products(
    status: str = None,
    category: str = None,
    search: str = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """
    Ürün listesini döner.

    Returns:
        {"success": True, "data": [...], "total": int}
    """
    _require_catalog_access()

    filters = {}
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category
    if search:
        filters["product_name"] = ["like", f"%{search}%"]

    fields = ["name", "product_name", "status", "product_code", "base_price",
              "category", "brand", "creation", "modified"]

    total = frappe.db.count("Product", filters)
    data = frappe.get_list(
        "Product",
        filters=filters,
        fields=fields,
        limit_page_length=min(int(limit), 100),
        limit_start=int(offset),
        order_by="modified desc",
        ignore_permissions=True,
    )

    return {"success": True, "data": data, "total": total}
