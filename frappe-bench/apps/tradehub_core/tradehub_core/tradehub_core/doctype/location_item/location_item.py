# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class LocationItem(Document):
    """Child table for managing multiple warehouse/store locations.

    This child table supports:
    - Multiple location types (Warehouse, Store, Branch, Showroom, Distribution Center, etc.)
    - Full Turkish address hierarchy (City -> District -> Neighborhood)
    - Country-level location support (default: Turkey)
    - ERPNext Warehouse integration for inventory management
    - Order fulfillment and return acceptance flags
    - Geolocation coordinates (latitude/longitude)
    - Default location marking per type
    - Active/inactive status tracking
    - Operating hours and capacity information
    - Contact information per location
    """

    def validate(self):
        """Validate location item data."""
        self.validate_address_hierarchy()
        self.validate_coordinates()
        self.validate_erpnext_warehouse()

    def validate_address_hierarchy(self):
        """Ensure district belongs to selected city and neighborhood belongs to selected district."""
        if self.district and self.city:
            district_city = frappe.db.get_value("District", self.district, "city")
            if district_city and district_city != self.city:
                frappe.throw(
                    _("District {0} does not belong to City {1}").format(
                        self.district, self.city
                    )
                )

        if self.neighborhood and self.district:
            neighborhood_district = frappe.db.get_value("Neighborhood", self.neighborhood, "district")
            if neighborhood_district and neighborhood_district != self.district:
                frappe.throw(
                    _("Neighborhood {0} does not belong to District {1}").format(
                        self.neighborhood, self.district
                    )
                )

    def validate_coordinates(self):
        """Validate latitude and longitude values are within valid ranges."""
        if self.latitude is not None and self.latitude != 0:
            if self.latitude < -90 or self.latitude > 90:
                frappe.throw(
                    _("Latitude must be between -90 and 90 degrees. Got {0}").format(
                        self.latitude
                    )
                )

        if self.longitude is not None and self.longitude != 0:
            if self.longitude < -180 or self.longitude > 180:
                frappe.throw(
                    _("Longitude must be between -180 and 180 degrees. Got {0}").format(
                        self.longitude
                    )
                )

    def validate_erpnext_warehouse(self):
        """Validate ERPNext warehouse link if provided."""
        if self.erpnext_warehouse:
            is_active = frappe.db.get_value("Warehouse", self.erpnext_warehouse, "disabled")
            if is_active:
                frappe.throw(
                    _("ERPNext Warehouse {0} is disabled. Please select an active warehouse.").format(
                        self.erpnext_warehouse
                    )
                )

    def get_full_address(self):
        """Return the full address as a formatted string."""
        parts = []

        if self.street_address:
            parts.append(self.street_address)

        if self.building_info:
            parts.append(self.building_info)

        if self.neighborhood_name:
            parts.append(self.neighborhood_name + " Mah.")

        if self.district_name:
            parts.append(self.district_name)

        if self.city_name:
            parts.append(self.city_name)

        if self.postal_code:
            parts.append(self.postal_code)

        return ", ".join(parts) if parts else ""

    def get_display_title(self):
        """Return a display title for the location."""
        if self.location_name:
            return self.location_name

        parts = []
        if self.location_type:
            parts.append(self.location_type)
        if self.city_name:
            parts.append(self.city_name)
        if self.district_name:
            parts.append(self.district_name)

        return " - ".join(parts) if parts else _("Unnamed Location")
