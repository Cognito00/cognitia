import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


# Load backend/.env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing from .env")


# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


print("Starting history cleanup...")


# 1. Delete all detection records
print("Deleting detections...")
supabase.table("detections").delete().neq("id", -1).execute()
print("Detections deleted.")


# 2. Delete all sonar image / mission records
print("Deleting sonar images...")
supabase.table("sonar_images").delete().neq("id", "").execute()
print("Sonar images deleted.")


print()
print("================================")
print(" HISTORY CLEARED SUCCESSFULLY ")
print("================================")
print("Your website is now ready for a fresh demo.")