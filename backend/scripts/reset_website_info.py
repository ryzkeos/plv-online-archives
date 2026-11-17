import sys
import os
from dotenv import load_dotenv

# ── Bootstrap: resolve backend/ root so core.db is importable ────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, BACKEND_DIR)

load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from core.db import DB  # noqa: E402 — must come after sys.path patch

# ── Target keys + their new defaults ─────────────────────────────────────────
WEBSITE_INFO_DEFAULTS = [
    ('contact_email',   ''),
    ('contact_phone',   ''),
    ('contact_address', ''),
    ('footer_text',     ''),
    ('social_facebook', 'https://facebook.com'),
    ('social_twitter',  'https://twitter.com'),
    ('about_us',        ''),
]

KEYS = [row[0] for row in WEBSITE_INFO_DEFAULTS]


def reset_website_info() -> None:
    print('🔄 Resetting website info settings...\n')

    # 1. Show current values before touching anything
    placeholders = ', '.join(['%s'] * len(KEYS))
    current = DB.query(
        f'SELECT key, value FROM app_settings WHERE key IN ({placeholders})',
        tuple(KEYS)
    )
    if current:
        print('  Current values:')
        for row in current:
            print(f'    {row["key"]:<20} = {repr(row["value"])}')
    else:
        print('  (no existing rows found for these keys)')
    print()

    # 2. Delete
    DB.execute(
        f'DELETE FROM app_settings WHERE key IN ({placeholders})',
        tuple(KEYS)
    )
    print(f'  🗑️  Deleted {len(KEYS)} rows.')

    # 3. Re-insert with new defaults
    for key, value in WEBSITE_INFO_DEFAULTS:
        DB.execute(
            'INSERT INTO app_settings (key, value) VALUES (%s, %s)',
            (key, value)
        )
    print(f'  ✅ Inserted {len(WEBSITE_INFO_DEFAULTS)} rows with new defaults.\n')

    # 4. Confirm
    updated = DB.query(
        f'SELECT key, value FROM app_settings WHERE key IN ({placeholders})',
        tuple(KEYS)
    )
    print('  New values:')
    for row in updated:
        print(f'    {row["key"]:<20} = {repr(row["value"])}')

    print('\n🎉 Done.')


if __name__ == '__main__':
    reset_website_info()
