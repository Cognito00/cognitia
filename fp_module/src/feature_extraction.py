"""Experimental image feature extraction for sonar false-positive analysis.

This module intentionally keeps the feature logic isolated and configurable so the
heuristics can be refined later without changing the JSON parsing or backend flow.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

import cv2
import numpy as np


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def validate_bbox(image_shape: Tuple[int, int, int], bbox: Dict[str, Any]) -> Tuple[float, float, float, float]:
    """Validate and normalize bbox coordinates to pixel space."""
    if not isinstance(bbox, dict):
        raise ValueError("bbox must be a dictionary with x1, y1, x2, y2")

    keys = ["x1", "y1", "x2", "y2"]
    missing = [k for k in keys if k not in bbox]
    if missing:
        raise ValueError(f"bbox missing required keys: {missing}")

    x1, y1, x2, y2 = [float(bbox[k]) for k in keys]

    if not np.isfinite(x1) or not np.isfinite(y1) or not np.isfinite(x2) or not np.isfinite(y2):
        raise ValueError("bbox coordinates must be finite numbers")

    if x2 <= x1 or y2 <= y1:
        raise ValueError(f"invalid bbox: x2 <= x1 or y2 <= y1 ({bbox})")

    height, width = image_shape[:2]
    if x1 < 0 or y1 < 0 or x2 > width or y2 > height:
        raise ValueError(
            f"bbox outside image bounds: image_size=({width}, {height}), bbox={bbox}"
        )

    return x1, y1, x2, y2


def bbox_dimensions(bbox: Dict[str, Any]) -> Dict[str, float]:
    x1, y1, x2, y2 = [float(bbox[k]) for k in ("x1", "y1", "x2", "y2")]
    width = max(0.0, x2 - x1)
    height = max(0.0, y2 - y1)
    area = width * height
    return {
        "width": width,
        "height": height,
        "area": area,
        "aspect_ratio": (width / height) if height > 0 else 0.0,
    }


def extract_object_features(image: np.ndarray, bbox: Dict[str, Any]) -> Dict[str, float]:
    """Extract basic object-level image features from the ROI."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = validate_bbox((h, w, 3), bbox)
    roi = image[int(y1):int(y2), int(x1):int(x2)]

    if roi.size == 0:
        raise ValueError("empty detection region after bbox validation")

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) if len(roi.shape) == 3 else roi
    mean_intensity = float(np.mean(gray)) / 255.0
    std_intensity = float(np.std(gray)) / 255.0

    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.mean(edges > 0))

    dims = bbox_dimensions(bbox)
    width = dims["width"]
    height = dims["height"]
    area = dims["area"]
    normalized_area = clamp01(area / max(1.0, w * h))

    # Keep this intentionally generic: no hard assumption that a particular size or intensity
    # is always a debris object. The score is only experimental.
    aspect_ratio = dims["aspect_ratio"]
    aspect_score = 1.0 - min(abs(np.log(aspect_ratio + 1e-6)) / 3.0, 1.0)

    object_score = clamp01(
        0.35 * normalized_area + 0.25 * aspect_score + 0.20 * mean_intensity + 0.20 * edge_density
    )

    return {
        "bbox_width": width,
        "bbox_height": height,
        "bbox_area": area,
        "aspect_ratio": aspect_ratio,
        "normalized_bbox_area": normalized_area,
        "mean_intensity": mean_intensity,
        "std_intensity": std_intensity,
        "edge_density": edge_density,
        "object_score": object_score,
    }


def extract_shadow_features(image: np.ndarray, bbox: Dict[str, Any], direction: str = "right", margin_ratio: float = 0.5) -> Dict[str, float]:
    """Experimental acoustic-shadow heuristic.

    The code uses a configurable region behind the predicted box and compares the darker region
    in that area to the local image background. This is a heuristic, not proof of a shadow.
    """
    h, w = image.shape[:2]
    x1, y1, x2, y2 = validate_bbox((h, w, 3), bbox)

    width = max(1.0, x2 - x1)
    height = max(1.0, y2 - y1)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    pad = max(2, int(min(width, height) * margin_ratio))
    if direction.lower() == "right":
        shadow_x1 = min(w - 1, x2 + pad)
        shadow_x2 = min(w - 1, x2 + int(width * 2.0))
        shadow_y1 = max(0, int(y1) - pad)
        shadow_y2 = min(h - 1, int(y2) + pad)
    elif direction.lower() == "left":
        shadow_x2 = max(0, x1 - pad)
        shadow_x1 = max(0, x1 - int(width * 2.0))
        shadow_y1 = max(0, int(y1) - pad)
        shadow_y2 = min(h - 1, int(y2) + pad)
    elif direction.lower() == "down":
        shadow_y2 = min(h - 1, y2 + int(height * 2.0))
        shadow_y1 = min(h - 1, y2 + pad)
        shadow_x1 = max(0, int(x1) - pad)
        shadow_x2 = min(w - 1, int(x2) + pad)
    else:
        raise ValueError(f"unsupported shadow direction: {direction}")

    if shadow_x2 <= shadow_x1 or shadow_y2 <= shadow_y1:
        return {
            "shadow_region": {"x1": 0, "y1": 0, "x2": 0, "y2": 0},
            "shadow_darkness": 0.0,
            "shadow_score": 0.0,
        }

    shadow_roi = gray[int(shadow_y1):int(shadow_y2), int(shadow_x1):int(shadow_x2)]
    if shadow_roi.size == 0:
        return {
            "shadow_region": {"x1": shadow_x1, "y1": shadow_y1, "x2": shadow_x2, "y2": shadow_y2},
            "shadow_darkness": 0.0,
            "shadow_score": 0.0,
        }

    local_mean = float(np.mean(gray[int(y1):int(y2), int(x1):int(x2)])) / 255.0
    shadow_mean = float(np.mean(shadow_roi)) / 255.0
    contrast = max(0.0, local_mean - shadow_mean)
    shadow_darkness = clamp01(1.0 - shadow_mean)
    shadow_score = clamp01(0.7 * shadow_darkness + 0.3 * contrast)

    return {
        "shadow_region": {
            "x1": float(shadow_x1),
            "y1": float(shadow_y1),
            "x2": float(shadow_x2),
            "y2": float(shadow_y2),
        },
        "shadow_darkness": shadow_darkness,
        "shadow_score": shadow_score,
    }


def extract_surrounding_features(image: np.ndarray, bbox: Dict[str, Any], padding_ratio: float = 0.5) -> Dict[str, float]:
    """Compare the object ROI against a local surrounding region."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = validate_bbox((h, w, 3), bbox)

    pad = max(2, int(min(x2 - x1, y2 - y1) * padding_ratio))
    sx1 = max(0, int(x1) - pad)
    sy1 = max(0, int(y1) - pad)
    sx2 = min(w, int(x2) + pad)
    sy2 = min(h, int(y2) + pad)

    img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    inner_roi = img_gray[int(y1):int(y2), int(x1):int(x2)]
    outer_roi = img_gray[sy1:sy2, sx1:sx2]

    if inner_roi.size == 0 or outer_roi.size == 0:
        return {"surrounding_score": 0.0, "intensity_difference": 0.0, "edge_difference": 0.0}

    inner_mean = float(np.mean(inner_roi)) / 255.0
    outer_mean = float(np.mean(outer_roi)) / 255.0
    intensity_difference = abs(inner_mean - outer_mean)

    inner_edges = cv2.Canny(inner_roi, 50, 150)
    outer_edges = cv2.Canny(outer_roi, 50, 150)
    edge_difference = abs(float(np.mean(inner_edges > 0)) - float(np.mean(outer_edges > 0)))

    surrounding_score = clamp01(0.6 * intensity_difference + 0.4 * edge_difference)
    return {
        "intensity_difference": clamp01(intensity_difference),
        "edge_difference": clamp01(edge_difference),
        "surrounding_score": surrounding_score,
    }


def extract_spatial_features(image: np.ndarray, bbox: Dict[str, Any]) -> Dict[str, float]:
    """Measure local spatial coherence within the detected object region."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = validate_bbox((h, w, 3), bbox)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    roi = gray[int(y1):int(y2), int(x1):int(x2)]
    if roi.size == 0:
        return {"spatial_score": 0.0, "edge_density": 0.0, "contour_ratio": 0.0}

    edges = cv2.Canny(roi, 50, 150)
    edge_density = float(np.mean(edges > 0))

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_ratio = 0.0
    if contours:
        contour_areas = [cv2.contourArea(c) for c in contours]
        largest_area = max(contour_areas) if contour_areas else 0.0
        roi_area = max(1.0, roi.shape[0] * roi.shape[1])
        contour_ratio = clamp01(largest_area / roi_area)

    spatial_score = clamp01(0.6 * edge_density + 0.4 * contour_ratio)
    return {
        "edge_density": edge_density,
        "contour_ratio": contour_ratio,
        "spatial_score": spatial_score,
    }
