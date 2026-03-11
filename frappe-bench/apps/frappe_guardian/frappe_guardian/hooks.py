app_name = "frappe_guardian"
app_title = "Frappe Guardian"
app_publisher = "Frappe"
app_description = "Background utility for DocType protection"
app_email = "info@frappe.io"
app_license = "mit"

# Guardian runs silently - no UI elements
# Workspace will be removed

# Dynamic DocType protection - prevents orphan deletion
def get_override_doctype_class():
    try:
        from frappe_guardian.utils.doctype_protection import get_all_child_table_overrides
        return get_all_child_table_overrides()
    except:
        return {}

override_doctype_class = get_override_doctype_class()

# Restore missing DocTypes after every migrate
after_migrate = ["frappe_guardian.utils.doctype_protection.sync_missing_doctypes"]
