from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import json
import shutil
import uuid
import zipfile

from config import supabase
from services.ml_service import (
    preprocess_sonar,
    package_sonar_data,
    run_ml_detection,
)
from services.detection_service import save_ml_detections

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEMP_DIR = PROJECT_ROOT / "storage" / "temp"
PROCESSED_DIR = PROJECT_ROOT / "storage" / "processed"


def safe_extract_zip(zip_file: zipfile.ZipFile, output_dir: Path):
    """
    Safely extract ZIP contents while preventing path traversal.
    """
    output_dir = output_dir.resolve()

    for member in zip_file.infolist():
        if member.is_dir():
            continue

        target_path = (output_dir / member.filename).resolve()

        if output_dir not in target_path.parents:
            raise ValueError("Unsafe ZIP file path detected")

        target_path.parent.mkdir(parents=True, exist_ok=True)

        with zip_file.open(member) as source, open(target_path, "wb") as target:
            shutil.copyfileobj(source, target)


def find_file_by_extension(root_dir: Path, extension: str):
    """
    Find the first file with the requested extension anywhere
    inside the extracted ZIP.
    """
    files = list(root_dir.rglob(f"*{extension}"))

    if not files:
        return None

    return files[0]


@router.post("/upload")
async def upload_sonar_zip(file: UploadFile = File(...)):
    try:
        # ---------------------------------------------------------
        # 1. Validate upload
        # ---------------------------------------------------------
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required",
            )

        if not file.filename.lower().endswith(".zip"):
            raise HTTPException(
                status_code=400,
                detail="Only ZIP files are supported",
            )

        # ---------------------------------------------------------
        # 2. Create unique working directory
        # ---------------------------------------------------------
        image_id = str(uuid.uuid4())

        temp_upload_dir = TEMP_DIR / image_id
        extracted_dir = temp_upload_dir / "extracted"
        processed_dir = PROCESSED_DIR / image_id

        temp_upload_dir.mkdir(parents=True, exist_ok=True)
        extracted_dir.mkdir(parents=True, exist_ok=True)
        processed_dir.mkdir(parents=True, exist_ok=True)

        zip_path = temp_upload_dir / file.filename

        # ---------------------------------------------------------
        # 3. Save uploaded ZIP
        # ---------------------------------------------------------
        with open(zip_path, "wb") as output_file:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                output_file.write(chunk)

        # ---------------------------------------------------------
        # 4. Extract ZIP
        # ---------------------------------------------------------
        with zipfile.ZipFile(zip_path, "r") as zip_file:
            safe_extract_zip(zip_file, extracted_dir)

        # ---------------------------------------------------------
        # 5. Find SON, IDX and metadata JSON
        # ---------------------------------------------------------
        son_path = find_file_by_extension(extracted_dir, ".SON")
        idx_path = find_file_by_extension(extracted_dir, ".IDX")

        metadata_candidates = [
            path
            for path in extracted_dir.rglob("*.json")
            if not path.name.startswith("source_metadata")
        ]

        metadata_source_path = (
            metadata_candidates[0] if metadata_candidates else None
        )

        if son_path is None:
            raise HTTPException(
                status_code=400,
                detail="ZIP does not contain a .SON file",
            )

        if idx_path is None:
            raise HTTPException(
                status_code=400,
                detail="ZIP does not contain a .IDX file",
            )

        if metadata_source_path is None:
            raise HTTPException(
                status_code=400,
                detail="ZIP does not contain a metadata .json file",
            )

        # ---------------------------------------------------------
        # 6. Read uploaded metadata JSON
        # ---------------------------------------------------------
        with open(metadata_source_path, "r", encoding="utf-8") as metadata_file:
            source_metadata = json.load(metadata_file)

        # Save a copy with a predictable name.
        source_metadata_saved = processed_dir / "source_metadata.json"

        with open(
            source_metadata_saved,
            "w",
            encoding="utf-8",
        ) as metadata_file:
            json.dump(
                source_metadata,
                metadata_file,
                indent=2,
            )

        # ---------------------------------------------------------
        # 7. Get survey ID from SON filename
        # ---------------------------------------------------------
        survey_id = son_path.stem

        # ---------------------------------------------------------
        # 8. Process SON through existing sonar pipeline
        #
        # The existing Humminbird decoder uses the SON file.
        # The IDX remains extracted and available with the survey.
        # ---------------------------------------------------------
        preprocess_sonar(
            str(son_path),
            str(processed_dir),
        )

        echogram_path = processed_dir / f"{survey_id}_echogram.png"
        metadata_csv_path = processed_dir / f"{survey_id}_metadata.csv"

        if not echogram_path.exists():
            raise FileNotFoundError(
                f"Echogram was not created: {echogram_path}"
            )

        if not metadata_csv_path.exists():
            raise FileNotFoundError(
                f"Metadata CSV was not created: {metadata_csv_path}"
            )

        # ---------------------------------------------------------
        # 9. Package processed sonar data
        # ---------------------------------------------------------
        packaged = package_sonar_data(
            str(echogram_path),
            str(metadata_csv_path),
            survey_id,
            str(processed_dir),
        )

        metadata_json_path = packaged["json_path"]
        npz_path = packaged["npz_path"]

        # ---------------------------------------------------------
        # 10. Run ML detection
        # ---------------------------------------------------------
        ml_result = run_ml_detection(
            str(echogram_path)
        )

        # ---------------------------------------------------------
        # 11. Save sonar image record
        # ---------------------------------------------------------
        supabase.table("sonar_images").insert(
            {
                "id": image_id,
                "original_filename": file.filename,
                "processed_png_path": str(echogram_path),
                "metadata_json_path": str(metadata_json_path),
                "npz_path": str(npz_path),
                "image_width": ml_result["image_width"],
                "image_height": ml_result["image_height"],
                "status": "processed",
            }
        ).execute()

        # ---------------------------------------------------------
        # 12. Save detections
        # ---------------------------------------------------------
        location = source_metadata.get("location", {})

        saved_detections = save_ml_detections(
            image_id,
            ml_result,
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
        )

        # ---------------------------------------------------------
        # 13. Return complete result
        # ---------------------------------------------------------
        location = source_metadata.get("location", {})

        target_class = source_metadata.get("target_class", {})

        return {
            "message": "Sonar ZIP processed successfully",
            "image_id": image_id,
            "filename": file.filename,

            "survey_id": survey_id,

            "input_files": {
                "son": str(son_path),
                "idx": str(idx_path),
                "metadata_json": str(metadata_source_path),
            },

            "processed_files": {
                "echogram": str(echogram_path),
                "metadata_csv": str(metadata_csv_path),
                "metadata_json": str(metadata_json_path),
                "npz": str(npz_path),
                "source_metadata_json": str(source_metadata_saved),
            },

            "survey_metadata": {
                "synthetic": source_metadata.get("synthetic"),
                "image_id": source_metadata.get("image_id"),
                "image_width": source_metadata.get("image_width"),
                "image_height": source_metadata.get("image_height"),
                "target_class": target_class,
                "frequency_hz": source_metadata.get("frequency_hz"),
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
            },

            "detections_found": len(saved_detections),
            "detections": saved_detections,
        }

    except HTTPException:
        raise

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid ZIP archive",
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Metadata JSON inside the ZIP is invalid",
        )

    except Exception as e:
        print("ZIP UPLOAD ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )