import bcrypt
import json
from flask import Blueprint, request, jsonify
from core.db import DB
from core.middleware import authenticate_token, is_admin, is_superadmin
from core.utils import log_activity

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'], strict_slashes=False)
@authenticate_token
@is_admin
def get_users():
    search = request.args.get('search')
    status = request.args.get('status')
    
    sql = 'SELECT id, full_name, student_number, course, section, year_level, role, status, admin_approved, avatar_url, created_at FROM users'
    params = []
    cond = []
    
    if search:
        cond.append('(full_name LIKE ? OR student_number LIKE ?)')
        params.extend([f'%{search}%', f'%{search}%'])
    
    if status and status.lower() not in ['all', 'all status']:
        cond.append('LOWER(status) = ?')
        params.append(status.lower())
    else:
        cond.append("LOWER(status) != 'pending'")
        
    if cond:
        sql += " WHERE " + " AND ".join(cond)
        
    users = DB.query(sql, tuple(params))
    return jsonify([dict(u) for u in users])

@users_bp.route('/<user_id>', methods=['GET'])
@authenticate_token
@is_admin
def get_user_detail(user_id):
    user = DB.query_one('''
        SELECT id, full_name, student_number, course, section, year_level, 
               personal_email, plv_email, role, status, admin_approved, 
               avatar_url, gender, birthdate, address, phone, created_at 
        FROM users WHERE id = ?
    ''', (user_id,))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    research = DB.query('SELECT * FROM research WHERE uploaded_by = ? AND deleted_at IS NULL ORDER BY created_at DESC', (user_id,))
    
    res = dict(user)
    res['researchCount'] = len(research)
    res['research'] = []
    for r in research:
        item = dict(r)
        try:
            item['researchers'] = json.loads(item.get('researchers', '[]'))
        except:
            item['researchers'] = []
        res['research'].append(item)
        
    return jsonify(res)

@users_bp.route('/<user_id>', methods=['PUT'])
@authenticate_token
def update_user(user_id):
    data = request.json
    full_name = data.get('full_name')
    course = data.get('course')
    section = data.get('section')
    year_level = data.get('year_level')
    plv_email = data.get('plv_email')
    personal_email = data.get('personal_email')
    student_number = data.get('student_number')
    password = data.get('password')
    current_password = data.get('currentPassword')
    avatar_url = data.get('avatar_url')
    gender = data.get('gender')
    birthdate = data.get('birthdate')
    address = data.get('address')
    phone = data.get('phone')
    
    is_self = request.user['id'] == user_id
    user_role = request.user['role']
    is_adm = user_role in ['admin', 'masteradmin']
    
    if not is_self and not is_adm:
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        user = DB.query_one('SELECT * FROM users WHERE id = ?', (user_id,))
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if password:
            if is_self:
                if not current_password:
                    return jsonify({'error': 'Current password required'}), 400
                if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    return jsonify({'error': 'Invalid current password'}), 401
            
            # Admin or verified self can change password
            new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            DB.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, user_id))
            
        DB.execute('''
            UPDATE users 
            SET full_name = ?, course = ?, section = ?, year_level = ?,
                plv_email = ?, personal_email = ?, student_number = ?,
                avatar_url = ?, gender = ?, birthdate = ?, address = ?, phone = ?
            WHERE id = ?
        ''', (
            full_name if full_name is not None else user['full_name'], 
            course if course is not None else user['course'], 
            section if section is not None else user['section'], 
            year_level if year_level is not None else user['year_level'],
            plv_email if plv_email is not None else user['plv_email'],
            personal_email if personal_email is not None else user['personal_email'],
            student_number if student_number is not None else user['student_number'],
            avatar_url if avatar_url is not None else user['avatar_url'],
            gender if gender is not None else user.get('gender'),
            birthdate if birthdate is not None else user.get('birthdate'),
            address if address is not None else user.get('address'),
            phone if phone is not None else user.get('phone'),
            user_id
        ))
        
        if is_adm and not is_self:
            log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Updated user profile', 'user', full_name or user['full_name'])
            
        return jsonify({'message': 'User updated'})
    except Exception as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({'error': 'Email already in use'}), 400
        print(f"User update error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/<user_id>/status', methods=['PATCH'])
@authenticate_token
@is_admin
def update_user_status(user_id):
    status = request.json.get('status')
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (user_id,))
    DB.execute('UPDATE users SET status = ? WHERE id = ?', (status, user_id))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), f"Updated user status to {status}", 'user', user['full_name'] if user else None)
    return jsonify({'message': 'User status updated'})

@users_bp.route('/<user_id>/archive', methods=['PUT'])
@authenticate_token
@is_admin
def archive_user(user_id):
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (user_id,))
    DB.execute("UPDATE users SET status = 'archived' WHERE id = ?", (user_id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), "Archived user", 'user', user['full_name'] if user else None)
    return jsonify({'message': 'User archived'})

@users_bp.route('/<user_id>/deactivate', methods=['PUT'])
@authenticate_token
@is_admin
def deactivate_user(user_id):
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (user_id,))
    DB.execute("UPDATE users SET status = 'deactivated' WHERE id = ?", (user_id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), "Deactivated user", 'user', user['full_name'] if user else None)
    return jsonify({'message': 'User deactivated'})

@users_bp.route('/<user_id>', methods=['DELETE'])
@authenticate_token
@is_superadmin
def delete_user(user_id):
    user = DB.query_one('SELECT full_name FROM users WHERE id = ?', (user_id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'), 'Deleted user account', 'user', user['full_name'] if user else None)
    DB.execute('DELETE FROM users WHERE id = ?', (user_id,))
    return jsonify({'message': 'User deleted'})
