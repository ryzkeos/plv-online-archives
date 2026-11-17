import json
from flask import Blueprint, jsonify, request
from core.db import DB

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
def search_all():
    q = request.args.get('q')
    year = request.args.get('year')
    category = request.args.get('category')
    author = request.args.get('author')
    
    sql = '''
        SELECT r.*, u.full_name as author_name 
        FROM research r 
        LEFT JOIN users u ON r.uploaded_by = u.id 
        WHERE r.status = 'accepted' AND r.deleted_at IS NULL
    '''
    params = []

    if q:
        sql += " AND (r.title LIKE ? OR r.abstract LIKE ?)"
        params.extend([f'%{q}%', f'%{q}%'])
    if category and category != 'Category':
        sql += " AND r.category = ?"
        params.append(category)
    if year and year != 'Year':
        sql += " AND r.created_at LIKE ?"
        params.append(f'{year}%')
    if author and author != 'Author':
        sql += " AND u.full_name LIKE ?"
        params.append(f'%{author}%')

    results = DB.query(sql, tuple(params))
    
    parsed = []
    for r in results:
        item = dict(r)
        try:
            item['researchers'] = json.loads(item.get('researchers', '[]'))
        except:
            item['researchers'] = []
        parsed.append(item)
        
    return jsonify(parsed)
