import csv
from io import StringIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import supabase


router = APIRouter()


# -----------------------------
# JSON REPORT
# -----------------------------
@router.get("/images/{image_id}/report.json")
def generate_json_report(image_id: str):
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
            .execute()
        )

        detections = detections_response.data

        accepted_count = sum(
            1 for d in detections
            if d["filter_status"] == "accepted"
        )

        rejected_count = sum(
            1 for d in detections
            if d["filter_status"] == "rejected"
        )

        pending_count = sum(
            1 for d in detections
            if d["filter_status"] == "pending"
        )

        report = {
            "image": image_response.data[0],
            "summary": {
                "total_detections": len(detections),
                "accepted": accepted_count,
                "rejected": rejected_count,
                "pending": pending_count
            },
            "detections": detections
        }

        return report

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -----------------------------
# CSV REPORT
# -----------------------------
@router.get("/images/{image_id}/report.csv")
def download_csv_report(image_id: str):
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
            .execute()
        )

        detections = detections_response.data

        output = StringIO()

        writer = csv.writer(output)

        writer.writerow([
            "Detection ID",
            "Image ID",
            "Class ID",
            "Class",
            "Confidence",
            "Filter Status",
            "x1",
            "y1",
            "x2",
            "y2",
            "Latitude",
            "Longitude",
            "Model Version"
        ])

        for d in detections:
            writer.writerow([
                d["id"],
                d["image_id"],
                d["class_id"],
                d["class_name"],
                d["model_confidence"],
                d["filter_status"],
                d["x1"],
                d["y1"],
                d["x2"],
                d["y2"],
                d["latitude"],
                d["longitude"],
                d["model_version"]
            ])

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                f"attachment; filename=report_{image_id}.csv"
            }
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


    