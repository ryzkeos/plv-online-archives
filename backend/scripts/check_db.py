import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.db import DB

def main():
    args = sys.argv[1:]

    if '--tables' in args:
        tables = ['users', 'research', 'awards', 'school_years',
                  'selectibles', 'app_settings', 'activity_log', 'inbox']
        print('\nTable Row Counts:')
        for t in tables:
            result = DB.query_one(f'SELECT COUNT(*) as n FROM {t}')
            print(f'  {t:<20} {result["n"]} rows')
        return

    if args:
        email = args[0]
        user = DB.query_one(
            'SELECT id, full_name, plv_email, role, status, admin_approved, email_verified FROM users WHERE personal_email = ? OR plv_email = ?',
            (email, email)
        )
        if user:
            print(f'\nFound User:')
            for k, v in user.items():
                print(f'  {k:<20} {v}')
        else:
            print(f'No User Found For: {email}')
    else:
        users = DB.query(
            'SELECT id, full_name, plv_email, role, status FROM users ORDER BY role, full_name'
        )
        print(f'\nAll Users ({len(users)} total):')
        for u in users:
            print(f'  [{u["role"]:<12}] {u["full_name"]:<30} {u["plv_email"]}  ({u["status"]})')

if __name__ == '__main__':
    main()
