"""Backend client interface for the false-positive module.

This module intentionally avoids guessing the real backend endpoint. It provides a
configurable image-retrieval interface and a backend update client. The API URL is
read from configuration or environment variables so the backend team can replace the
final endpoint later without code changes.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import cv2
import numpy as np
import requests
import yaml


def _load_config(config_path: str | None = None) -> Dict[str, Any]:
    """Load application configuration.

    Priority:
    1. Explicit config_path argument
    2. ENV: FP_CONFIG_PATH
    3. Default: config/config.yaml in the project root
    """
    if config_path is None:
        config_path = os.getenv("FP_CONFIG_PATH")

    if config_path is None:
        project_root = Path(__file__).resolve().parents[1]
        config_path = str(project_root / "config" / "config.yaml")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    return config


def _get_backend_cfg() -> Dict[str, Any]:
    config = _load_config()
    return config.get("backend", {})


def _env_or_config(key: str, default: Any = None) -> Any:
    env_key = f"BACKEND_{key.upper()}"
    value = os.getenv(env_key)
    if value is not None:
        return value

    cfg = _get_backend_cfg()
    return cfg.get(key, default)


def _normalize_image_id(image_id: str) -> str:
    if image_id is None or str(image_id).strip() == "":
        raise ValueError("image_id is required for image retrieval")
    return str(image_id).strip()


def get_sonar_image(image_id: str, config_path: str | None = None) -> np.ndarray:
    """Retrieve a sonar image for the given image_id.

    This is intentionally a configurable placeholder. The endpoint is not guessed or
    hard-coded. The URL is loaded from configuration or environment variables.

    Supported strategy:
    - If BACKEND_IMAGE_API_URL is configured, call the remote HTTP endpoint.
    - Else if BACKEND_LOCAL_IMAGE_DIR is configured, load the local file from disk.
    - Else raise a clear error telling the user to provide the endpoint.

    When the backend team provides a final endpoint and response format, update only
    the configuration values or small adapter functions here.
    """
    image_id = _normalize_image_id(image_id)

    cfg = _load_config(config_path) if config_path else _get_backend_cfg()
    image_api_url = _env_or_config("image_api_url", cfg.get("image_api_url"))
    image_dir = _env_or_config("local_image_dir", cfg.get("local_image_dir"))
    timeout = float(_env_or_config("timeout_seconds", cfg.get("timeout_seconds", 15)))
    query_param = _env_or_config("image_query_parameter", cfg.get("image_query_parameter", "image_id"))

    if image_api_url:
        # Placeholder-only remote API integration.
        # Replace this placeholder adapter once the backend team provides the exact endpoint
        # and response format.
        params = {query_param: image_id}
        response = requests.get(image_api_url, params=params, timeout=timeout)
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")
        if "image" in content_type.lower():
            array = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(array, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError(f"Failed to decode image bytes for image_id={image_id}")
            return img

        # If backend returns JSON with an image URL or encoded base64, adapt here later.
        # The goal is to keep the integration isolated and easy to replace.
        try:
            payload = response.json()
        except ValueError as exc:
            raise ValueError(
                "Backend image endpoint returned a non-image response. Please configure the final "
                "image API contract in config.yaml or BACKEND_IMAGE_API_URL."
            ) from exc

        if isinstance(payload, dict):
            for key in ("image_url", "url", "path", "file_path", "image_path", "data"):
                if key in payload:
                    if isinstance(payload[key], str) and payload[key].strip():
                        return get_sonar_image(payload[key], config_path=config_path)
            if "image" in payload and isinstance(payload["image"]["image"], str):
                # Placeholder for future base64 or encoded payload response format.
                encoded = payload["image"]["image"]
                image_bytes = encoded.encode("utf-8")
                array = np.frombuffer(image_bytes, dtype=np.uint8)
                img = cv2.imdecode(array, cv2.IMREAD_COLOR)
                if img is not None:
                    return img

        raise ValueError(
            "The backend image response format is not yet finalized. Configure the final endpoint "
            "and response adapter in src/backend_client.py."
        )

    if image_dir:
        project_root = Path(__file__).resolve().parents[1]
        candidate_dirs = []

        if str(image_dir).strip():
            candidate_dirs.append(Path(image_dir))
            if not Path(image_dir).is_absolute():
                candidate_dirs.append(project_root / image_dir)

        candidate_dirs.append(project_root)

        for base_dir in candidate_dirs:
            if not base_dir.exists():
                continue
            image_path = base_dir / str(image_id)
            if image_path.exists():
                img = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
                if img is not None:
                    return img

            alt_path = Path(image_id)
            if alt_path.is_absolute() and alt_path.exists():
                img = cv2.imread(str(alt_path), cv2.IMREAD_COLOR)
                if img is not None:
                    return img

        raise FileNotFoundError(
            f"Local image for image_id={image_id} was not found in {image_dir}. "
            "Provide a valid local image directory or backend API URL."
        )

    raise RuntimeError(
        "No backend image API URL or local image directory is configured. Set "
        "BACKEND_IMAGE_API_URL or BACKEND_LOCAL_IMAGE_DIR, or update config/config.yaml."
    )


def update_detection_filter(detection_id: str, status: str, reason: Optional[str] = None, config_path: str | None = None) -> Dict[str, Any]:
    """Send the filter result to the backend.

    This function is intentionally separated from scoring so the HTTP API can be
    adapted without changing the feature-analysis code.
    """
    detection_id = str(detection_id)
    backend_cfg = _load_config(config_path) if config_path else _get_backend_cfg()
    endpoint = _env_or_config("filter_api_url", backend_cfg.get("filter_api_url"))
    timeout = float(_env_or_config("timeout_seconds", backend_cfg.get("timeout_seconds", 15)))

    if not endpoint:
        raise RuntimeError(
            "No backend filter endpoint is configured. Set BACKEND_FILTER_API_URL or update "
            "config/config.yaml before sending the FP result."
        )

    payload = {"status": status, "reason": reason}
    response = requests.put(f"{endpoint.rstrip('/')}/{str(detection_id)}/filter", json=payload, timeout=timeout)
    response.raise_for_status()

    try:
        return response.json()
    except ValueError:
        return {"status": status, "reason": reason, "raw_response": response.text}


if __name__ == "__main__":
    # Example usage for local testing before the backend API is finalized.
    # Set these environment variables before running:
    #   BACKEND_IMAGE_API_URL=http://localhost:8000/images
    #   BACKEND_FILTER_API_URL=http://localhost:8000/detections
    # or configure config/config.yaml.
    print("Backend client ready. Configure BACKEND_IMAGE_API_URL and BACKEND_FILTER_API_URL to test with the real backend.")
