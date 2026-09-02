from pathlib import Path
import sys


# =========================================================
# PROJECT PATH SETUP
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# =========================================================
# IMPORT PROJECT MODULES
# =========================================================

from humminbird_extract import process_file
from sonar_pipeline import process_one
from ml.inference.predict import predict
from services.filter_service import filter_detections


# =========================================================
# STAGE 1
# RAW .SON -> ECHOGRAM PNG + METADATA CSV
# =========================================================

def preprocess_sonar(son_path: str, output_dir: str):

    son_path = Path(son_path)
    output_dir = Path(output_dir)

    if not son_path.exists():
        raise FileNotFoundError(
            f"SON file not found: {son_path}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    summary = process_file(
        son_path=str(son_path),
        output_dir=str(output_dir),
        make_image=True
    )

    return summary


# =========================================================
# STAGE 2
# ECHOGRAM + CSV -> JSON + NPZ
# =========================================================

def package_sonar_data(
    image_path: str,
    metadata_csv_path: str,
    survey_id: str,
    output_dir: str
):

    image_path = Path(image_path)
    metadata_csv_path = Path(metadata_csv_path)
    output_dir = Path(output_dir)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Echogram not found: {image_path}"
        )

    if not metadata_csv_path.exists():
        raise FileNotFoundError(
            f"Metadata CSV not found: {metadata_csv_path}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    npz_path, json_path, metadata = process_one(
        image_path=str(image_path),
        meta_path=str(metadata_csv_path),
        survey_id=survey_id,
        out_dir=str(output_dir)
    )

    return {
        "npz_path": npz_path,
        "json_path": json_path,
        "metadata": metadata
    }


# =========================================================
# STAGE 3 + 4
# YOLO DETECTION -> FALSE-POSITIVE FILTERING
# =========================================================

def run_ml_detection(image_path: str):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Processed sonar image not found: {image_path}"
        )

    # Run our trained YOLO model
    result = predict(str(image_path))

    # Confidence filtering + Non-Maximum Suppression
    filtered_detections = filter_detections(
        result["detections"],
        confidence_threshold=0.20,
        iou_threshold=0.50
    )

    # Replace raw detections with cleaned detections
    result["detections"] = filtered_detections

    return result