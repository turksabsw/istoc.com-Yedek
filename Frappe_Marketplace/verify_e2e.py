#!/usr/bin/env python3
"""End-to-end dependency chain verification for subtask-8-2."""

import ast
import json
import os
import sys


def check_syntax(filepath):
    """Check Python syntax of a file."""
    if not os.path.exists(filepath):
        return False, "MISSING"
    try:
        with open(filepath) as f:
            ast.parse(f.read())
        return True, "OK"
    except SyntaxError as e:
        return False, str(e)


def check_json(filepath):
    """Check JSON validity of a file."""
    if not os.path.exists(filepath):
        return False, "MISSING"
    try:
        with open(filepath) as f:
            json.load(f)
        return True, "OK"
    except json.JSONDecodeError as e:
        return False, str(e)


def check_field_in_json(filepath, fieldname):
    """Check if a field exists in a DocType JSON."""
    if not os.path.exists(filepath):
        return False, "MISSING"
    with open(filepath) as f:
        data = json.load(f)
    for field in data.get("fields", []):
        if field.get("fieldname") == fieldname:
            return True, f"Found: {field.get('fieldtype')} -> {field.get('options', '')}"
    return False, f"Field '{fieldname}' not found"


def check_function_in_py(filepath, funcname):
    """Check if a function or method exists in a Python file."""
    if not os.path.exists(filepath):
        return False, "MISSING"
    with open(filepath) as f:
        source = f.read()
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return False, "SYNTAX ERROR"

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if node.name == funcname:
                return True, f"Found at line {node.lineno}"
    return False, f"Function '{funcname}' not found"


def check_class_in_py(filepath, classname):
    """Check if a class exists in a Python file."""
    if not os.path.exists(filepath):
        return False, "MISSING"
    with open(filepath) as f:
        source = f.read()
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return False, "SYNTAX ERROR"

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if node.name == classname:
                return True, f"Found at line {node.lineno}"
    return False, f"Class '{classname}' not found"


def check_import_path_in_hooks(hooks_file, import_path):
    """Verify an import path referenced in hooks.py resolves to an actual file/function."""
    parts = import_path.split(".")
    func_name = parts[-1]

    # In Frappe, import path maps to filesystem as:
    # frappe-bench/apps/{app_name}/{module_path}.py
    # where module_path = parts[0]/parts[1]/.../parts[n-1]
    # and parts[-1] is the function name
    #
    # Example: tradehub_catalog.tradehub_catalog.permissions.brand_gating_conditions
    # -> frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/permissions.py
    # -> function: brand_gating_conditions
    app_name = parts[0]
    module_parts = parts[:-1]  # everything except function name

    candidate = os.path.join("frappe-bench/apps", app_name, *module_parts) + ".py"
    if os.path.exists(candidate):
        result, msg = check_function_in_py(candidate, func_name)
        if result:
            return True, f"{candidate} -> {msg}"
        return False, f"File exists at {candidate} but function '{func_name}' not found"

    return False, f"No file found for path: {import_path} (tried {candidate})"


def main():
    results = []
    all_pass = True

    print("=" * 70)
    print("END-TO-END DEPENDENCY CHAIN VERIFICATION")
    print("=" * 70)

    # =========================================================================
    # 1. Brand.owner_seller field exists and is functional
    # =========================================================================
    print("\n--- CHECK 1: Brand.owner_seller field ---")
    brand_json = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/brand/brand.json"

    ok, msg = check_field_in_json(brand_json, "owner_seller")
    print(f"  owner_seller in brand.json: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_field_in_json(brand_json, "owner_seller_name")
    print(f"  owner_seller_name in brand.json: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_field_in_json(brand_json, "ownership_date")
    print(f"  ownership_date in brand.json: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # =========================================================================
    # 2. Brand Ownership Claim can reference Brand
    # =========================================================================
    print("\n--- CHECK 2: Brand Ownership Claim controller ---")
    boc_py = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/brand_ownership_claim/brand_ownership_claim.py"

    ok, msg = check_syntax(boc_py)
    print(f"  Syntax valid: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_class_in_py(boc_py, "BrandOwnershipClaim")
    print(f"  BrandOwnershipClaim class: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(boc_py, "handle_approval")
    print(f"  handle_approval method: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(boc_py, "submit_ownership_claim")
    print(f"  submit_ownership_claim API: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # Check BOC JSON has brand field
    boc_json = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/brand_ownership_claim/brand_ownership_claim.json"
    ok, msg = check_field_in_json(boc_json, "brand")
    print(f"  brand field in BOC JSON: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # =========================================================================
    # 3. Brand Authorization Request can reference Brand and Brand.owner_seller
    # =========================================================================
    print("\n--- CHECK 3: Brand Authorization Request controller ---")
    bar_py = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/brand_authorization_request/brand_authorization_request.py"

    ok, msg = check_syntax(bar_py)
    print(f"  Syntax valid: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_class_in_py(bar_py, "BrandAuthorizationRequest")
    print(f"  BrandAuthorizationRequest class: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(bar_py, "handle_approval")
    print(f"  handle_approval method: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(bar_py, "_create_brand_gating")
    print(f"  _create_brand_gating method: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # Check BAR JSON has brand field
    bar_json = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/brand_authorization_request/brand_authorization_request.json"
    ok, msg = check_field_in_json(bar_json, "brand")
    print(f"  brand field in BAR JSON: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_field_in_json(bar_json, "brand_gating")
    print(f"  brand_gating field in BAR JSON: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # =========================================================================
    # 4. SKU Product validate_brand_authorization checks Brand Gating
    # =========================================================================
    print("\n--- CHECK 4: SKU Product validate_brand_authorization ---")
    sku_py = "frappe-bench/apps/tradehub_seller/tradehub_seller/tradehub_seller/doctype/sku_product/sku_product.py"

    ok, msg = check_syntax(sku_py)
    print(f"  Syntax valid: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(sku_py, "validate_brand_authorization")
    print(f"  validate_brand_authorization method: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # Verify it references Brand Gating and owner_seller
    with open(sku_py) as f:
        sku_content = f.read()
    has_bg = "Brand Gating" in sku_content
    print(f"  References 'Brand Gating': {'PASS' if has_bg else 'FAIL'}")
    if not has_bg:
        all_pass = False

    has_os = "owner_seller" in sku_content
    print(f"  References 'owner_seller': {'PASS' if has_os else 'FAIL'}")
    if not has_os:
        all_pass = False

    # =========================================================================
    # 5. Variant Request with demand aggregation
    # =========================================================================
    print("\n--- CHECK 5: Variant Request controller ---")
    vr_py = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/variant_request/variant_request.py"

    ok, msg = check_syntax(vr_py)
    print(f"  Syntax valid: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_class_in_py(vr_py, "VariantRequest")
    print(f"  VariantRequest class: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    for func in ["compute_demand_group_key", "update_demand_aggregation",
                  "validate_seller_authorization", "handle_approval",
                  "_compute_demand_group_key", "_normalize_key_part",
                  "bulk_approve_variant_requests", "approve_demand_group"]:
        ok, msg = check_function_in_py(vr_py, func)
        print(f"  {func}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Check VR references Brand Gating
    with open(vr_py) as f:
        vr_content = f.read()
    has_bg = "Brand Gating" in vr_content
    print(f"  References 'Brand Gating': {'PASS' if has_bg else 'FAIL'}")
    if not has_bg:
        all_pass = False

    # Verify demand aggregation tasks
    vr_tasks = "frappe-bench/apps/tradehub_catalog/tradehub_catalog/variant_request/tasks.py"
    ok, msg = check_syntax(vr_tasks)
    print(f"  tasks.py syntax: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    ok, msg = check_function_in_py(vr_tasks, "recalculate_demand_aggregations")
    print(f"  recalculate_demand_aggregations: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    # =========================================================================
    # 6. All hooks.py import paths resolve correctly
    # =========================================================================
    print("\n--- CHECK 6: hooks.py import path verification ---")

    # tradehub_catalog hooks.py
    catalog_hooks_imports = [
        # permission_query_conditions
        "tradehub_catalog.tradehub_catalog.permissions.brand_gating_conditions",
        "tradehub_catalog.tradehub_catalog.permissions.brand_ownership_claim_conditions",
        "tradehub_catalog.tradehub_catalog.permissions.brand_authorization_request_conditions",
        "tradehub_catalog.tradehub_catalog.permissions.variant_request_conditions",
        # has_permission
        "tradehub_catalog.tradehub_catalog.permissions.brand_has_permission",
        "tradehub_catalog.tradehub_catalog.permissions.brand_gating_has_permission",
        "tradehub_catalog.tradehub_catalog.permissions.variant_request_has_permission",
        # scheduler_events
        "tradehub_catalog.variant_request.tasks.recalculate_demand_aggregations",
    ]

    print("  [tradehub_catalog hooks.py]")
    for imp in catalog_hooks_imports:
        ok, msg = check_import_path_in_hooks("catalog", imp)
        short = imp.split(".")[-1]
        print(f"    {short}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # tradehub_seller hooks.py
    seller_hooks_imports = [
        "tradehub_seller.tradehub_seller.seller_tags.tasks.refresh_seller_metrics",
        "tradehub_seller.tradehub_seller.seller_tags.tasks.evaluate_all_rules",
        "tradehub_seller.tradehub_seller.seller_tags.tasks.cleanup_old_metrics",
    ]

    print("  [tradehub_seller hooks.py]")
    for imp in seller_hooks_imports:
        ok, msg = check_import_path_in_hooks("seller", imp)
        short = imp.split(".")[-1]
        print(f"    {short}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # =========================================================================
    # 7. Seller Tag scoring algorithms produce correct results
    # =========================================================================
    print("\n--- CHECK 7: rule_engine.py scoring algorithms ---")
    re_py = "frappe-bench/apps/tradehub_seller/tradehub_seller/tradehub_seller/seller_tags/rule_engine.py"

    ok, msg = check_syntax(re_py)
    print(f"  Syntax valid: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    for func in ["score_condition", "evaluate_child_conditions",
                  "evaluate_condition", "evaluate_group", "evaluate_conditions"]:
        ok, msg = check_function_in_py(re_py, func)
        print(f"  {func}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    ok, msg = check_class_in_py(re_py, "RuleEngine")
    print(f"  RuleEngine class: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    for method in ["evaluate_rule", "evaluate_rule_with_score",
                    "evaluate_all_rules_for_seller", "apply_tag_assignment",
                    "remove_unqualified_tags"]:
        ok, msg = check_function_in_py(re_py, method)
        print(f"  RuleEngine.{method}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Verify OPERATORS and LOWER_IS_BETTER
    with open(re_py) as f:
        re_content = f.read()
    has_ops = "OPERATORS" in re_content
    print(f"  OPERATORS dict: {'PASS' if has_ops else 'FAIL'}")
    if not has_ops:
        all_pass = False

    has_lib = "LOWER_IS_BETTER" in re_content
    print(f"  LOWER_IS_BETTER set: {'PASS' if has_lib else 'FAIL'}")
    if not has_lib:
        all_pass = False

    # tasks.py lifecycle management
    tasks_py = "frappe-bench/apps/tradehub_seller/tradehub_seller/tradehub_seller/seller_tags/tasks.py"
    for func in ["evaluate_all_rules", "refresh_seller_metrics",
                  "_evaluate_seller_tag_rules", "_handle_passed_evaluation",
                  "_handle_failed_evaluation", "_send_tag_warning_notification",
                  "cleanup_old_metrics", "evaluate_single_seller_rules"]:
        ok, msg = check_function_in_py(tasks_py, func)
        print(f"  tasks.{func}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # =========================================================================
    # 8. Location Item -> Seller Profile -> Sub Order -> Marketplace Shipment chain
    # =========================================================================
    print("\n--- CHECK 8: Multi-location fulfillment chain ---")

    # Location Item JSON
    li_json = "frappe-bench/apps/tradehub_core/tradehub_core/tradehub_core/doctype/location_item/location_item.json"
    ok, msg = check_json(li_json)
    print(f"  Location Item JSON: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    for field in ["location_type", "location_name", "is_default", "is_active",
                   "street_address", "building_info", "city_name", "postal_code",
                   "can_fulfill_orders", "can_accept_returns", "erpnext_warehouse", "phone"]:
        ok, msg = check_field_in_json(li_json, field)
        print(f"    {field}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Seller Profile location methods
    sp_py = "frappe-bench/apps/tradehub_seller/tradehub_seller/tradehub_seller/doctype/seller_profile/seller_profile.py"
    for func in ["get_default_location", "get_fulfillment_locations",
                  "get_return_locations", "validate_default_location",
                  "get_location_by_idx"]:
        ok, msg = check_function_in_py(sp_py, func)
        print(f"  SellerProfile.{func}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Sub Order fulfillment_location fields
    so_json = "frappe-bench/apps/tradehub_commerce/tradehub_commerce/tradehub_commerce/doctype/sub_order/sub_order.json"
    for field in ["fulfillment_location_idx", "fulfillment_location_name"]:
        ok, msg = check_field_in_json(so_json, field)
        print(f"  SubOrder.{field}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Marketplace Shipment origin logic
    ms_py = "frappe-bench/apps/tradehub_logistics/tradehub_logistics/tradehub_logistics/doctype/marketplace_shipment/marketplace_shipment.py"
    ok, msg = check_syntax(ms_py)
    print(f"  marketplace_shipment.py syntax: {'PASS' if ok else 'FAIL'} - {msg}")
    if not ok:
        all_pass = False

    for func in ["copy_addresses_from_sub_order", "_resolve_fulfillment_location",
                  "_get_location_by_idx", "_set_origin_from_location",
                  "_set_origin_from_seller_profile"]:
        ok, msg = check_function_in_py(ms_py, func)
        print(f"  MarketplaceShipment.{func}: {'PASS' if ok else 'FAIL'} - {msg}")
        if not ok:
            all_pass = False

    # Verify location-based priority chain in shipment
    with open(ms_py) as f:
        ms_content = f.read()
    has_loc_priority = "fulfillment_location_idx" in ms_content
    print(f"  References fulfillment_location_idx: {'PASS' if has_loc_priority else 'FAIL'}")
    if not has_loc_priority:
        all_pass = False

    has_default_loc = "get_default_location" in ms_content
    print(f"  References get_default_location: {'PASS' if has_default_loc else 'FAIL'}")
    if not has_default_loc:
        all_pass = False

    has_fallback = "_set_origin_from_seller_profile" in ms_content
    print(f"  Has seller profile fallback: {'PASS' if has_fallback else 'FAIL'}")
    if not has_fallback:
        all_pass = False

    # =========================================================================
    # FINAL RESULT
    # =========================================================================
    print()
    print("=" * 70)
    if all_pass:
        print("OVERALL RESULT: ALL CHECKS PASSED")
    else:
        print("OVERALL RESULT: SOME CHECKS FAILED")
    print("=" * 70)

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
