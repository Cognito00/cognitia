from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from config import supabase
from models.detection_model import DetectionInput, DetectionFilterUpdate


router = APIRouter()


# ---------------------------------------------------------
# CREATE DETECTION
# ---------------------------------------------------------

@router.post("/detections")
def create_detection(detection: DetectionInput):
    try:
        response = supabase.table("detections").insert({
            "image_id": detection.image_id,
            "model_version": detection.model_version,
            "class_id": detection.class_id,
            "class_name": detection.class_name,
            "model_confidence": detection.confidence,

            "x1": detection.bbox.x1,
            "y1": detection.bbox.y1,
            "x2": detection.bbox.x2,
            "y2": detection.bbox.y2,

            "filter_status": "pending"
        }).execute()

        return {
            "message": "Detection stored successfully",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------
# UPDATE FALSE-POSITIVE FILTER RESULT
# ---------------------------------------------------------

@router.put("/detections/{detection_id}/filter")
def update_detection_filter(
    detection_id: int,
    result: DetectionFilterUpdate
):
    try:
        response = (
            supabase
            .table("detections")
            .update({
                "filter_status": result.status,
                "rejection_reason": result.reason
            })
            .eq("id", detection_id)
            .execute()
        )

        return {
            "message": "Detection filter result updated successfully",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------
# GET ALL DETECTIONS
# ---------------------------------------------------------

@router.get("/detections")
def get_all_detections():
    try:
        response = (
            supabase
            .table("detections")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "message": "Detections fetched successfully",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------
# GET RESULTS FOR ONE SONAR IMAGE
# ---------------------------------------------------------

@router.get("/images/{image_id}/results")
def get_image_results(image_id: str):
    try:
        image_response = (
            supabase
            .table("sonar_images")
            .select("*")
            .eq("id", image_id)
            .execute()
        )

        if not image_response.data:
            raise HTTPException(
                status_code=404,
                detail="Image not found"
            )

        detections_response = (
            supabase
            .table("detections")
            .select("*")
            .eq("image_id", image_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "message": "Image results fetched successfully",
            "image": image_response.data[0],
            "detections": detections_response.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------
# GET PROCESSED ECHOGRAM PNG
# ---------------------------------------------------------

@router.get("/images/{image_id}/file")
def get_image_file(image_id: str):
    try:
        image_response = (
            supabase
            .table("sonar_images")
            .select("processed_png_path")
            .eq("id", image_id)
            .execute()
        )

        if not image_response.data:
            raise HTTPException(
                status_code=404,
                detail="Image not found"
            )

        processed_png_path = image_response.data[0].get(
            "processed_png_path"
        )

        if not processed_png_path:
            raise HTTPException(
                status_code=404,
                detail="Processed image path not found"
            )

        image_path = Path(processed_png_path)

        if not image_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Processed image file not found"
            )

        return FileResponse(
            path=str(image_path),
            media_type="image/png",
            filename=image_path.name
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )