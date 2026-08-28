from fastapi import APIRouter, UploadFile, File
from services.storage_service import upload_file_to_storage
from config import supabase
import uuid


router = APIRouter()


@router.post("/upload")
async def upload_sonar_image(file: UploadFile = File(...)):

    image_id = str(uuid.uuid4())

    file_bytes = await file.read()

    file_path = f"{image_id}/{file.filename}"

    upload_file_to_storage(
        file_bytes,
        file_path,
        file.content_type
    )

    supabase.table("sonar_images").insert({
        "id": image_id,
        "original_filename": file.filename,
        "processed_png_path": file_path,
        "status": "uploaded"
    }).execute()

    return {
        "message": "File uploaded successfully",
        "image_id": image_id,
        "filename": file.filename,
        "storage_path": file_path
    }