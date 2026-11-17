import uuid
import bcrypt
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from core.db import DB
from core.middleware import authenticate_token, is_admin, is_superadmin
from core.utils import log_activity

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/pending-count', methods=['GET'])
@authenticate_token
@is_admin
def pending_count():
    pending_reg = DB.query_one("SELECT count(*) as count FROM users WHERE status = 'pending'")
    pending_up = DB.query_one("SELECT count(*) as count FROM research WHERE status = 'pending'")
    return jsonify({
        'pendingRegistrations': pending_reg['count'],
        'pendingUploads': pending_up['count'],
        'total': pending_reg['count'] + pending_up['count'],
    })


@admin_bp.route('/registrations', methods=['GET'])
@authenticate_token
@is_admin
def get_registrations():
    status = request.args.get('status', '').lower()
    sql = "SELECT * FROM users WHERE role = 'student'"

    if status in ['all', 'all applications']:
        return jsonify([dict(r) for r in DB.query(sql)])
    elif status == 'pending':
        return jsonify([dict(r) for r in DB.query(sql + " AND status = 'pending'")])
    elif status == 'approved':
        return jsonify([dict(r) for r in DB.query(sql + ' AND admin_approved = 1')])
    elif status == 'rejected':
        return jsonify([dict(r) for r in DB.query(sql + " AND status = 'rejected'")])
    else:
        return jsonify([dict(r) for r in DB.query(sql)])


@admin_bp.route('/registrations/<id>/approve', methods=['PUT'])
@authenticate_token
@is_admin
def approve_registration(id):
    DB.execute("UPDATE users SET admin_approved = 1, status = 'active' WHERE id = ?", (id,))
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Approved registration', 'user', user['full_name'] if user else None)
    DB.execute('INSERT INTO inbox (id, user_id, title, content) VALUES (?, ?, ?, ?)',
               (str(uuid.uuid4()), id, 'Account Approved',
                'Welcome to PLV Online Archive! Your account has been approved by the administrators.'))
    return jsonify({'message': 'Registration approved'})


@admin_bp.route('/registrations/<id>/reject', methods=['PUT'])
@authenticate_token
@is_admin
def reject_registration(id):
    DB.execute("UPDATE users SET status = 'rejected', admin_approved = 0 WHERE id = ?", (id,))
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Rejected registration', 'user', user['full_name'] if user else None)
    return jsonify({'message': 'Registration rejected'})


@admin_bp.route('/uploads', methods=['GET'])
@authenticate_token
@is_admin
def get_uploads():
    status = request.args.get('status', '').lower()
    sql = '''
        SELECT
          r.*,
          u.full_name as user_name, u.course, u.section, u.avatar_url, u.role, u.year_level,
          COALESCE(
            (SELECT json_agg(json_build_object('id', a.id, 'title', a.title, 'icon', a.icon_name))
             FROM research_awards ra
             JOIN awards a ON ra.award_id = a.id
             WHERE ra.research_id = r.id),
            '[]'::json
          ) as awards
        FROM research r
        JOIN users u ON r.uploaded_by = u.id
        WHERE r.deleted_at IS NULL
    '''

    if status and status not in ['all', 'all status', 'all uploads']:
        sql += ' AND r.status = ?'
        results = DB.query(sql, (status,))
    else:
        results = DB.query(sql)

    parsed = []
    for r in results:
        item = dict(r)
        if isinstance(item.get('awards'), str):
            try:
                item['awards'] = json.loads(item['awards'])
            except Exception:
                item['awards'] = []
        elif item.get('awards') is None:
            item['awards'] = []

        try:
            item['researchers'] = json.loads(item.get('researchers', '[]')) if item.get('researchers') else []
        except Exception:
            item['researchers'] = []
        parsed.append(item)
    return jsonify(parsed)


@admin_bp.route('/uploads/<id>/accept', methods=['PUT'])
@authenticate_token
@is_admin
def accept_upload(id):
    DB.execute("UPDATE research SET status = 'accepted' WHERE id = ?", (id,))
    research = DB.query_one('SELECT uploaded_by, title FROM research WHERE id = ?', (id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Accepted upload', 'research', research['title'] if research else None)
    if research:
        DB.execute('INSERT INTO inbox (id, user_id, title, content) VALUES (?, ?, ?, ?)',
                   (str(uuid.uuid4()), research['uploaded_by'], 'Research Approved',
                    f"Your research titled \"{research['title']}\" has been approved and published."))
    return jsonify({'message': 'Research accepted'})


@admin_bp.route('/uploads/<id>/reject', methods=['PUT'])
@authenticate_token
@is_admin
def reject_upload(id):
    reason = request.json.get('reason')
    DB.execute("UPDATE research SET status = 'rejected', rejection_reason = ? WHERE id = ?", (reason, id))
    research = DB.query_one('SELECT uploaded_by, title FROM research WHERE id = ?', (id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Rejected upload', 'research', research['title'] if research else None)
    if research:
        DB.execute('INSERT INTO inbox (id, user_id, title, content) VALUES (?, ?, ?, ?)',
                   (str(uuid.uuid4()), research['uploaded_by'], 'Research Rejected',
                    f"Your research titled \"{research['title']}\" was rejected. Reason: {reason}"))
    return jsonify({'message': 'Research rejected'})


@admin_bp.route('/settings', methods=['GET'])
@authenticate_token
@is_admin
def get_settings():
    settings = DB.query('SELECT * FROM app_settings')
    return jsonify({s['key']: s['value'] for s in settings})


@admin_bp.route('/settings', methods=['PUT'])
@authenticate_token
@is_superadmin
def update_settings():
    updates = request.json
    for key, value in updates.items():
        DB.execute(
            'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
            (key, str(value))
        )
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Updated application settings')
    return jsonify({'message': 'Settings updated'})


@admin_bp.route('/selectibles', methods=['GET'])
@authenticate_token
@is_admin
def get_selectibles():
    rows = DB.query('SELECT * FROM selectibles')
    grouped = {}
    for r in rows:
        cat = r['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append({'id': r['id'], 'value': r['value']})
    return jsonify(grouped)


@admin_bp.route('/selectibles', methods=['POST'])
@authenticate_token
@is_superadmin
def add_selectible():
    data = request.json
    category = data.get('category')
    value = data.get('value')
    sid = str(uuid.uuid4())
    DB.execute('INSERT INTO selectibles (id, category, value) VALUES (?, ?, ?)', (sid, category, value))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Added selectible', 'selectible', f'{category}: {value}')
    return jsonify({'id': sid, 'message': 'Item added'})


@admin_bp.route('/selectibles/<id>', methods=['PUT', 'DELETE'])
@authenticate_token
@is_superadmin
def handle_selectible(id):
    if request.method == 'PUT':
        value = request.json.get('value')
        selectible = DB.query_one('SELECT category, value FROM selectibles WHERE id = ?', (id,))
        DB.execute('UPDATE selectibles SET value = ? WHERE id = ?', (value, id))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Updated selectible', 'selectible',
                     f"{selectible['category']}: {value}" if selectible else 'Unknown')
        return jsonify({'message': 'Item updated'})
    else:
        selectible = DB.query_one('SELECT category, value FROM selectibles WHERE id = ?', (id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Deleted selectible', 'selectible',
                     f"{selectible['category']}: {selectible['value']}" if selectible else 'Unknown')
        DB.execute('DELETE FROM selectibles WHERE id = ?', (id,))
        return jsonify({'message': 'Item deleted'})


@admin_bp.route('/admins', methods=['GET'])
@authenticate_token
@is_superadmin
def get_admins():
    admins = DB.query("SELECT id, full_name, plv_email, role, status, avatar_url FROM users WHERE role IN ('admin', 'masteradmin')")
    return jsonify([dict(a) for a in admins])


@admin_bp.route('/admins', methods=['POST'])
@authenticate_token
@is_superadmin
def register_admin():
    data = request.json
    full_name = data.get('full_name')
    plv_email = data.get('plv_email')
    password = data.get('password')
    role = data.get('role', 'admin')

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    aid = str(uuid.uuid4())
    try:
        DB.execute('''
            INSERT INTO users (id, full_name, plv_email, password_hash, role, status, admin_approved, email_verified, student_number, course, section, year_level, personal_email)
            VALUES (?, ?, ?, ?, ?, 'active', 1, 1, NULL, '', '', '', ?)
        ''', (aid, full_name, plv_email, pw_hash, role, plv_email))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Registered new administrator', 'admin', full_name)
        return jsonify({'message': 'Admin registered'})
    except Exception as e:
        err_message=str(e).lower()
        if 'unique' in er_msg and 'plv_email' in err_msg:
            return jsonify({'error': 'An admin with that email already exists'}), 400
        return jsonify({'error': 'Failed to register admin'}), 500


@admin_bp.route('/admins/<id>', methods=['PUT', 'DELETE'])
@authenticate_token
@is_superadmin
def handle_admin(id):
    if request.method == 'PUT':
        data = request.json
        full_name = data.get('full_name')
        role = data.get('role')
        status = data.get('status')
        if id == request.user['id'] and role and role != 'masteradmin':
            return jsonify({'error': 'You cannot demote yourself'}), 400
        user = DB.query_one('SELECT * FROM users WHERE id = ?', (id,))
        DB.execute('UPDATE users SET full_name = ?, role = ?, status = ? WHERE id = ?',
                   (full_name or user['full_name'], role or user['role'], status or user['status'], id))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Updated administrator info', 'admin', full_name or user['full_name'])
        return jsonify({'message': 'Admin updated'})
    else:
        if id == request.user['id']:
            return jsonify({'error': 'You cannot delete yourself'}), 400
        admin = DB.query_one('SELECT full_name FROM users WHERE id = ?', (id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Deleted administrator', 'admin', admin['full_name'] if admin else None)
        DB.execute('DELETE FROM users WHERE id = ?', (id,))
        return jsonify({'message': 'Admin deleted'})


@admin_bp.route('/years', methods=['GET', 'POST'])
@authenticate_token
@is_admin
def handle_years():
    if request.method == 'POST':
        if not hasattr(request, 'user') or request.user['role'] != 'masteradmin':
            return jsonify({'error': 'Superadmin access required'}), 403
        data = request.json
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if not start_date or not end_date:
            return jsonify({'error': 'Start and end dates are required'}), 400
        try:
            sd = datetime.fromisoformat(start_date)
            ed = datetime.fromisoformat(end_date)
            year = f'{sd.year}' if sd.year == ed.year else f'{sd.year}-{ed.year}'
            yid = str(uuid.uuid4())
            DB.execute('INSERT INTO school_years (id, year, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
                       (yid, year, start_date, end_date, 'Upcoming'))
            log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                         'Added academic period', 'school_year', year)
            return jsonify({'message': 'Academic period added'})
        except Exception:
            return jsonify({'error': 'Academic period exists or invalid dates provided'}), 400
    else:
        years = DB.query('SELECT * FROM school_years ORDER BY year DESC')
        today = datetime.now().strftime('%Y-%m-%d')
        active = next((y for y in years if y['is_active'] == 1), None)
        if not active or (active['end_date'] and str(active['end_date'])[:10] < today):
            matching = next((y for y in years if y['start_date'] and y['end_date'] and
                             str(y['start_date'])[:10] <= today <= str(y['end_date'])[:10]), None)
            if matching and (not active or matching['id'] != active['id']):
                DB.execute('UPDATE school_years SET is_active = 0')
                DB.execute('UPDATE school_years SET is_active = 1 WHERE id = ?', (matching['id'],))
                years = DB.query('SELECT * FROM school_years ORDER BY year DESC')
        return jsonify([dict(y) for y in years])


@admin_bp.route('/years/<id>', methods=['PUT', 'DELETE'])
@authenticate_token
@is_superadmin
def update_year(id):
    if request.method == 'PUT':
        data = request.json
        status = data.get('status')
        is_active = data.get('is_active')
        target = DB.query_one('SELECT year FROM school_years WHERE id = ?', (id,))
        if is_active == 1:
            DB.execute('UPDATE school_years SET is_active = 0')
        DB.execute('UPDATE school_years SET status = ?, is_active = ? WHERE id = ?', (status, is_active, id))
        action = ('Activated school year' if is_active == 1
                  else 'Closed school year' if status == 'Closed' else 'Updated school year')
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     action, 'school_year', target['year'] if target else None)
        return jsonify({'message': 'School year updated'})
    else:
        target = DB.query_one('SELECT year FROM school_years WHERE id = ?', (id,))
        DB.execute('DELETE FROM school_years WHERE id = ?', (id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Deleted school year', 'school_year', target['year'] if target else None)
        return jsonify({'message': 'School year deleted'})


@admin_bp.route('/awards', methods=['GET', 'POST'])
@authenticate_token
@is_admin
def handle_awards():
    if request.method == 'POST':
        if not hasattr(request, 'user') or request.user['role'] != 'masteradmin':
            return jsonify({'error': 'Superadmin access required'}), 403
        data = request.json
        title = data.get('title')
        color = data.get('color', 'amber')
        icon = data.get('icon_name', 'Award')
        aid = str(uuid.uuid4())
        DB.execute('INSERT INTO awards (id, title, color, icon_name) VALUES (?, ?, ?, ?)', (aid, title, color, icon))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Created award', 'award', title)
        return jsonify({'message': 'Award created'})
    else:
        awards = DB.query('SELECT * FROM awards ORDER BY created_at DESC')
        return jsonify([dict(a) for a in awards])


@admin_bp.route('/awards/<id>', methods=['PUT', 'DELETE'])
@authenticate_token
@is_superadmin
def update_award(id):
    if request.method == 'PUT':
        data = request.json
        title = data.get('title')
        color = data.get('color')
        icon = data.get('icon_name')
        DB.execute('UPDATE awards SET title = ?, color = ?, icon_name = ? WHERE id = ?', (title, color, icon, id))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Updated award', 'award', title)
        return jsonify({'message': 'Award updated'})
    else:
        award = DB.query_one('SELECT title FROM awards WHERE id = ?', (id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Deleted award', 'award', award['title'] if award else None)
        DB.execute('DELETE FROM awards WHERE id = ?', (id,))
        return jsonify({'message': 'Award deleted'})


@admin_bp.route('/awards/<id>/researches', methods=['GET'])
@authenticate_token
@is_admin
def award_researches(id):
    res = DB.query('''
        SELECT r.id, r.title, r.category, r.uploaded_by, u.full_name as author_name
        FROM research_awards ra
        JOIN research r ON ra.research_id = r.id
        JOIN users u ON r.uploaded_by = u.id
        WHERE ra.award_id = ? AND r.deleted_at IS NULL
    ''', (id,))
    return jsonify([dict(r) for r in res])


@admin_bp.route('/research/<id>/awards', methods=['POST'])
@authenticate_token
@is_admin
def bestow_award(id):
    award_id = request.json.get('award_id')
    active = DB.query_one('SELECT id FROM school_years WHERE is_active = 1')
    try:
        raid = str(uuid.uuid4())
        DB.execute('INSERT INTO research_awards (id, research_id, award_id, school_year_id) VALUES (?, ?, ?, ?)',
                   (raid, id, award_id, active['id'] if active else None))
        DB.execute('UPDATE awards SET recipients_count = recipients_count + 1 WHERE id = ?', (award_id,))
        research = DB.query_one('SELECT title FROM research WHERE id = ?', (id,))
        award = DB.query_one('SELECT title FROM awards WHERE id = ?', (award_id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Bestowed award', 'research',
                     f"{award['title']} -> {research['title']}" if award and research else 'Unknown')
        return jsonify({'message': 'Award bestowed successfully'})
    except Exception:
        return jsonify({'error': 'Award already bestowed'}), 400


@admin_bp.route('/activity-log', methods=['GET'])
@authenticate_token
@is_admin
def activity_log():
    scope = request.args.get('scope', 'mine')
    start = request.args.get('startDate')
    end = request.args.get('endDate')
    atype = request.args.get('actionType')
    ttype = request.args.get('targetType')

    sql = 'SELECT * FROM activity_log'
    cond = []
    params = []

    if scope == 'mine' or (scope == 'all' and request.user['role'] != 'masteradmin'):
        cond.append('admin_id = ?')
        params.append(request.user['id'])
    if start:
        cond.append('created_at >= ?')
        params.append(f'{start} 00:00:00')
    if end:
        cond.append('created_at <= ?')
        params.append(f'{end} 23:59:59')
    if atype:
        cond.append('action ILIKE ?')
        params.append(f'%{atype}%')
    if ttype:
        cond.append('target_type = ?')
        params.append(ttype)

    if cond:
        sql += ' WHERE ' + ' AND '.join(cond)
    sql += ' ORDER BY created_at DESC LIMIT 100'
    return jsonify([dict(r) for r in DB.query(sql, tuple(params))])


@admin_bp.route('/announcements', methods=['GET', 'POST'])
@authenticate_token
@is_admin
def announcements():
    if request.method == 'POST':
        data = request.json
        title = data.get('title')
        content = data.get('content')
        aid = str(uuid.uuid4())
        DB.execute('INSERT INTO announcements (id, admin_id, title, content) VALUES (?, ?, ?, ?)',
                   (aid, request.user['id'], title, content))
        users = DB.query('SELECT id FROM users')
        for u in users:
            DB.execute('INSERT INTO inbox (id, user_id, title, content) VALUES (?, ?, ?, ?)',
                       (str(uuid.uuid4()), u['id'], f'ANNOUNCEMENT: {title}', content))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Posted announcement', 'announcement', title)
        return jsonify({'message': 'Announcement posted'})
    else:
        results = DB.query('''
            SELECT a.*, u.full_name as admin_name
            FROM announcements a
            LEFT JOIN users u ON a.admin_id = u.id
            ORDER BY a.created_at DESC
        ''')
        return jsonify([dict(r) for r in results])


@admin_bp.route('/users/batch-<action>', methods=['PUT'])
@authenticate_token
@is_admin
def batch_users(action):
    ids = request.json.get('ids', [])
    if not isinstance(ids, list):
        return jsonify({'error': 'IDs array required'}), 400
    if not ids:
        return jsonify({'message': 'No IDs provided'})

    placeholders = ','.join(['%s'] * len(ids))
    if action == 'deactivate':
        DB.execute(f"UPDATE users SET status = 'deactivated' WHERE id IN ({placeholders})", tuple(ids))
    elif action == 'reactivate':
        DB.execute(f"UPDATE users SET status = 'active' WHERE id IN ({placeholders})", tuple(ids))
    elif action == 'archive':
        DB.execute(f"UPDATE users SET status = 'archived' WHERE id IN ({placeholders})", tuple(ids))
    elif action == 'delete':
        if request.user['role'] != 'masteradmin':
            return jsonify({'error': 'Superadmin required'}), 403
        DB.execute(f'DELETE FROM users WHERE id IN ({placeholders})', tuple(ids))

    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 f'Batch {action}d {len(ids)} users', 'users')
    return jsonify({'message': f'Users {action}d'})


@admin_bp.route('/announcements/<id>', methods=['DELETE'])
@authenticate_token
@is_admin
def delete_announcement(id):
    ann = DB.query_one('SELECT admin_id, title FROM announcements WHERE id = ?', (id,))
    if request.user['role'] != 'masteradmin' and ann and ann['admin_id'] != request.user['id']:
        return jsonify({'error': 'You can only delete your own announcements'}), 403
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Deleted announcement', 'announcement', ann['title'] if ann else None)
    DB.execute('DELETE FROM announcements WHERE id = ?', (id,))
    return jsonify({'message': 'Announcement deleted'})


@admin_bp.route('/featured', methods=['GET'])
@authenticate_token
@is_admin
def get_featured_admin():
    featured = DB.query("SELECT * FROM research WHERE is_featured = 1 AND status = 'accepted'")
    return jsonify([dict(f) for f in featured])


@admin_bp.route('/research/<id>/feature', methods=['PUT'])
@authenticate_token
@is_admin
def toggle_feature(id):
    res_item = DB.query_one('SELECT is_featured, title FROM research WHERE id = ?', (id,))
    if not res_item:
        return jsonify({'error': 'Research not found'}), 404
    new_val = 0 if res_item['is_featured'] == 1 else 1
    DB.execute('UPDATE research SET is_featured = ? WHERE id = ?', (new_val, id))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Featured research' if new_val == 1 else 'Unfeatured research', 'research', res_item['title'])
    return jsonify({'is_featured': new_val})


@admin_bp.route('/deleted-research', methods=['GET'])
@authenticate_token
@is_admin
def get_deleted_research():
    results = DB.query('''
        SELECT r.*, u.full_name as author_name
        FROM research r
        LEFT JOIN users u ON r.uploaded_by = u.id
        WHERE r.deleted_at IS NOT NULL
        ORDER BY r.deleted_at DESC
    ''')
    parsed = []
    for r in results:
        item = dict(r)
        try:
            item['researchers'] = json.loads(item.get('researchers', '[]')) if item.get('researchers') else []
        except Exception:
            item['researchers'] = []
        parsed.append(item)
    return jsonify(parsed)


@admin_bp.route('/research/<id>/restore', methods=['PUT'])
@authenticate_token
@is_admin
def restore_research_admin(id):
    research = DB.query_one('SELECT title FROM research WHERE id = ?', (id,))
    if not research:
        return jsonify({'error': 'Research not found'}), 404
    DB.execute('UPDATE research SET deleted_at = NULL WHERE id = ?', (id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Restored deleted research', 'research', research['title'])
    return jsonify({'message': 'Research restored'})


@admin_bp.route('/research/<id>/awards', methods=['GET'])
@authenticate_token
def get_research_awards_admin(id):
    sql = '''
        SELECT ra.*, a.title, a.color, a.icon_name
        FROM research_awards ra
        JOIN awards a ON ra.award_id = a.id
        WHERE ra.research_id = ?
    '''
    return jsonify([dict(r) for r in DB.query(sql, (id,))])


@admin_bp.route('/research/<id>', methods=['PUT', 'GET'])
@authenticate_token
@is_admin
def handle_research_admin(id):
    if request.method == 'GET':
        item = DB.query_one('''
            SELECT r.*, u.full_name as author_name, sy.year as school_year_label
            FROM research r
            LEFT JOIN users u ON r.uploaded_by = u.id
            LEFT JOIN school_years sy ON r.school_year_id = sy.id
            WHERE r.id = ?
        ''', (id,))
        if not item:
            return jsonify({'error': 'Not found'}), 404
        res = dict(item)
        try:
            res['researchers'] = json.loads(res.get('researchers', '[]')) if res.get('researchers') else []
        except Exception:
            res['researchers'] = []
        return jsonify(res)
    else:
        data = request.json
        title = data.get('title')
        category = data.get('category')
        abstract = data.get('abstract')
        researchers = data.get('researchers')
        research = DB.query_one('SELECT * FROM research WHERE id = ?', (id,))
        if not research:
            return jsonify({'error': 'Research not found'}), 404
        DB.execute('''
            UPDATE research
            SET title = ?, category = ?, abstract = ?, researchers = ?
            WHERE id = ?
        ''', (
            title if title is not None else research['title'],
            category if category is not None else research['category'],
            abstract if abstract is not None else research['abstract'],
            json.dumps(researchers) if researchers is not None else research['researchers'],
            id,
        ))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Updated research metadata', 'research', title or research['title'])
        return jsonify({'message': 'Research updated'})


@admin_bp.route('/research/<research_id>/awards/<award_id>', methods=['DELETE'])
@authenticate_token
@is_admin
def remove_award(research_id, award_id):
    DB.execute('DELETE FROM research_awards WHERE research_id = ? AND award_id = ?', (research_id, award_id))
    DB.execute(
        'UPDATE awards SET recipients_count = GREATEST(recipients_count - 1, 0) WHERE id = ?',
        (award_id,)
    )
    research = DB.query_one('SELECT title FROM research WHERE id = ?', (research_id,))
    award = DB.query_one('SELECT title FROM awards WHERE id = ?', (award_id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Removed award', 'research',
                 f"{award['title']} from {research['title']}" if award and research else 'Unknown')
    return jsonify({'message': 'Award removed successfully'})


@admin_bp.route('/manual-register', methods=['POST'])
@authenticate_token
@is_admin
def manual_register():
    data = request.json
    full_name = data.get('full_name')
    student_number = data.get('student_number')
    course = data.get('course')
    section = data.get('section')
    year_level = data.get('year_level')
    personal_email = data.get('personal_email')
    plv_email = data.get('plv_email')
    password = data.get('password')

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    uid = str(uuid.uuid4())
    try:
        DB.execute('''
            INSERT INTO users (id, full_name, student_number, course, section, year_level, personal_email, plv_email, password_hash, status, admin_approved, email_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 1)
        ''', (uid, full_name, student_number, course, section, year_level, personal_email, plv_email, pw_hash))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Manually registered student', 'user', full_name)
        return jsonify({'message': 'Student account created'})
    except Exception as e:
        return jsonify({'error': str(e) or 'Email or Student Number already exists'}), 400


@admin_bp.route('/change-password', methods=['PUT'])
@authenticate_token
def change_password():
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    user = DB.query_one('SELECT password_hash FROM users WHERE id = ?', (request.user['id'],))
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Invalid current password'}), 401
    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    DB.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, request.user['id']))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Changed account password')
    return jsonify({'message': 'Password changed successfully'})
