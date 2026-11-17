import sys
import os
import uuid
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db import DB


def seed():
    is_reset = '--reset' in sys.argv
    print('Starting Database Reset & Seeding...' if is_reset else 'Starting Database Seeding...')

    try:
        if is_reset:
            print('Clearing Data...')
            DB.execute('DELETE FROM activity_log')
            DB.execute('DELETE FROM inbox')
            DB.execute('DELETE FROM research_awards')
            DB.execute('DELETE FROM bookmarks')
            DB.execute('DELETE FROM research')
            DB.execute('DELETE FROM users')
            DB.execute('DELETE FROM school_years')
            DB.execute('DELETE FROM awards')
            DB.execute('DELETE FROM selectibles')
            DB.execute('DELETE FROM announcements')
            DB.execute('DELETE FROM otp_tokens')
            DB.execute('DELETE FROM password_reset_tokens')
            DB.execute('DELETE FROM app_settings')
            print('Clean Slate Achieved.')

        # ── 1. APP SETTINGS ───────────────────────────────────────────────────
        print('Seeding App Settings...')
        default_settings = [
            ('appName',                 'PLV ARCHIVES'),
            ('tagline',                 'PLV ONLINE ARCHIVES'),
            ('logoUrl',                 ''),
            ('contact_email',           ''),
            ('contact_phone',           ''),
            ('contact_address',         ''),
            ('footer_text',             ''),
            ('social_facebook',         'https://facebook.com'),
            ('social_twitter',          'https://twitter.com'),
            ('about_us',                ''),
            ('maintenance_mode',        'false'),
            ('mfa_enforcement',         'false'),
            ('session_timeout',         'true'),
            ('public_registration',     'true'),
            ('admin_registration_lock', 'false'),
            ('brand_primary',           '#14b8a6'),
            ('brand_secondary',         '#f59e0b'),
        ]
        for key, value in default_settings:
            DB.execute(
                'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING',
                (key, value)
            )
        print('App Settings Seeded.')

        # ── 2. MASTERADMIN ────────────────────────────────────────────────────
        MASTER_FULL_NAME      = 'John Ruenz'
        MASTER_STUDENT_NUMBER = None
        MASTER_COURSE         = None
        MASTER_SECTION        = None
        MASTER_YEAR_LEVEL     = None
        MASTER_PERSONAL_EMAIL = 'masteradmin@gmail.com'
        MASTER_PLV_EMAIL      = 'masteradmin@plv.edu.ph'
        MASTER_PASSWORD       = 'masteradmin777'

        existing_super = DB.query_one('SELECT id FROM users WHERE plv_email = ?', (MASTER_PLV_EMAIL,))
        if not existing_super:
            print('Creating Master Administrator...')
            super_id    = str(uuid.uuid4())
            master_hash = bcrypt.hashpw(MASTER_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            DB.execute('''
                INSERT INTO users (
                    id, full_name, student_number, course, section, year_level,
                    personal_email, plv_email, password_hash, role, status,
                    email_verified, admin_approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'masteradmin', 'active', 1, 1)
            ''', (super_id, MASTER_FULL_NAME, MASTER_STUDENT_NUMBER, MASTER_COURSE,
                  MASTER_SECTION, MASTER_YEAR_LEVEL, MASTER_PERSONAL_EMAIL,
                  MASTER_PLV_EMAIL, master_hash))
            print(f'Master Administrator Created: {MASTER_PLV_EMAIL} / {MASTER_PASSWORD}')
        else:
            print('Master Administrator already exists.')

        # ── 3. SCHOOL YEAR ────────────────────────────────────────────────────
        print('Seeding School Year...')
        current_year = '2025-2026'
        existing_year = DB.query_one('SELECT id FROM school_years WHERE year = ?', (current_year,))
        if not existing_year:
            yid = str(uuid.uuid4())
            DB.execute(
                'INSERT INTO school_years (id, year, start_date, end_date, status, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                (yid, current_year, '2025-08-01', '2026-05-31', 'Active', 1)
            )
            print(f'School Year {Current_year} Seeded.')
        else:
            print('School Year Already Exists.')

        # ── 4. AWARDS ─────────────────────────────────────────────────────────
        print('Seeding Default Awards...')
        default_awards = [
            ('Outstanding Research',     'Award',     'amber'),
            ('Best Technical Paper',     'FileText',  'blue'),
            ('Most Innovative Research', 'Lightbulb', 'emerald'),
            ("Dean's Choice Award",      'Star',      'rose'),
        ]
        for title, icon, color in default_awards:
            DB.execute(
                'INSERT INTO awards (id, title, icon_name, color) VALUES (?, ?, ?, ?) ON CONFLICT (title) DO NOTHING',
                (str(uuid.uuid4()), title, icon, color)
            )
        print('Awards Seeded.')

        # ── 5. SELECTIBLES ────────────────────────────────────────────────────
        print('Seeding Selectibles...')
        selectibles = [
            # ── Courses (PLV official programs) ───────────────────────────────
            ('course', 'BSA'),          # BS Accountancy
            ('course', 'BSBA-FM'),      # BS Business Administration – Financial Management
            ('course', 'BSBA-MM'),      # BS Business Administration – Marketing Management
            ('course', 'BSBA-HRM'),     # BS Business Administration – Human Resource Management
            ('course', 'BSPsych'),      # BS Psychology
            ('course', 'BSSW'),         # BS Social Work
            ('course', 'BSComm'),       # BS Communication
            ('course', 'BECEd'),        # Bachelor of Early Childhood Education
            ('course', 'BSEd-Eng'),     # BS Education – English
            ('course', 'BSEd-Fil'),     # BS Education – Filipino
            ('course', 'BSEd-Math'),    # BS Education – Mathematics
            ('course', 'BSEd-Sci'),     # BS Education – Science
            ('course', 'BSEd-SS'),      # BS Education – Social Studies
            ('course', 'BSCE'),         # BS Civil Engineering
            ('course', 'BSEE'),         # BS Electrical Engineering
            ('course', 'BSIT'),         # BS Information Technology
            ('course', 'BSPA'),         # BS Public Administration

            # ── Year Levels ───────────────────────────────────────────────────
            ('year_level', '1st Year'),
            ('year_level', '2nd Year'),
            ('year_level', '3rd Year'),
            ('year_level', '4th Year'),

            # ── Sections ──────────────────────────────────────────────────────
            ('section', '1'),
            ('section', '2'),
            ('section', '3'),
            ('section', '4'),
            ('section', '5'),
            ('section', '6'),
            ('section', '7'),
            ('section', '8'),
            ('section', '9'),
            ('section', '10'),

            # ── Research Categories ───────────────────────────────────────────
            ('research_category', 'Thesis'),
            ('research_category', 'Capstone'),
            ('research_category', 'Case Study'),
            ('research_category', 'Feasibility Study'),
            ('research_category', 'Experimental Research'),
            ('research_category', 'Descriptive Research'),
            ('research_category', 'Action Research'),
        ]
        for category, value in selectibles:
            DB.execute(
                'INSERT INTO selectibles (id, category, value) VALUES (?, ?, ?) ON CONFLICT (category, value) DO NOTHING',
                (str(uuid.uuid4()), category, value)
            )
        print('Selectibles Seeded.')

        print('\nSeeding Complete!')
        print('----------------------------------------')
        print('Credentials:')
        print(f'  PLV Email : {MASTER_PLV_EMAIL}')
        print(f'  Password  : {MASTER_PASSWORD}')
        print('----------------------------------------')

    except Exception as e:
        print(f'❌ Seeding Failed: {e}')
        raise


if __name__ == '__main__':
    seed()
