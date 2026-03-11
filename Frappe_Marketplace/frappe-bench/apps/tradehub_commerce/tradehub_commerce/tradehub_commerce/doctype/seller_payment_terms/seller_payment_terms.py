# Copyright (c) 2024, TR TradeHub and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class SellerPaymentTerms(Document):
    """
    Seller Payment Terms DocType for TR-TradeHub.

    Defines seller-specific payment terms with priority-based rule resolution.
    Each seller can have multiple rules that are evaluated in priority order
    to determine the applicable payment terms template for a transaction.
    """

    def validate(self):
        """Validate seller payment terms."""
        self.validate_default_uniqueness()
        self.validate_rules()
        self.validate_default_template()

    def validate_default_uniqueness(self):
        """Ensure only one default payment terms config per seller."""
        if not self.is_default:
            return

        existing = frappe.db.exists(
            "Seller Payment Terms",
            {
                "seller": self.seller,
                "is_default": 1,
                "name": ("!=", self.name),
            },
        )
        if existing:
            frappe.throw(
                _("Seller {0} already has a default payment terms configuration: {1}").format(
                    self.seller, existing
                )
            )

    def validate_rules(self):
        """Validate rule priorities and required fields."""
        if not self.rules:
            return

        priorities = []
        for rule in self.rules:
            if rule.priority < 0:
                frappe.throw(_("Rule priority cannot be negative (Row {0}).").format(rule.idx))

            if not rule.marketplace_payment_terms_template:
                frappe.throw(
                    _("Payment Terms Template is required for each rule (Row {0}).").format(rule.idx)
                )

            if rule.min_amount and flt(rule.min_amount) < 0:
                frappe.throw(
                    _("Minimum Amount cannot be negative (Row {0}).").format(rule.idx)
                )

            priorities.append(rule.priority)

        # Warn about duplicate priorities
        if len(priorities) != len(set(priorities)):
            frappe.msgprint(
                _("Duplicate rule priorities found. Rules with the same priority "
                  "will be evaluated in row order."),
                indicator="orange",
                alert=True,
            )

    def validate_default_template(self):
        """Validate that default template is active if set."""
        if not self.default_template:
            return

        is_active = frappe.db.get_value(
            "Marketplace Payment Terms Template", self.default_template, "is_active"
        )
        if not is_active:
            frappe.throw(
                _("Default Template {0} is not active.").format(self.default_template)
            )

    def resolve_payment_terms(self, buyer_group=None, amount=None, currency=None, product_category=None):
        """
        Resolve the applicable payment terms template based on rules.

        Rules are evaluated in priority order (lower number = higher priority).
        The first rule whose conditions all match is used.
        If no rule matches, the default_template is returned.

        Args:
            buyer_group: Buyer group identifier
            amount: Order/transaction amount
            currency: Currency code
            product_category: Product category

        Returns:
            str: Name of the matching Marketplace Payment Terms Template, or None
        """
        if self.status != "Active":
            return None

        # Sort rules by priority (ascending), then by idx for tie-breaking
        sorted_rules = sorted(self.rules, key=lambda r: (r.priority, r.idx))

        for rule in sorted_rules:
            if self._rule_matches(rule, buyer_group, amount, currency, product_category):
                return rule.marketplace_payment_terms_template

        # Fallback to default template
        return self.default_template

    @staticmethod
    def _rule_matches(rule, buyer_group=None, amount=None, currency=None, product_category=None):
        """
        Check if a rule's conditions match the given parameters.

        A condition is only checked if the rule specifies it (non-empty).
        All specified conditions must match for the rule to apply.

        Returns:
            bool: True if all specified conditions match
        """
        if rule.buyer_group and rule.buyer_group != buyer_group:
            return False

        if rule.min_amount and flt(amount or 0) < flt(rule.min_amount):
            return False

        if rule.currency and rule.currency != currency:
            return False

        if rule.product_category and rule.product_category != product_category:
            return False

        return True
