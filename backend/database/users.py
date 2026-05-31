from supabase_client import supabase

def get_user_by_email(email):
    return supabase.table("users").select("*").eq("email", email).execute()

def create_user(data):
    return supabase.table("users").insert(data).execute()
