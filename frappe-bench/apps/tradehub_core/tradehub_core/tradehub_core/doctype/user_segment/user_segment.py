# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

"""
User Segment controller with evaluation engine.

Implements segment rule evaluation using AND/OR logic across
rule groups and conditions. Follows the flat child table pattern
where Segment Rule Condition references Segment Rule Group via rule_group_idx.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, cint, flt
from typing import Dict, Any, List, Optional


# Operator mapping for condition evaluation (mirrors rule_engine.py pattern)
OPERATORS: Dict[str, Any] = {
    "=": lambda a, b: str(a) == str(b) if a is not None else False,
    "!=": lambda a, b: str(a) != str(b) if a is not None else False,
    ">": lambda a, b: flt(a) > flt(b) if a is not None else False,
    "<": lambda a, b: flt(a) < flt(b) if a is not None else False,
    ">=": lambda a, b: flt(a) >= flt(b) if a is not None else False,
    "<=": lambda a, b: flt(a) <= flt(b) if a is not None else False,
    "contains": lambda a, b: str(b).lower() in str(a).lower() if a else False,
    "not contains": lambda a, b: str(b).lower() not in str(a).lower() if a else True,
    "in": lambda a, b: str(a).lower() in [v.strip().lower() for v in str(b).split(",")] if a else False,
    "not in": lambda a, b: str(a).lower() not in [v.strip().lower() for v in str(b).split(",")] if a else True,
    "is set": lambda a, b: a is not None and a != "",
    "is not set": lambda a, b: a is None or a == "",
}

# Data source to DocType mapping
DATA_SOURCE_DOCTYPE_MAP = {
    "Buyer Profile": "Buyer Profile",
    "Seller Metrics": "Seller Metrics",
    "Marketplace Order": "Marketplace Order",
    "Buyer Feedback": "Buyer Feedback",
    "Seller Feedback": "Seller Feedback",
    "Customer Grade": "Customer Grade",
    "Buyer KPI Score Log": "Buyer KPI Score Log",
}


class UserSegment(Document):
    """User Segment for dynamic segmentation of buyers and sellers.

    Supports:
    - AND/OR logic at group level (group_logic)
    - AND/OR logic within each group (condition_logic on Segment Rule Group)
    - Flat child table architecture (conditions reference groups via rule_group_idx)
    - On-save preview count via update_preview_count()
    - Full evaluation engine for scheduled refresh
    """

    def before_insert(self):
        """Set defaults on creation."""
        if not self.created_by:
            self.created_by = frappe.session.user
        self.created_at = now_datetime()

    def validate(self):
        """Validate segment configuration and update preview count."""
        self._guard_system_fields()
        self.validate_segment_code()
        self.validate_rule_group_references()
        self.update_preview_count()

    def _guard_system_fields(self):
        """Prevent modification of system-calculated fields via form submission."""
        if self.is_new():
            return

        guarded_fields = [
            "member_count",
            "last_refreshed",
            "last_refresh_duration",
        ]
        old_doc = self.get_doc_before_save()
        if not old_doc:
            return

        for field in guarded_fields:
            if self.get(field) != old_doc.get(field):
                self.set(field, old_doc.get(field))

    def validate_segment_code(self):
        """Ensure segment_code is uppercase and contains only valid characters."""
        if self.segment_code:
            self.segment_code = self.segment_code.strip().upper().replace(" ", "_")

    def validate_rule_group_references(self):
        """Validate that all conditions reference valid rule group indices."""
        if not self.rule_groups or not self.conditions:
            return

        valid_indices = {group.idx for group in self.rule_groups}

        for condition in self.conditions:
            if condition.rule_group_idx and condition.rule_group_idx not in valid_indices:
                frappe.throw(
                    _("Condition row {0}: rule_group_idx {1} does not match any Rule Group row. "
                      "Valid indices: {2}").format(
                        condition.idx, condition.rule_group_idx, sorted(valid_indices)
                    )
                )

    def update_preview_count(self):
        """Calculate and set member_count_preview based on current rules.

        Called during validate() to give users a preview of how many
        members would match the current segment configuration.
        """
        try:
            matching_members = self.evaluate_segment()
            self.member_count_preview = len(matching_members)
        except Exception as e:
            frappe.log_error(
                message=f"Error calculating preview count for segment {self.name}: {str(e)}",
                title="Segment Preview Count Error"
            )
            self.member_count_preview = 0

    def evaluate_segment(self) -> List[str]:
        """Evaluate segment rules and return list of matching member IDs.

        Returns:
            List of member IDs (Buyer Profile or Seller Profile names)
            that match the segment rules.
        """
        if not self.rule_groups or not self.conditions:
            return []

        # Get all candidate members based on target_type
        candidates = self._get_candidates()
        if not candidates:
            return []

        matching = []
        for candidate in candidates:
            try:
                context = self._get_member_context(candidate)
                if context and self._evaluate_rules(context):
                    matching.append(candidate)
            except Exception as e:
                frappe.log_error(
                    message=f"Error evaluating segment rules for {candidate}: {str(e)}",
                    title="Segment Evaluation Error"
                )

        return matching

    def _get_candidates(self) -> List[str]:
        """Get all candidate member IDs based on target_type."""
        if self.target_type == "Buyer":
            return frappe.get_all(
                "Buyer Profile",
                filters={"docstatus": ["!=", 2]},
                pluck="name",
                limit=0
            )
        elif self.target_type == "Seller":
            return frappe.get_all(
                "Seller Profile",
                filters={"status": ["!=", "Suspended"]},
                pluck="name",
                limit=0
            )
        return []

    def _get_member_context(self, member_id: str) -> Optional[Dict[str, Any]]:
        """Build context dict for a member by fetching data from all relevant data sources.

        Args:
            member_id: The member's document name (Buyer Profile or Seller Profile)

        Returns:
            Dict of field values from all relevant data sources, or None on error.
        """
        context = {}

        # Determine which data sources are used in conditions
        data_sources = set()
        for condition in self.conditions:
            if condition.data_source:
                data_sources.add(condition.data_source)

        for data_source in data_sources:
            try:
                source_data = self._fetch_data_source(data_source, member_id)
                if source_data:
                    context.update(source_data)
            except Exception as e:
                frappe.log_error(
                    message=f"Error fetching {data_source} for {member_id}: {str(e)}",
                    title="Segment Data Source Error"
                )

        return context if context else None

    def _fetch_data_source(self, data_source: str, member_id: str) -> Optional[Dict[str, Any]]:
        """Fetch data from a specific data source for a member.

        Args:
            data_source: The data source name (e.g., 'Buyer Profile', 'Seller Metrics')
            member_id: The member's document name

        Returns:
            Dict of field values from the data source, or None if not found.
        """
        doctype = DATA_SOURCE_DOCTYPE_MAP.get(data_source)
        if not doctype:
            return None

        # Direct profile fetch
        if data_source in ("Buyer Profile", "Seller Metrics"):
            if data_source == "Buyer Profile" and self.target_type == "Buyer":
                try:
                    doc = frappe.get_doc("Buyer Profile", member_id)
                    return doc.as_dict()
                except frappe.DoesNotExistError:
                    return None

            elif data_source == "Seller Metrics" and self.target_type == "Seller":
                # Seller Metrics is linked to Seller Profile
                metrics = frappe.get_all(
                    "Seller Metrics",
                    filters={"seller": member_id},
                    fields=["*"],
                    limit=1
                )
                return metrics[0] if metrics else None

        # Aggregate data sources — get the latest record
        if data_source == "Customer Grade":
            grades = frappe.get_all(
                "Customer Grade",
                filters={"buyer": member_id, "status": "Finalized"},
                fields=["*"],
                order_by="calculation_date desc",
                limit=1
            )
            return grades[0] if grades else None

        if data_source == "Buyer KPI Score Log":
            logs = frappe.get_all(
                "Buyer KPI Score Log",
                filters={"buyer": member_id, "status": "Finalized"},
                fields=["*"],
                order_by="calculation_date desc",
                limit=1
            )
            return logs[0] if logs else None

        # Feedback data sources — get aggregate counts
        if data_source in ("Buyer Feedback", "Seller Feedback"):
            count = frappe.db.count(doctype, filters=self._get_feedback_filters(data_source, member_id))
            return {"feedback_count": count}

        if data_source == "Marketplace Order":
            # Get aggregate order data
            return self._get_order_aggregates(member_id)

        return None

    def _get_feedback_filters(self, data_source: str, member_id: str) -> Dict[str, Any]:
        """Get filters for feedback data source queries."""
        if data_source == "Buyer Feedback" and self.target_type == "Seller":
            return {"seller": member_id}
        elif data_source == "Seller Feedback" and self.target_type == "Buyer":
            return {"buyer": member_id}
        return {}

    def _get_order_aggregates(self, member_id: str) -> Optional[Dict[str, Any]]:
        """Get aggregate order data for a member."""
        if not frappe.db.exists("DocType", "Marketplace Order"):
            return None

        field = "buyer" if self.target_type == "Buyer" else "seller"
        orders = frappe.get_all(
            "Marketplace Order",
            filters={field: member_id},
            fields=["count(name) as order_count", "sum(total_amount) as total_amount"],
        )
        if orders:
            return {
                "order_count": cint(orders[0].get("order_count")),
                "total_amount": flt(orders[0].get("total_amount")),
            }
        return None

    def _evaluate_rules(self, context: Dict[str, Any]) -> bool:
        """Evaluate all rule groups against a member context.

        Groups conditions by rule_group_idx, evaluates each group using
        its condition_logic (AND/OR), then combines group results using
        the segment's group_logic (AND/OR).

        Args:
            context: Dict of field values for the member

        Returns:
            bool: True if member matches segment rules
        """
        if not self.rule_groups:
            return True

        # Build a map of group_idx → group doc
        group_map = {}
        for group in self.rule_groups:
            if cint(group.enabled):
                group_map[group.idx] = group

        if not group_map:
            return True  # All groups disabled = passes

        # Group conditions by rule_group_idx
        conditions_by_group: Dict[int, List] = {}
        for condition in self.conditions:
            group_idx = cint(condition.rule_group_idx)
            if group_idx in group_map:
                conditions_by_group.setdefault(group_idx, []).append(condition)

        # Evaluate each group
        group_results = []
        for group_idx, group in sorted(group_map.items()):
            group_conditions = conditions_by_group.get(group_idx, [])
            if not group_conditions:
                group_results.append(True)  # Empty group passes
                continue

            group_result = self._evaluate_group(group, group_conditions, context)
            group_results.append(group_result)

        if not group_results:
            return True

        # Combine group results using segment-level group_logic
        logic = (self.group_logic or "AND").upper()
        if logic == "AND":
            return all(group_results)
        else:  # OR
            return any(group_results)

    def _evaluate_group(
        self,
        group,
        conditions: List,
        context: Dict[str, Any]
    ) -> bool:
        """Evaluate a single rule group's conditions.

        Args:
            group: Segment Rule Group row
            conditions: List of Segment Rule Condition rows for this group
            context: Dict of field values for the member

        Returns:
            bool: True if group conditions are satisfied
        """
        condition_logic = (group.condition_logic or "AND").upper()

        results = []
        for condition in conditions:
            result = self._evaluate_condition(condition, context)
            results.append(result)

        if not results:
            return True

        if condition_logic == "AND":
            return all(results)
        else:  # OR
            return any(results)

    def _evaluate_condition(self, condition, context: Dict[str, Any]) -> bool:
        """Evaluate a single condition against the member context.

        Args:
            condition: Segment Rule Condition row
            context: Dict of field values for the member

        Returns:
            bool: True if condition is met
        """
        field_name = condition.field_name
        operator = condition.operator
        expected_value = condition.value

        if not field_name or not operator:
            frappe.log_error(
                message=f"Invalid segment condition: missing field_name or operator. "
                        f"Condition idx: {condition.idx}",
                title="Segment Condition Error"
            )
            return False

        if operator not in OPERATORS:
            frappe.log_error(
                message=f"Unknown operator: {operator} in condition idx: {condition.idx}",
                title="Segment Condition Error"
            )
            return False

        actual_value = context.get(field_name)

        try:
            return OPERATORS[operator](actual_value, expected_value)
        except Exception as e:
            frappe.log_error(
                message=f"Error evaluating segment condition: field={field_name}, "
                        f"operator={operator}, value={expected_value}, "
                        f"actual={actual_value}, error={str(e)}",
                title="Segment Condition Error"
            )
            return False
