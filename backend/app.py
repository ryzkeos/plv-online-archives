import os
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

load_dotenv()

from core.db import DB
from api.auth import auth_bp
from api.research import research_bp
from api.admin import admin_bp
from api.users import users_bp
from api.inbox import inbox_bp
from api.search import search_bp
from api.bookmarks import bookmarks_bp

app = Flask(__name__, static_folder='dist', static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])
socketio = SocketIO(
    app,
    cors_allowed_origins=[FRONTEND_URL],
    async_mode='threading',
)

PORT = int(os.getenv('PORT', 5000))
connected_users = {}  # sid -> user_id


@socketio.on('auth')
def handle_auth(user_id):
    if user_id:
        connected_users[request.sid] = user_id
        DB.execute(
            "UPDATE users SET status = 'active' WHERE id = ? AND status IN ('active', 'offline')",
            (user_id,)
        )
        emit('status_change', {'userId': user_id, 'status': 'active'}, broadcast=True)


@socketio.on('disconnect')
def handle_disconnect():
    user_id = connected_users.pop(request.sid, None)
    if user_id:
        DB.execute(
            "UPDATE users SET status = 'offline' WHERE id = ? AND status = 'active'",
            (user_id,)
        )
        emit('status_change', {'userId': user_id, 'status': 'offline'}, broadcast=True)


@app.before_request
def log_request_info():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {request.method} {request.path}")


# Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(research_bp, url_prefix='/api/research')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(inbox_bp, url_prefix='/api/inbox')
app.register_blueprint(search_bp, url_prefix='/api/search')
app.register_blueprint(bookmarks_bp, url_prefix='/api/bookmarks')


@app.route('/api/config', methods=['GET'])
def get_config():
    keys = (
        'appName', 'tagline', 'logoUrl', 'maintenance_mode',
        'contact_email', 'contact_phone', 'contact_address',
        'footer_text', 'brand_primary', 'brand_secondary',
    )
    placeholders = ','.join(['%s'] * len(keys))
    settings = DB.query(f'SELECT * FROM app_settings WHERE key IN ({placeholders})', keys)
    config = {s['key']: s['value'] for s in settings}
    return jsonify(config)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'PLV Online Archive Flask Backend'})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api'):
        return jsonify({'error': 'Not found'}), 404
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(Exception)
def handle_exception(e):
    if request.path.startswith('/api'):
        print(f'ERROR: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
    return e


if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=PORT, debug=True, use_reloader=True)
