"""JSON parsing entry point for the false-positive workflow.

This module accepts the AI team's prediction JSON and turns it into a per-detection
processing pipeline. It deliberately does not run YOLO, does not create IDs, and does
not send results to the backend.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from src.backend_client import get_sonar_image
from src.feature_extraction import (
    extract_object_features,
    extract_shadow_features,
    extract_spatial_features,
    extract_surrounding_features,
    validate_bbox,
)
from src.scoring import compute_experimental_score


def _normalize_prediction_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("prediction JSON must be a dictionary/object")

    if "detections" not in payload or not isinstance(payload["detections"], list):
        raise ValueError("prediction JSON is missing a valid 'detections' list")

    if "image_id" not in payload:
        raise ValueError("prediction JSON is missing required 'image_id'")

    return payload


def _build_reason(raw_confidence: float, object_score: float, shadow_score: float,
                  surrounding_score: float, spatial_score: float, status: str) -> str | None:
    if status == "accepted":
        return None if raw_confidence >= 0.0 else "score_above_accept_threshold"

    reasons = []
    if raw_confidence < 0.25:
        reasons.append("low_raw_confidence")
    if object_score < 0.5:
        reasons.append("low_object_score")
    if shadow_score < 0.5:
        reasons.append("low_shadow_score")
    if surrounding_score < 0.5:
        reasons.append("low_surrounding_score")
    if spatial_score < 0.5:
        reasons.append("low_spatial_continuity")

    if not reasons:
        if status == "pending":
            return "score_in_pending_range"
        return "score_below_reject_threshold"

    return reasons[0]


def _process_single_detection(image: Any, prediction: Dict[str, Any], image_id: str) -> Dict[str, Any]:
    if not isinstance(prediction, dict):
        raise ValueError("each detection must be a dictionary")

    detection_id = prediction.get("detection_id")
    class_id = prediction.get("class_id")
    class_name = prediction.get("class_name")
    raw_confidence = prediction.get("confidence")
    bbox = prediction.get("bbox")

    if class_id is None:
        raise ValueError("detection is missing class_id")
    if class_name is None:
        raise ValueError("detection is missing class_name")
    if raw_confidence is None:
        raise ValueError("detection is missing confidence")
    if bbox is None:
        raise ValueError("detection is missing bbox")

    try:
        raw_confidence = float(raw_confidence)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"invalid confidence value for detection_id={detection_id}: {raw_confidence}") from exc

    if raw_confidence < 0 or raw_confidence > 1:
        raise ValueError(f"confidence out of range [0,1] for detection_id={detection_id}: {raw_confidence}")

    try:
        x1, y1, x2, y2 = validate_bbox(image.shape, bbox)
        bbox_normalized = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
    except Exception as exc:
        raise ValueError(f"invalid bbox for detection_id={detection_id}: {bbox}") from exc

    object_features = extract_object_features(image, bbox_normalized)
    shadow_features = extract_shadow_features(image, bbox_normalized)
    surrounding_features = extract_surrounding_features(image, bbox_normalized)
    spatial_features = extract_spatial_features(image, bbox_normalized)

    object_score = float(object_features["object_score"])
    shadow_score = float(shadow_features["shadow_score"])
    surrounding_score = float(surrounding_features["surrounding_score"])
    spatial_score = float(spatial_features["spatial_score"])

    score_result = compute_experimental_score(
        raw_confidence=raw_confidence,
        object_score=object_score,
        shadow_score=shadow_score,
        surrounding_score=surrounding_score,
        spatial_score=spatial_score,
    )

    status = score_result["status"]
    reason = _build_reason(raw_confidence, object_score, shadow_score, surrounding_score, spatial_score, status)
    if status == "accepted" and reason is None:
        reason = None

    return {
        "detection_id": detection_id,
        "image_id": image_id,
        "class_id": class_id,
        "class_name": class_name,
        "raw_confidence": raw_confidence,
        "bbox": bbox_normalized,
        "features": {
            "object": object_features,
            "shadow": shadow_features,
            "surrounding": surrounding_features,
            "spatial": spatial_features,
        },
        "feature_scores": {
            "object_score": object_score,
            "shadow_score": shadow_score,
            "surrounding_score": surrounding_score,
            "spatial_score": spatial_score,
        },
        "experimental_score": score_result["experimental_score"],
        "status": status,
        "reason": reason,
        "weights": score_result["weights"],
        "thresholds": score_result["thresholds"],
    }


def process_prediction_json(prediction_data: Dict[str, Any] | str) -> List[Dict[str, Any]]:
    """Process the AI prediction JSON for all detections.

    Args:
        prediction_data: Either raw JSON string or already-decoded dictionary matching the AI schema.

    Returns:
        List of per-detection results containing detection_id, image_id, class, bbox,
        feature scores, experimental_score, status, and reason.

    This function intentionally does not send results to the backend.
    """
    if isinstance(prediction_data, str):
        try:
            payload = json.loads(prediction_data)
        except json.JSONDecodeError as exc:
            raise ValueError(f"malformed JSON: {exc}") from exc
    else:
        payload = prediction_data

    payload = _normalize_prediction_payload(payload)
    image_id = payload.get("image_id")
    if image_id is None or str(image_id).strip() == "":
        raise ValueError("missing image_id in prediction JSON")

    try:
        image = get_sonar_image(str(image_id))
    except Exception as exc:
        raise RuntimeError(f"image retrieval failed for image_id={image_id}: {exc}") from exc

    results: List[Dict[str, Any]] = []
    for detection in payload["detections"]:
        try:
            result = _process_single_detection(image, detection, str(image_id))
            results.append(result)
        except Exception as exc:
            # Preserve the error context but continue processing other detections.
            results.append({
                "detection_id": detection.get("detection_id") if isinstance(detection, dict) else None,
                "image_id": str(image_id),
                "class_id": detection.get("class_id") if isinstance(detection, dict) else None,
                "class_name": detection.get("class_name") if isinstance(detection, dict) else None,
                "raw_confidence": detection.get("confidence") if isinstance(detection, dict) else None,
                "bbox": detection.get("bbox") if isinstance(detection, dict) else None,
                "error": str(exc),
                "status": "rejected",
                "reason": "invalid_prediction",
            })

    return results


if __name__ == "__main__":
    sample_json = {
        "image_id": "sample_image.jpg",
        "model_version": "sonar-yolo11n-mvp-01",
        "image_width": 1280,
        "image_height": 1280,
        "detections": [
            {
                "detection_id": 8,
                "class_id": 1,
                "class_name": "Other-Man-Made-Debris",
                "confidence": 0.82,
                "bbox": {"x1": 50, "y1": 60, "x2": 160, "y2": 180},
            },
            {
                "detection_id": 9,
                "class_id": 2,
                "class_name": "Ghost-Fishing-Gear",
                "confidence": 0.34,
                "bbox": {"x1": 200, "y1": 210, "x2": 310, "y2": 310},
            },
        ],
    }

    print(process_prediction_json(sample_json))
