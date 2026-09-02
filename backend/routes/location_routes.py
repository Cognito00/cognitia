from fastapi import APIRouter, HTTPException
from config import supabase
from services.geolocation_service import get_detection_location

router = APIRouter()


@router.post("/detections/{detection_id}/geolocate")
def geolocate_detection(detection_id: int):
    try:
        # 1. Get the detection
        detection_response = (
            supabase
            .table("detections")
            .select("*")
            .eq("id", detection_id)
            .single()
            .execute()
        )

        detection = detection_response.data

        if not detection:
            raise HTTPException(
                status_code=404,
                detail="Detection not found"
            )

        image_id = detection["image_id"]

        # 2. Get the sonar image record
        image_response = (
            supabase
            .table("sonar_images")
            .select("*")
            .eq("id", image_id)
            .single()
            .execute()
        )

        image = image_response.data

        if not image:
            raise HTTPException(
                status_code=404,
                detail="Sonar image record not found"
            )

        metadata_file_path = image["metadata_json_path"]

        if not metadata_file_path:
            raise HTTPException(
                status_code=400,
                detail="Metadata JSON path not available"
            )

        # 3. Calculate detection location
        location = get_detection_location(
            metadata_file_path,
            detection["x1"],
            detection["x2"]
        )

        # 4. Save latitude and longitude in Supabase
        update_response = (
            supabase
            .table("detections")
            .update({
                "latitude": location["latitude"],
                "longitude": location["longitude"]
            })
            .eq("id", detection_id)
            .execute()
        )

        return {
            "message": "Detection geolocated successfully",
            "detection_id": detection_id,
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "depth_m": location["depth_m"],
            "time_ms": location["time_ms"]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )