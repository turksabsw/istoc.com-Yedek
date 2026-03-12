# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

"""
Segment Member DocType Controller

Manages membership of buyers and sellers in User Segments.
Handles upsert logic to prevent SC-10 (unique index violation)
and maintains the UNIQUE composite constraint on
(segment, member_type, member_id, is_active).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


# Maps member_type Select values to actual DocType names
MEMBER_TYPE_DOCTYPE_MAP = {
    "Buyer": "Buyer Profile",
    "Seller": "Seller Profile",
}


class SegmentMember(Document):
    """Controller for Segment Member DocType.

    Tracks membership of buyers/sellers in User Segments with
    source tracking (Rule or Manual), active/inactive status,
    and join/leave timestamps.
    """

    def before_insert(self):
        """Set defaults on creation."""
        if not self.joined_at:
            self.joined_at = now_datetime()
        self._set_member_doctype()
        self._check_duplicate()
        self._set_unique_key()

    def validate(self):
        """Validate membership data."""
        self._set_member_doctype()
        self._validate_member_type()
        self._validate_member_exists()
        self._check_duplicate()
        self._set_unique_key()
        self._sync_active_timestamps()

    def _set_unique_key(self):
        """Set composite unique key for DB-level uniqueness enforcement."""
        if self.segment and self.member_type and self.member_id:
            self.unique_key = f"{self.segment}|{self.member_type}|{self.member_id}"

    def _set_member_doctype(self):
        """Auto-set member_doctype from member_type for Dynamic Link resolution."""
        if self.member_type:
            self.member_doctype = MEMBER_TYPE_DOCTYPE_MAP.get(self.member_type, "")

    def _validate_member_type(self):
        """Validate member_type is a recognized value."""
        if self.member_type and self.member_type not in MEMBER_TYPE_DOCTYPE_MAP:
            frappe.throw(
                _("Invalid Member Type '{0}'. Must be one of: {1}").format(
                    self.member_type, ", ".join(MEMBER_TYPE_DOCTYPE_MAP.keys())
                )
            )

    def _validate_member_exists(self):
        """Validate that the referenced member document exists."""
        if self.member_doctype and self.member_id:
            if not frappe.db.exists(self.member_doctype, self.member_id):
                frappe.throw(
                    _("{0} '{1}' does not exist").format(
                        self.member_type, self.member_id
                    )
                )

    def _check_duplicate(self):
        """Enforce UNIQUE composite on (segment, member_type, member_id, is_active).

        Prevents SC-10: Segment Member unique index violation.
        """
        if not self.segment or not self.member_type or not self.member_id:
            return

        filters = {
            "segment": self.segment,
            "member_type": self.member_type,
            "member_id": self.member_id,
            "is_active": self.is_active,
            "name": ["!=", self.name or ""],
        }
        existing = frappe.db.exists("Segment Member", filters)
        if existing:
            frappe.throw(
                _("Membership already exists for {0} '{1}' in segment '{2}' "
                  "with is_active={3}").format(
                    self.member_type, self.member_id, self.segment,
                    self.is_active
                )
            )

    def _sync_active_timestamps(self):
        """Keep joined_at/left_at in sync with is_active status."""
        if not self.is_new():
            old_doc = self.get_doc_before_save()
            if old_doc and old_doc.is_active and not self.is_active:
                # Deactivated — record left_at
                if not self.left_at:
                    self.left_at = now_datetime()
            elif old_doc and not old_doc.is_active and self.is_active:
                # Reactivated — update joined_at, clear left_at
                self.joined_at = now_datetime()
                self.left_at = None


def upsert_segment_member(segment, member_type, member_id, source="Rule"):
    """Add or reactivate a segment member (SC-10 safe).

    Checks for existing records before inserting to avoid unique
    constraint violations. If an inactive record exists, it is
    reactivated instead of creating a new one.

    Args:
        segment: User Segment name
        member_type: "Buyer" or "Seller"
        member_id: Buyer Profile or Seller Profile name
        source: "Rule" or "Manual"

    Returns:
        str: Segment Member document name
    """
    # Check for any existing record (active or inactive)
    existing = frappe.get_all(
        "Segment Member",
        filters={
            "segment": segment,
            "member_type": member_type,
            "member_id": member_id,
        },
        fields=["name", "is_active"],
        limit=1,
    )

    if existing:
        member = existing[0]
        if not member.is_active:
            # Reactivate inactive member
            frappe.db.set_value("Segment Member", member.name, {
                "is_active": 1,
                "joined_at": now_datetime(),
                "left_at": None,
                "source": source,
            })
        return member.name

    # Create new membership
    doc = frappe.get_doc({
        "doctype": "Segment Member",
        "segment": segment,
        "member_type": member_type,
        "member_id": member_id,
        "source": source,
        "is_active": 1,
    })
    doc.insert(ignore_permissions=True)
    return doc.name


def deactivate_segment_member(segment, member_type, member_id):
    """Deactivate a segment member (mark as left).

    Args:
        segment: User Segment name
        member_type: "Buyer" or "Seller"
        member_id: Buyer Profile or Seller Profile name

    Returns:
        str or None: Segment Member name if found and deactivated, None otherwise
    """
    existing = frappe.get_all(
        "Segment Member",
        filters={
            "segment": segment,
            "member_type": member_type,
            "member_id": member_id,
            "is_active": 1,
        },
        fields=["name"],
        limit=1,
    )

    if existing:
        frappe.db.set_value("Segment Member", existing[0].name, {
            "is_active": 0,
            "left_at": now_datetime(),
        })
        return existing[0].name

    return None


def sync_segment_members(segment, member_type, matching_ids, source="Rule"):
    """Synchronize segment membership with a set of matching member IDs.

    Adds new members, deactivates members no longer matching, and
    reactivates previously removed members that match again.
    Uses frappe.db.set_value() for efficiency (avoids full doc.save() hooks).

    Args:
        segment: User Segment name
        member_type: "Buyer" or "Seller"
        matching_ids: Set/list of member IDs that currently match the segment rules
        source: "Rule" or "Manual"

    Returns:
        dict: {"added": int, "removed": int, "reactivated": int}
    """
    matching_set = set(matching_ids)
    stats = {"added": 0, "removed": 0, "reactivated": 0}

    # Get all current members (active and inactive)
    current_members = frappe.get_all(
        "Segment Member",
        filters={
            "segment": segment,
            "member_type": member_type,
        },
        fields=["name", "member_id", "is_active"],
    )

    current_map = {m.member_id: m for m in current_members}
    current_active_ids = {m.member_id for m in current_members if m.is_active}

    # Deactivate members no longer matching
    to_deactivate = current_active_ids - matching_set
    for member_id in to_deactivate:
        member = current_map[member_id]
        frappe.db.set_value("Segment Member", member.name, {
            "is_active": 0,
            "left_at": now_datetime(),
        })
        stats["removed"] += 1

    # Add or reactivate matching members
    count = 0
    for member_id in matching_set:
        if member_id in current_map:
            member = current_map[member_id]
            if not member.is_active:
                # Reactivate
                frappe.db.set_value("Segment Member", member.name, {
                    "is_active": 1,
                    "joined_at": now_datetime(),
                    "left_at": None,
                    "source": source,
                })
                stats["reactivated"] += 1
            # Already active — skip
        else:
            # New member
            doc = frappe.get_doc({
                "doctype": "Segment Member",
                "segment": segment,
                "member_type": member_type,
                "member_id": member_id,
                "source": source,
                "is_active": 1,
            })
            doc.insert(ignore_permissions=True)
            stats["added"] += 1

        count += 1
        if count % 100 == 0:
            frappe.db.commit()

    return stats
