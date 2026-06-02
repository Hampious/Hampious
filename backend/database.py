"""
Supabase database client for Hampious.
All data (products, categories, orders, customers, cart) persists here.
"""
import os
from supabase import create_client, Client

# Auto-load .env file
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lejcpbinyxmvjowbariq.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

_client: Client = None

def get_db() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_KEY not set in environment variables")
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


# ── Helper wrappers ───────────────────────────────────────────────────────────

def db_select(table: str, filters: dict = None, order: str = None, limit: int = None):
    """Fetch rows from a table."""
    q = get_db().table(table).select("*")
    if filters:
        for col, val in filters.items():
            q = q.eq(col, val)
    if order:
        q = q.order(order, desc=True)
    if limit:
        q = q.limit(limit)
    return q.execute().data or []


def db_insert(table: str, data: dict):
    """Insert a row and return it."""
    return get_db().table(table).insert(data).execute().data


def db_update(table: str, id_col: str, id_val, data: dict):
    """Update rows matching id_col=id_val."""
    return get_db().table(table).update(data).eq(id_col, id_val).execute().data


def db_delete(table: str, id_col: str, id_val):
    """Delete rows matching id_col=id_val."""
    return get_db().table(table).delete().eq(id_col, id_val).execute().data


def db_upsert(table: str, data: dict, on_conflict: str = "id"):
    """Insert or update."""
    return get_db().table(table).upsert(data, on_conflict=on_conflict).execute().data
