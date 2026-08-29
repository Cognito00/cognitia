from ultralytics import YOLO
from pathlib import Path
import json
import yaml
import sys


BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config.yaml"


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def predict(image_path):
    config = load_config()

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    model_path = BASE_DIR / config["model"]["path"]
    model_version = config["model"]["version"]
    confidence_threshold = config["model"]["confidence_threshold"]
    image_size = config["inference"]["image_size"]

    class_names = {
        int(k): v
        for k, v in config["classes"].items()
    }

    model = YOLO(str(model_path))

    results = model(
        str(image_path),
        conf=confidence_threshold,
        imgsz=image_size,
        verbose=False
    )

    result = results[0]

    # Original image dimensions
    image_width = result.orig_shape[1]
    image_height = result.orig_shape[0]

    output = {
        "image_id": image_path.name,
        "model_version": model_version,
        "image_width": image_width,
        "image_height": image_height,
        "detections": []
    }

    for box in result.boxes:

        xyxy = box.xyxy[0].tolist()
        confidence = float(box.conf[0])
        class_id = int(box.cls[0])

        output["detections"].append({
            "class_id": class_id,
            "class_name": class_names.get(
                class_id,
                f"Unknown-{class_id}"
            ),
            "confidence": round(
                confidence,
                4
            ),
            "bbox": {
                "x1": round(xyxy[0], 2),
                "y1": round(xyxy[1], 2),
                "x2": round(xyxy[2], 2),
                "y2": round(xyxy[3], 2)
            }
        })

    return output


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(
            "Usage: python predict.py <image_path>"
        )
        raise SystemExit(1)

    result = predict(sys.argv[1])

    print(
        json.dumps(
            result,
            indent=2
        )
    )