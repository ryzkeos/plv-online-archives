import jwt
import os
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv('JWT_SECRET', 'plv-secret-key-change-this')


def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('plv_token')

        if token:
            print(f'Auth: Token Present for {request.path}')
        else:
            print(f'Auth: No Token for {request.path}')

        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403

        return f(*args, **kwargs)
    return decorated


def is_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user['role'] not in ('admin', 'masteradmin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def is_superadmin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user['role'] != 'masteradmin':
            return jsonify({'error': 'Superadmin access required'}), 403
        return f(*args, **kwargs)
    return decorated
