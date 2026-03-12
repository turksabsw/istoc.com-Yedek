import frappe


# Seller KPI Template: 10 metrics, weights sum to 100
SELLER_KPI_ITEMS = [
	{
		"kpi_name": "Order Defect Rate",
		"kpi_code": "ODR",
		"metric_type": "Percentage",
		"weight": 15,
		"is_active": 1,
		"display_order": 1,
		"data_source": "Sub Order",
		"threshold_type": "Lower is Better",
		"target_value": 1.0,
		"warning_threshold": 2.0,
		"critical_threshold": 5.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders with defects (claims, chargebacks, negative feedback)",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "On-Time Delivery Rate",
		"kpi_code": "ON_TIME_DELIVERY",
		"metric_type": "Percentage",
		"weight": 15,
		"is_active": 1,
		"display_order": 2,
		"data_source": "Sub Order",
		"threshold_type": "Higher is Better",
		"target_value": 97.0,
		"warning_threshold": 90.0,
		"critical_threshold": 80.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Percentage of orders delivered on or before the estimated delivery date",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Late Shipment Rate",
		"kpi_code": "LSR",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 3,
		"data_source": "Sub Order",
		"threshold_type": "Lower is Better",
		"target_value": 2.0,
		"warning_threshold": 5.0,
		"critical_threshold": 10.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders shipped after the expected ship date",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Return Rate",
		"kpi_code": "RETURN_RATE",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 4,
		"data_source": "Return Request",
		"threshold_type": "Lower is Better",
		"target_value": 3.0,
		"warning_threshold": 8.0,
		"critical_threshold": 15.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders returned by buyers",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Cancellation Rate",
		"kpi_code": "CANCEL_RATE",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 5,
		"data_source": "Sub Order",
		"threshold_type": "Lower is Better",
		"target_value": 2.0,
		"warning_threshold": 5.0,
		"critical_threshold": 10.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders cancelled by the seller",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Average Rating",
		"kpi_code": "AVG_RATING",
		"metric_type": "Average",
		"weight": 15,
		"is_active": 1,
		"display_order": 6,
		"data_source": "Review",
		"threshold_type": "Higher is Better",
		"target_value": 4.5,
		"warning_threshold": 3.5,
		"critical_threshold": 2.5,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Average star rating from buyer reviews (1-5 scale)",
		"unit": "stars",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Average Response Time",
		"kpi_code": "RESPONSE_TIME",
		"metric_type": "Average",
		"weight": 5,
		"is_active": 1,
		"display_order": 7,
		"data_source": "Message",
		"threshold_type": "Lower is Better",
		"target_value": 4.0,
		"warning_threshold": 12.0,
		"critical_threshold": 24.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Average time in hours to respond to buyer messages",
		"unit": "hours",
		"decimal_places": 1,
	},
	{
		"kpi_name": "Complaint Rate",
		"kpi_code": "COMPLAINT_RATE",
		"metric_type": "Percentage",
		"weight": 5,
		"is_active": 1,
		"display_order": 8,
		"data_source": "Dispute",
		"threshold_type": "Lower is Better",
		"target_value": 1.0,
		"warning_threshold": 3.0,
		"critical_threshold": 5.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders resulting in buyer complaints",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Repeat Customer Rate",
		"kpi_code": "REPEAT_RATE",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 9,
		"data_source": "Sub Order",
		"threshold_type": "Higher is Better",
		"target_value": 30.0,
		"warning_threshold": 15.0,
		"critical_threshold": 5.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Percentage of orders from repeat buyers",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Positive Feedback Percentage",
		"kpi_code": "POS_FEEDBACK",
		"metric_type": "Percentage",
		"weight": 5,
		"is_active": 1,
		"display_order": 10,
		"data_source": "Review",
		"threshold_type": "Higher is Better",
		"target_value": 95.0,
		"warning_threshold": 85.0,
		"critical_threshold": 70.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Percentage of feedback that is positive (4-5 stars)",
		"unit": "%",
		"decimal_places": 2,
	},
]

# Buyer KPI Template: 9 metrics, weights sum to 100
BUYER_KPI_ITEMS = [
	{
		"kpi_name": "Total Spend",
		"kpi_code": "TOTAL_SPEND",
		"metric_type": "Sum",
		"weight": 20,
		"is_active": 1,
		"display_order": 1,
		"data_source": "Marketplace Order",
		"threshold_type": "Higher is Better",
		"target_value": 10000.0,
		"warning_threshold": 2000.0,
		"critical_threshold": 500.0,
		"scoring_method": "Logarithmic",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Total amount spent by the buyer across all orders",
		"unit": "TRY",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Order Frequency",
		"kpi_code": "ORDER_FREQ",
		"metric_type": "Rate",
		"weight": 15,
		"is_active": 1,
		"display_order": 2,
		"data_source": "Marketplace Order",
		"threshold_type": "Higher is Better",
		"target_value": 4.0,
		"warning_threshold": 1.5,
		"critical_threshold": 0.5,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Average number of orders placed per month",
		"unit": "orders/month",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Payment On-Time Rate",
		"kpi_code": "PAYMENT_ON_TIME",
		"metric_type": "Percentage",
		"weight": 15,
		"is_active": 1,
		"display_order": 3,
		"data_source": "Marketplace Order",
		"threshold_type": "Higher is Better",
		"target_value": 100.0,
		"warning_threshold": 80.0,
		"critical_threshold": 50.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Percentage of payments made on or before due date",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Buyer Return Rate",
		"kpi_code": "BUYER_RETURN_RATE",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 4,
		"data_source": "Return Request",
		"threshold_type": "Lower is Better",
		"target_value": 0.0,
		"warning_threshold": 10.0,
		"critical_threshold": 20.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders returned by the buyer",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Average Order Value",
		"kpi_code": "AVG_ORDER_VAL",
		"metric_type": "Average",
		"weight": 10,
		"is_active": 1,
		"display_order": 5,
		"data_source": "Marketplace Order",
		"threshold_type": "Higher is Better",
		"target_value": 1000.0,
		"warning_threshold": 300.0,
		"critical_threshold": 100.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Average monetary value per order placed",
		"unit": "TRY",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Buyer Dispute Rate",
		"kpi_code": "BUYER_DISPUTE_RATE",
		"metric_type": "Percentage",
		"weight": 10,
		"is_active": 1,
		"display_order": 6,
		"data_source": "Dispute",
		"threshold_type": "Lower is Better",
		"target_value": 0.0,
		"warning_threshold": 5.0,
		"critical_threshold": 10.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Percentage of orders resulting in disputes filed by the buyer",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Feedback Rate",
		"kpi_code": "FEEDBACK_RATE",
		"metric_type": "Percentage",
		"weight": 5,
		"is_active": 1,
		"display_order": 7,
		"data_source": "Review",
		"threshold_type": "Higher is Better",
		"target_value": 100.0,
		"warning_threshold": 50.0,
		"critical_threshold": 20.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Percentage of completed orders for which the buyer left feedback",
		"unit": "%",
		"decimal_places": 2,
	},
	{
		"kpi_name": "Account Age",
		"kpi_code": "ACCOUNT_AGE",
		"metric_type": "Count",
		"weight": 10,
		"is_active": 1,
		"display_order": 8,
		"data_source": "Custom Query",
		"threshold_type": "Higher is Better",
		"target_value": 730.0,
		"warning_threshold": 180.0,
		"critical_threshold": 30.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 0,
		"bonus_multiplier": 1,
		"description": "Number of days since buyer account registration",
		"unit": "days",
		"decimal_places": 0,
	},
	{
		"kpi_name": "Last Activity",
		"kpi_code": "LAST_ACTIVITY",
		"metric_type": "Count",
		"weight": 5,
		"is_active": 1,
		"display_order": 9,
		"data_source": "Custom Query",
		"threshold_type": "Lower is Better",
		"target_value": 7.0,
		"warning_threshold": 30.0,
		"critical_threshold": 90.0,
		"scoring_method": "Linear",
		"max_score": 100,
		"invert_score": 1,
		"bonus_multiplier": 1,
		"description": "Number of days since the buyer last placed an order or interacted",
		"unit": "days",
		"decimal_places": 0,
	},
]


def execute():
	"""Idempotent seed script for default KPI Template records.

	Creates two KPI Template records in the existing KPI Template DocType:
	  - STD_SELLER_SCORE (target_type=Seller, 10 metrics, total weight=100)
	  - STD_BUYER_SCORE (target_type=Buyer, 9 metrics, total weight=100)

	Safe to run multiple times — skips creation if a template with the
	same name already exists.
	"""
	_seed_seller_kpi_template()
	_seed_buyer_kpi_template()
	frappe.db.commit()


def _seed_seller_kpi_template():
	"""Seed STD_SELLER_SCORE KPI Template with 10 seller metrics."""
	template_name = "Standard Seller Score"

	if frappe.db.exists("KPI Template", template_name):
		return

	doc = frappe.new_doc("KPI Template")
	doc.template_name = template_name
	doc.template_code = "STD_SELLER_SCORE"
	doc.target_type = "Seller"
	doc.status = "Active"
	doc.is_default = 1
	doc.version = "1.0"
	doc.evaluation_period = "Monthly"
	doc.evaluation_frequency = "Weekly"
	doc.auto_evaluate = 1
	doc.passing_score = 60
	doc.scoring_curve = "Linear"
	doc.normalize_scores = 1
	doc.display_name = "Standard Seller Score"
	doc.description = "Default KPI template for evaluating seller performance across 10 key metrics"

	for item_data in SELLER_KPI_ITEMS:
		doc.append("items", item_data)

	doc.total_weight = 100
	doc.insert(ignore_permissions=True)


def _seed_buyer_kpi_template():
	"""Seed STD_BUYER_SCORE KPI Template with 9 buyer metrics."""
	template_name = "Standard Buyer Score"

	if frappe.db.exists("KPI Template", template_name):
		return

	doc = frappe.new_doc("KPI Template")
	doc.template_name = template_name
	doc.template_code = "STD_BUYER_SCORE"
	doc.target_type = "Buyer"
	doc.status = "Active"
	doc.is_default = 1
	doc.version = "1.0"
	doc.evaluation_period = "Monthly"
	doc.evaluation_frequency = "Weekly"
	doc.auto_evaluate = 1
	doc.passing_score = 60
	doc.scoring_curve = "Linear"
	doc.normalize_scores = 1
	doc.display_name = "Standard Buyer Score"
	doc.description = "Default KPI template for evaluating buyer performance across 9 key metrics"

	for item_data in BUYER_KPI_ITEMS:
		doc.append("items", item_data)

	doc.total_weight = 100
	doc.insert(ignore_permissions=True)
