from config import supabase


def upload_file_to_storage(file_bytes, file_path, content_type):
    response = supabase.storage.from_("uploads").upload(
        file_path,
        file_bytes,
        {
            "content-type": content_type
        }
    )

    return response