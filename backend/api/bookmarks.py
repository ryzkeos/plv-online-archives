import uuid
from flask import Blueprint, jsonify, request
from core.db import DB
from core.middleware import authenticate_token

bookmarks_bp = Blueprint('bookmarks', __name__)

@bookmarks_bp.route('/<research_id>', methods=['POST'])
@authenticate_token
def toggle_bookmark(research_id):
    user_id = getattr(request, 'user')['id']
    existing = DB.query_one('SELECT id FROM bookmarks WHERE user_id = ? AND research_id = ?', (user_id, research_id))
    
    if existing:
        DB.execute('DELETE FROM bookmarks WHERE id = ?', (existing['id'],))
        return jsonify({'bookmarked': False})
    else:
        bid = str(uuid.uuid4())
        DB.execute('INSERT INTO bookmarks (id, user_id, research_id) VALUES (?, ?, ?)', (bid, user_id, research_id))
        return jsonify({'bookmarked': True})
