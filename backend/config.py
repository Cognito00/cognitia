import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL or key is missing from .env")


# print("KEY TYPE:", SUPABASE_KEY[:10])

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)