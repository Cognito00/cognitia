from fastapi import APIRouter, HTTPException

from config import supabase
from services.geolocation_service import get_detection_location


router = APIRouter()


@router.post("/detections/{detection_id}/geolocate")
def geolocate_detection(detection_id: int):

    try:
        detection_response = (
            supabase
            .table("detections")
            .select("*")
            .eq("id", detection_id)
            .execute()
        )

        if not detection_response.data:
            raise HTTPException(
                status_code=404,
                detail="Detection not found"
            )

        detection = detection_response.data[0]

        metadata_file_path = "../B001.json"

        location = get_detection_location(
            metadata_file_path,
            detection["x1"],
            detection["x2"]
        )

        response = (
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
            "location": location,
            "data": response.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )