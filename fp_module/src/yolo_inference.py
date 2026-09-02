"""
DEPRECATED: This file is kept for reference only.
The simplified version uses main.py directly (no modular functions needed yet).
You can delete this file if you want - it's not used by main.py.

Below is the old modular code structure - useful when you're ready to expand:
"""

from __future__ import annotations

import cv2
import numpy as np
from ultralytics import YOLO


def load_model(model_name: str = "yolov8n.pt") -> YOLO:
    """Load a pretrained Ultralytics YOLO model."""
    return YOLO(model_name)


def extract_detections(result) -> list[dict]:
    """Extract class ID, class name, confidence, and xyxy box for each detection."""
    detections = []
    class_names = result.names

    for box in result.boxes:
        xyxy = box.xyxy[0].detach().cpu().numpy().astype(float)
        confidence = float(box.conf[0].detach().cpu().numpy())
        class_id = int(box.cls[0].detach().cpu().numpy())
        class_name = class_names[class_id]

        detections.append(
            {
                "class_id": class_id,
                "class_name": class_name,
                "confidence": confidence,
                "xyxy": np.asarray(xyxy, dtype=np.float32),
            }
        )

    return detections


def print_detections(detections: list[dict]) -> None:
    """Print detections in a readable, tabular format."""
    if not detections:
        print("No detections found.")
        return

    rows = []
    for detection in detections:
        x1, y1, x2, y2 = detection["xyxy"]
        rows.append(
            {
                "class_id": detection["class_id"],
                "class_name": detection["class_name"],
                "confidence": round(float(detection["confidence"]), 4),
                "x1": round(float(x1), 2),
                "y1": round(float(y1), 2),
                "x2": round(float(x2), 2),
                "y2": round(float(y2), 2),
            }
        )

    table = pd.DataFrame(rows)
    print("\nYOLO detections:\n")
    print(table.to_string(index=False))


def draw_detections(image: np.ndarray, detections: list[dict]) -> np.ndarray:
    """Draw boxes and labels onto the image."""
    annotated = image.copy()

    for detection in detections:
        x1, y1, x2, y2 = detection["xyxy"]
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)

        label = f"{detection['class_name']} {detection['confidence']:.2f}"
        cv2.putText(
            annotated,
            label,
            (x1, max(20, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2,
        )

    return annotated


def run_inference(model_name: str, image_path: str):
    """Load model, run inference, print detection data, and display annotated image."""
    model = load_model(model_name)

    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    results = model(image, verbose=False)
    result = results[0]
    detections = extract_detections(result)

    print_detections(detections)

    annotated_image = draw_detections(image, detections)

    cv2.imshow("YOLO Inference", annotated_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return detections, annotated_image
