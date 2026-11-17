import os
import uuid
import json
import re
import requests as http_requests
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
from core.db import DB
from core.middleware import authenticate_token, is_admin
from core.utils import log_activity
from core import storage as file_storage

research_bp = Blueprint('research', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'heic', 'heif'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_research_data(r):
    res = dict(r)
    try:
        res['researchers'] = json.loads(res.get('researchers', '[]')) if res.get('researchers') else []
    except Exception:
        res['researchers'] = []

    if res.get('awards_info'):
        awards = []
        for a in res['awards_info'].split(','):
            parts = a.split(':')
            if len(parts) == 4:
                awards.append({'id': parts[0], 'icon': parts[1], 'color': parts[2], 'title': parts[3]})
        res['awards'] = awards
    else:
        res['awards'] = []
    return res


@research_bp.route('/', methods=['GET'])
def get_research():
    status = request.args.get('status', 'accepted')
    research = DB.query('''
        SELECT r.*, u.full_name as author_name,
        (SELECT string_agg(a.id || ':' || a.icon_name || ':' || a.color || ':' || a.title, ',')
         FROM research_awards ra JOIN awards a ON ra.award_id = a.id
         WHERE ra.research_id = r.id) as awards_info
        FROM research r
        LEFT JOIN users u ON r.uploaded_by = u.id
        WHERE r.status = ? AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
    ''', (status,))
    return jsonify([parse_research_data(r) for r in research])


@research_bp.route('/featured', methods=['GET'])
def get_featured():
    research = DB.query('''
        SELECT r.*, u.full_name as author_name,
        (SELECT string_agg(a.id || ':' || a.icon_name || ':' || a.color || ':' || a.title, ',')
         FROM research_awards ra JOIN awards a ON ra.award_id = a.id
         WHERE ra.research_id = r.id) as awards_info
        FROM research r
        LEFT JOIN users u ON r.uploaded_by = u.id
        WHERE r.is_featured = 1 AND r.status = 'accepted' AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
    ''')
    return jsonify([parse_research_data(r) for r in research])


@research_bp.route('/search', methods=['GET'])
def search_research():
    q = request.args.get('q')
    year = request.args.get('year')
    category = request.args.get('category')
    author = request.args.get('author')

    sql = '''
        SELECT r.*, u.full_name as author_name,
        (SELECT string_agg(a.id || ':' || a.icon_name || ':' || a.color || ':' || a.title, ',')
         FROM research_awards ra JOIN awards a ON ra.award_id = a.id
         WHERE ra.research_id = r.id) as awards_info
        FROM research r
        LEFT JOIN users u ON r.uploaded_by = u.id
        WHERE r.status = 'accepted' AND r.deleted_at IS NULL
    '''
    params = []

    if q:
        sql += ' AND (r.title ILIKE ? OR r.abstract ILIKE ?)'
        params.extend([f'%{q}%', f'%{q}%'])
    if category and category != 'Category':
        sql += ' AND r.category = ?'
        params.append(category)
    if year and year != 'Year':
        sql += ' AND EXTRACT(YEAR FROM r.created_at)::TEXT = ?'
        params.append(year)
    if author and author != 'Author':
        sql += ' AND u.full_name ILIKE ?'
        params.append(f'%{author}%')

    results = DB.query(sql, tuple(params))
    return jsonify([parse_research_data(r) for r in results])


@research_bp.route('/<id>', methods=['GET'])
def get_detail(id):
    item = DB.query_one('''
        SELECT r.*, u.full_name as author_name, sy.year as school_year_label
        FROM research r
        LEFT JOIN users u ON r.uploaded_by = u.id
        LEFT JOIN school_years sy ON r.school_year_id = sy.id
        WHERE r.id = ?
    ''', (id,))

    if not item:
        return jsonify({'error': 'Research not found'}), 404

    awards = DB.query('''
        SELECT a.*, ra.created_at as awarded_at
        FROM research_awards ra
        JOIN awards a ON ra.award_id = a.id
        WHERE ra.research_id = ?
    ''', (id,))

    res = dict(item)
    try:
        res['researchers'] = json.loads(res.get('researchers', '[]')) if res.get('researchers') else []
    except Exception:
        res['researchers'] = []
    res['awards'] = [dict(a) for a in awards]
    return jsonify(res)


@research_bp.route('/', methods=['POST'])
@authenticate_token
def upload_research():
    title = request.form.get('title')
    category = request.form.get('category')
    abstract = request.form.get('abstract')
    researchers = request.form.get('researchers')

    if 'pdf' not in request.files:
        return jsonify({'error': 'PDF file is required'}), 400

    pdf_file = request.files['pdf']
    thumb_file = request.files.get('thumbnail')

    if not allowed_file(pdf_file.filename):
        return jsonify({'error': 'Invalid PDF file type'}), 400
    if pdf_file.mimetype != 'application/pdf':
        return jsonify({'error': 'File must be a valid PDF document'}), 400
    if thumb_file and not allowed_file(thumb_file.filename):
        return jsonify({'error': 'Invalid thumbnail file type'}), 400

    active_year = DB.query_one('SELECT id FROM school_years WHERE is_active = 1')
    research_id = str(uuid.uuid4())

    # Upload PDF to Supabase Storage
    pdf_ext = pdf_file.filename.rsplit('.', 1)[1].lower()
    pdf_storage_path = f"pdf/{uuid.uuid4()}.{pdf_ext}"
    try:
        pdf_url = file_storage.upload_file(pdf_file.read(), pdf_storage_path, 'application/pdf')
    except Exception as e:
        print(f'PDF upload error: {e}')
        return jsonify({'error': 'PDF upload failed'}), 500

    # Upload thumbnail if provided
    thumb_url = None
    if thumb_file:
        thumb_ext = thumb_file.filename.rsplit('.', 1)[1].lower()
        thumb_storage_path = f"thumbnails/{uuid.uuid4()}.{thumb_ext}"
        try:
            thumb_url = file_storage.upload_file(thumb_file.read(), thumb_storage_path, thumb_file.mimetype)
        except Exception as e:
            print(f'Thumbnail upload error: {e}')

    try:
        DB.execute('''
            INSERT INTO research (id, title, category, abstract, researchers, pdf_url, thumbnail_url, uploaded_by, school_year_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (research_id, title, category, abstract, researchers, pdf_url, thumb_url,
               request.user['id'], active_year['id'] if active_year else None))
        return jsonify({'message': 'Research submitted for review', 'id': research_id})
    except Exception as e:
        print(f'Upload DB error: {e}')
        return jsonify({'error': 'Upload failed'}), 500


@research_bp.route('/my/uploads', methods=['GET'])
@authenticate_token
def my_uploads():
    research = DB.query(
        'SELECT * FROM research WHERE uploaded_by = ? ORDER BY created_at DESC',
        (request.user['id'],)
    )
    return jsonify([parse_research_data(r) for r in research])


@research_bp.route('/<r_id>/delete', methods=['PUT'])
@authenticate_token
def delete_research(r_id):
    user_role = request.user['role']
    is_admin_user = user_role in ['admin', 'masteradmin']

    if is_admin_user:
        research = DB.query_one('SELECT title FROM research WHERE id = ?', (r_id,))
        DB.execute('UPDATE research SET deleted_at = NOW() WHERE id = ?', (r_id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Deleted research', 'research', research['title'] if research else None)
    else:
        DB.execute(
            'UPDATE research SET deleted_at = NOW() WHERE id = ? AND uploaded_by = ?',
            (r_id, request.user['id'])
        )
    return jsonify({'message': 'Research moved to trash'})


@research_bp.route('/<r_id>/restore', methods=['PUT'])
@authenticate_token
def restore_research(r_id):
    user_role = request.user['role']
    is_admin_user = user_role in ['admin', 'masteradmin']

    if is_admin_user:
        research = DB.query_one('SELECT title FROM research WHERE id = ?', (r_id,))
        DB.execute('UPDATE research SET deleted_at = NULL WHERE id = ?', (r_id,))
        log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                     'Restored research', 'research', research['title'] if research else None)
    else:
        DB.execute(
            'UPDATE research SET deleted_at = NULL WHERE id = ? AND uploaded_by = ?',
            (r_id, request.user['id'])
        )
    return jsonify({'message': 'Research restored'})


@research_bp.route('/<r_id>/permanent-delete', methods=['DELETE'])
@authenticate_token
def permanent_delete_research(r_id):
    user_role = request.user['role']
    is_admin_user = user_role in ['admin', 'masteradmin']
    if is_admin_user:
        research = DB.query_one('SELECT title FROM research WHERE id = ?', (r_id,))
    else:
        research = DB.query_one('SELECT title FROM research WHERE id = ? AND uploaded_by = ?', (r_id, request.user['id']))
    if not research:
        return jsonify({'error': 'Research not found'}), 404
    DB.execute('DELETE FROM research WHERE id = ?', (r_id,))
    log_activity(request.user['id'], request.user.get('full_name', 'Admin'),
                 'Permanently deleted research', 'research', research['title'])
    return jsonify({'message': 'Research permanently deleted'})


@research_bp.route('/my/bookmarks', methods=['GET'])
@authenticate_token
def my_bookmarks():
    bookmarks = DB.query('''
        SELECT r.*, u.full_name as author_name
        FROM research r
        JOIN bookmarks b ON r.id = b.research_id
        LEFT JOIN users u ON r.uploaded_by = u.id
        WHERE b.user_id = ?
    ''', (request.user['id'],))
    return jsonify([parse_research_data(r) for r in bookmarks])


@research_bp.route('/awards/list', methods=['GET'])
def get_awards_list():
    awards = DB.query('SELECT * FROM awards ORDER BY recipients_count DESC')
    return jsonify([dict(a) for a in awards])


@research_bp.route('/<id>/download', methods=['GET'])
def download_research(id):
    """
    Proxy endpoint that fetches the PDF from Supabase and streams it back
    with Content-Disposition: attachment so the browser triggers a real
    save-file dialog instead of opening the PDF in a new tab.
    """
    item = DB.query_one(
        'SELECT title, pdf_url FROM research WHERE id = ? AND deleted_at IS NULL',
        (id,)
    )
    if not item or not item.get('pdf_url'):
        return jsonify({'error': 'Research not found'}), 404

    pdf_url = item['pdf_url']

    # Build a safe filename from the research title
    safe_title = re.sub(r'[^\w\s-]', '', item['title'] or 'research').strip()
    safe_title = re.sub(r'\s+', '_', safe_title)[:120]  # cap length
    filename = f"{safe_title}.pdf"

    try:
        upstream = http_requests.get(pdf_url, stream=True, timeout=30)
        upstream.raise_for_status()
    except http_requests.exceptions.RequestException as e:
        print(f'[download] upstream fetch failed: {e}')
        return jsonify({'error': 'Could not retrieve file'}), 502

    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
    }
    # Forward Content-Length if Supabase provides it (avoids chunked encoding)
    if 'Content-Length' in upstream.headers:
        headers['Content-Length'] = upstream.headers['Content-Length']

    return Response(
        stream_with_context(upstream.iter_content(chunk_size=8192)),
        status=200,
        headers=headers,
    )
