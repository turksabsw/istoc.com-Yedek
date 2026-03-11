app_name = "tradehub_catalog"
app_title = "TradeHub Catalog"
app_publisher = "TradeHub Team"
app_description = "Product Information Management (PIM) layer for TradeHub Marketplace"
app_email = "dev@tradehub.local"
app_license = "MIT"
app_icon = "octicon octicon-package"
app_color = "#28A745"

# Dependencies - tradehub_core provides tenant isolation and ECA
required_apps = ["tradehub_core"]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/tradehub_catalog/css/category_icon.css"
app_include_js = "/assets/tradehub_catalog/js/category_icon.js"

# include js, css files in header of web template
# web_include_css = "/assets/tradehub_catalog/css/tradehub_catalog.css"
# web_include_js = "/assets/tradehub_catalog/js/tradehub_catalog.js"

# include custom scss in every website theme (without signing in)
# website_theme_scss = "tradehub_catalog/public/scss/website"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# -----

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "tradehub_catalog.utils.jinja_methods",
# 	"filters": "tradehub_catalog.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "tradehub_catalog.install.before_install"
# after_install = "tradehub_catalog.install.after_install"

# Uninstallation
# --------------

# before_uninstall = "tradehub_catalog.uninstall.before_uninstall"
# after_uninstall = "tradehub_catalog.uninstall.after_uninstall"

# Desk Notifications
# ------------------

# See frappe.core.notifications.get_notification_config

# notification_config = "tradehub_catalog.notifications.get_notification_config"

# Permissions
# -----------

# Permissions evaluated in scripted ways

permission_query_conditions = {
	"Seller Custom Category": "tradehub_catalog.tradehub_catalog.doctype.seller_custom_category.seller_custom_category.get_permission_query_conditions",
	"Category Proposal": "tradehub_catalog.tradehub_catalog.doctype.category_proposal.category_proposal.get_permission_query_conditions",
	"Brand Gating": "tradehub_catalog.tradehub_catalog.permissions.brand_gating_conditions",
	"Brand Ownership Claim": "tradehub_catalog.tradehub_catalog.permissions.brand_ownership_claim_conditions",
	"Brand Authorization Request": "tradehub_catalog.tradehub_catalog.permissions.brand_authorization_request_conditions",
	"Variant Request": "tradehub_catalog.tradehub_catalog.permissions.variant_request_conditions",
}

has_permission = {
	"Seller Custom Category": "tradehub_catalog.tradehub_catalog.doctype.seller_custom_category.seller_custom_category.has_permission",
	"Category Proposal": "tradehub_catalog.tradehub_catalog.doctype.category_proposal.category_proposal.has_permission",
	"Brand": "tradehub_catalog.tradehub_catalog.permissions.brand_has_permission",
	"Brand Gating": "tradehub_catalog.tradehub_catalog.permissions.brand_gating_has_permission",
	"Variant Request": "tradehub_catalog.tradehub_catalog.permissions.variant_request_has_permission",
}

# DocType Class
# -------------

# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------

# Hook on document methods and events

# doc_events = {
# 	"Product": {
# 		"on_update": "tradehub_catalog.doctype.product.product.on_update"
# 	}
# }

# Scheduled Tasks
# ---------------

# Catalog-specific scheduled tasks: media_processor and ranking
# These tasks are moved from the monolithic tr_tradehub app during decomposition
scheduler_events = {
	"hourly": [
		"tradehub_catalog.tasks.media_processor"
	],
	"daily": [
		"tradehub_catalog.tasks.ranking",
		"tradehub_catalog.tradehub_catalog.doctype.category_proposal.category_proposal.remind_pending_proposals",
		"tradehub_catalog.variant_request.tasks.recalculate_demand_aggregations"
	]
}

# Testing
# -------

# before_tests = "tradehub_catalog.install.before_tests"

# Overriding Methods
# ------------------------------

# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "tradehub_catalog.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "tradehub_catalog.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Request Events
# --------------

# before_request = ["tradehub_catalog.utils.before_request"]
# after_request = ["tradehub_catalog.utils.after_request"]

# Job Events
# ----------

# before_job = ["tradehub_catalog.utils.before_job"]
# after_job = ["tradehub_catalog.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"tradehub_catalog.auth.validate"
# ]

# Fixtures
# --------

# Ordered fixtures for Category Proposal workflow system.
# Workflow State and Workflow Action Master must be loaded before Workflow.
fixtures = [
	"Workflow State",
	"Workflow Action Master",
	{"dt": "Workflow", "filters": [["document_type", "=", "Category Proposal"]]},
	{"dt": "Notification", "filters": [["document_type", "=", "Category Proposal"]]},
]
