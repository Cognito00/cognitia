from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import uuid

from config import supabase
from services.ml_service import (
    preprocess_sonar,
    package_sonar_data,
    run_ml_detection
)
from services.detection_service import save_ml_detections


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEMP_DIR = PROJECT_ROOT / "storage" / "temp"
PROCESSED_DIR = PROJECT_ROOT / "storage" / "processed"


@router.post("/upload")
async def upload_sonar_image(file: UploadFile = File(...)):
    try:

        # Validate filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required"
            )

        # Only SON files allowed
        if not file.filename.lower().endswith(".son"):
            raise HTTPException(
                status_code=400,
                detail="Only .SON files are supported"
            )

        # Create unique upload ID
        image_id = str(uuid.uuid4())
        survey_id = Path(file.filename).stem

        # ------------------------------------------------
        # SAVE RAW SON LOCALLY
        # ------------------------------------------------

        temp_upload_dir = TEMP_DIR / image_id
        temp_upload_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        local_son_path = temp_upload_dir / file.filename

        # Save file in 1 MB chunks
        with open(local_son_path, "wb") as output_file:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                output_file.write(chunk)

        # ------------------------------------------------
        # CREATE OUTPUT DIRECTORY
        # ------------------------------------------------

        upload_output_dir = PROCESSED_DIR / image_id

        upload_output_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # ------------------------------------------------
        # STAGE 1
        # SON -> Echogram + Metadata CSV
        # ------------------------------------------------

        preprocess_sonar(
            str(local_son_path),
            str(upload_output_dir)
        )

        echogram_path = (
            upload_output_dir /
            f"{survey_id}_echogram.png"
        )

        metadata_csv_path = (
            upload_output_dir /
            f"{survey_id}_metadata.csv"
        )

        if not echogram_path.exists():
            raise FileNotFoundError(
                f"Echogram was not created: {echogram_path}"
            )

        if not metadata_csv_path.exists():
            raise FileNotFoundError(
                f"Metadata CSV was not created: {metadata_csv_path}"
            )

        # ------------------------------------------------
        # STAGE 2
        # Echogram + CSV -> JSON + NPZ
        # ------------------------------------------------

        packaged = package_sonar_data(
            str(echogram_path),
            str(metadata_csv_path),
            survey_id,
            str(upload_output_dir)
        )

        metadata_json_path = packaged["json_path"]
        npz_path = packaged["npz_path"]

        # ------------------------------------------------
        # STAGE 3 + 4
        # YOLO + FALSE-POSITIVE FILTER
        # ------------------------------------------------

        ml_result = run_ml_detection(
            str(echogram_path)
        )

        # ------------------------------------------------
        # SAVE SURVEY INFO TO SUPABASE DATABASE
        # ------------------------------------------------

        supabase.table("sonar_images").insert({
            "id": image_id,
            "original_filename": file.filename,
            "processed_png_path": str(echogram_path),
            "metadata_json_path": str(metadata_json_path),
            "npz_path": str(npz_path),
            "image_width": ml_result["image_width"],
            "image_height": ml_result["image_height"],
            "status": "processed"
        }).execute()

        # ------------------------------------------------
        # SAVE FINAL DETECTIONS
        # ------------------------------------------------

        saved_detections = save_ml_detections(
            image_id,
            ml_result
        )

        # ------------------------------------------------
        # RETURN RESULT
        # ------------------------------------------------

        return {
            "message": "Sonar file processed successfully",
            "image_id": image_id,
            "filename": file.filename,
            "processed_png_path": str(echogram_path),
            "metadata_json_path": str(metadata_json_path),
            "npz_path": str(npz_path),
            "detections_found": len(saved_detections),
            "detections": saved_detections
        }

    except HTTPException:
        raise

    except Exception as e:
        print("UPLOAD ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )