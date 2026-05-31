import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-supabase-url.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

supabase = None

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except ImportError:
    print("Warning: Supabase not installed. Running in local development mode.")
except Exception as e:
    print(f"Warning: Supabase client initialization failed: {e}")
    print("Running in local development mode without Supabase")
