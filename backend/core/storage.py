import os
from supabase import create_client, Client

_client: Client | None = None

def _get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if not url or not key:
            raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
        _client = create_client(url, key)
    return _client


BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET', 'plv-archives')


def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    """
    Upload bytes to Supabase Storage and return the public URL.
    storage_path: e.g. 'pdf/uuid.pdf' or 'thumbnails/uuid.jpg'
    """
    client = _get_client()
    client.storage.from_(BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={'content-type': content_type, 'upsert': 'true'},
    )
    public_url = client.storage.from_(BUCKET).get_public_url(storage_path)
    return public_url


def delete_file(storage_path: str) -> None:
    """Delete a file from Supabase Storage. storage_path: e.g. 'pdf/uuid.pdf'"""
    client = _get_client()
    try:
        client.storage.from_(BUCKET).remove([storage_path])
    except Exception as e:
        print(f'[storage] delete failed for {storage_path}: {e}')
