from config import supabase


def save_ml_detections(
    image_id: str,
    ml_result: dict,
    latitude: float | None = None,
    longitude: float | None = None,
):
    saved_detections = []

    for detection in ml_result["detections"]:
        bbox = detection["bbox"]

        detection_data = {
            "image_id": image_id,
            "model_version": ml_result["model_version"],
            "class_id": detection["class_id"],
            "class_name": detection["class_name"],
            "model_confidence": detection["confidence"],
            "x1": round(bbox["x1"]),
            "y1": round(bbox["y1"]),
            "x2": round(bbox["x2"]),
            "y2": round(bbox["y2"]),
            "filter_status": "pending",
            "latitude": latitude,
            "longitude": longitude,
        }

        response = (
            supabase
            .table("detections")
            .insert(detection_data)
            .execute()
        )

        if response.data:
            saved_detections.extend(response.data)

    return saved_detections