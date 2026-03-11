# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class StorefrontFactoryImage(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        caption: DF.Data | None
        image: DF.AttachImage
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
        sort_order: DF.Int
    # end: auto-generated types

    pass
