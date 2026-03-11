# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class StorefrontCertificate(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        certificate_name: DF.Data
        certificate_type: DF.Literal["ISO", "CE", "CPC", "RoHS", "FCC"]
        expiry_date: DF.Date | None
        issued_date: DF.Date | None
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
    # end: auto-generated types

    pass
