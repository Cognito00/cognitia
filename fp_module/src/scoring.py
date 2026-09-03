"""Experimental scoring framework for sonar false-positive analysis.

This module intentionally keeps baseline weights and thresholds configurable through
config.yaml so experiments can be adjusted without changing source code.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

import yaml


def load_scoring_config(config_path: str | None = None) -> Dict[str, Any]:
    if config_path is None:
        config_path = os.getenv("FP_CONFIG_PATH")
    if config_path is None:
        project_root = Path(__file__).resolve().parents[1]
        config_path = str(project_root / "config" / "config.yaml")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    scoring_cfg = config.get("weights", {})
    thresholds = config.get("thresholds", {})
    return {
        "weights": {
            "confidence": float(scoring_cfg.get("confidence", 0.20)),
            "object": float(scoring_cfg.get("object", 0.20)),
            "shadow": float(scoring_cfg.get("shadow", 0.20)),
            "surrounding": float(scoring_cfg.get("surrounding", 0.20)),
            "spatial": float(scoring_cfg.get("spatial", 0.20)),
        },
        "thresholds": {
            "accept": float(thresholds.get("accept", 0.70)),
            "reject": float(thresholds.get("reject", 0.40)),
        },
    }


def validate_weights(weights: Dict[str, float]) -> None:
    total = 0.0
    for key, value in weights.items():
        if value < 0:
            raise ValueError(f"weight for {key} must be non-negative")
        total += float(value)
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"weights must sum to 1.0; current total={total}")


def compute_experimental_score(
    raw_confidence: float,
    object_score: float,
    shadow_score: float,
    surrounding_score: float,
    spatial_score: float,
    config_path: str | None = None,
) -> Dict[str, Any]:
    cfg = load_scoring_config(config_path)
    weights = cfg["weights"]
    validate_weights(weights)

    confidence_score = float(raw_confidence)
    score = (
        weights["confidence"] * confidence_score
        + weights["object"] * float(object_score)
        + weights["shadow"] * float(shadow_score)
        + weights["surrounding"] * float(surrounding_score)
        + weights["spatial"] * float(spatial_score)
    )

    thresholds = cfg["thresholds"]
    accept = float(thresholds.get("accept", 0.70))
    reject = float(thresholds.get("reject", 0.40))

    if score >= accept:
        status = "accepted"
        reason = "score_above_accept_threshold"
    elif reject <= score < accept:
        status = "pending"
        reason = "score_in_pending_range"
    else:
        status = "rejected"
        reason = "score_below_reject_threshold"

    return {
        "weights": weights,
        "thresholds": {"accept": accept, "reject": reject},
        "experimental_score": float(score),
        "status": status,
        "reason": reason,
    }
