# Copyright (c) 2026, TR TradeHub and contributors
# For license information, please see license.txt

"""
TradeHub Seller Scoring Module.

Provides seller scoring engine and normalization utilities for the
TradeHub B2B Marketplace scoring system.

Submodules:
    - normalizers: Linear, logarithmic, step, and binary normalization functions
    - engine: Seller scoring pipeline (8-step process:
      collect → normalize → weight → aggregate → curve → penalties → bonuses → finalize)
"""
