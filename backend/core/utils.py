import uuid
from core.db import DB

def log_activity(admin_id, admin_name, action, target_type=None, target_label=None):
    try:
        activity_id = str(uuid.uuid4())
        DB.execute('''
            INSERT INTO activity_log (id, admin_id, admin_name, action, target_type, target_label)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (activity_id, admin_id, admin_name, action, target_type, target_label))
    except Exception as e:
        print(f"Logging error: {e}")
