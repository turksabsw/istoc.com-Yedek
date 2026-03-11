"""Create Buyer and Seller marketplace roles.

Usage:
    bench --site marketplace.local execute tr_tradehub.setup.create_marketplace_roles.execute
"""

import frappe


def execute():
    """Create Buyer and Seller roles with Desk Access: 0.

    These roles prevent marketplace users from accessing the /app admin panel.
    Safe to run multiple times — skips roles that already exist.
    """
    roles = [
        {"role_name": "Buyer", "desk_access": 0},
        {"role_name": "Seller", "desk_access": 0},
    ]

    for role_data in roles:
        role_name = role_data["role_name"]

        if frappe.db.exists("Role", role_name):
            # Ensure desk_access is 0 even if role already exists
            current_desk_access = frappe.db.get_value("Role", role_name, "desk_access")
            if current_desk_access:
                frappe.db.set_value("Role", role_name, "desk_access", 0)
                frappe.logger().info(f"Updated {role_name} role: set desk_access=0")
            else:
                frappe.logger().info(f"Role {role_name} already exists with desk_access=0")
            continue

        role_doc = frappe.get_doc({
            "doctype": "Role",
            "role_name": role_name,
            "desk_access": 0,
            "is_custom": 1,
            "two_factor_auth": 0,
        })
        role_doc.flags.ignore_permissions = True
        role_doc.insert(ignore_if_duplicate=True)
        frappe.logger().info(f"Created role: {role_name} (desk_access=0)")

    frappe.db.commit()
