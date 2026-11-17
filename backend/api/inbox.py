from flask import Blueprint, jsonify, request
from core.db import DB
from core.middleware import authenticate_token

inbox_bp = Blueprint('inbox', __name__)

@inbox_bp.route('/', methods=['GET'], strict_slashes=False)
@authenticate_token
def get_inbox():
    user_id = request.user['id']
    messages = DB.query('SELECT * FROM inbox WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    return jsonify([dict(m) for m in messages])

@inbox_bp.route('/<id>/read', methods=['PUT'])
@authenticate_token
def mark_read(id):
    user_id = request.user['id']
    DB.execute('UPDATE inbox SET read = 1 WHERE id = ? AND user_id = ?', (id, user_id))
    return jsonify({'message': 'Message marked as read'})

@inbox_bp.route('/unread-count', methods=['GET'])
@authenticate_token
def unread_count():
    user_id = request.user['id']
    result = DB.query_one('SELECT COUNT(*) as count FROM inbox WHERE user_id = ? AND read = 0', (user_id,))
    return jsonify({'count': result['count']})
