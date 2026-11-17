import uuid
import re
import jwt
import bcrypt
import os
import random
import requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response
from core.db import DB


def _valid_password(p: str) -> bool:
    return len(p) >= 8 and bool(re.search(r'[A-Z]', p)) and bool(re.search(r'[0-9]', p))

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('JWT_SECRET', 'plv-secret-key-change-this')


# ── OTP Email Helper (Brevo API) ──────────────────────────────────────────────

def send_otp_email(to_email: str, otp: str, purpose: str = "verification"):
    """
    Sends an OTP email via Brevo Transactional Email API (HTTPS — works on Render free tier).
    Falls back to printing to console if BREVO_API_KEY is not set in .env.
    """
    api_key    = os.getenv('BREVO_API_KEY')
    from_email = os.getenv('BREVO_FROM_EMAIL', 'noreply@yourdomain.com')
    from_name  = os.getenv('BREVO_FROM_NAME', 'PLV Online Archives')

    if not api_key:
        print(f'[OTP] {purpose} OTP for {to_email}: {otp}')
        return

    subject_map = {
        'email verification': 'Verify Your PLV Online Archives Account',
        'password reset':     'Reset Your PLV Online Archives Password',
    }
    subject = subject_map.get(purpose, 'Your PLV Online Archives OTP')

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#1d4ed8;margin-bottom:4px;">PLV Online Archives</h2>
      <p style="color:#6b7280;margin-top:0;">{'Email Verification' if purpose == 'email verification' else 'Password Reset'}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <p style="color:#374151;">Use the OTP below to complete your <strong>{purpose}</strong>:</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:10px;color:#1d4ed8;background:#eff6ff;padding:16px 28px;border-radius:8px;">
          {otp}
        </span>
      </div>
      <p style="color:#6b7280;font-size:14px;">
        This OTP expires in <strong>10 minutes</strong>.<br>
        If you did not request this, please ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">PLV Online Archives &mdash; Do not reply to this email.</p>
    </div>
    """

    try:
        response = requests.post(
            'https://api.brevo.com/v3/smtp/email',
            headers={
                'api-key':      api_key,
                'Content-Type': 'application/json',
            },
            json={
                'sender':      {'name': from_name, 'email': from_email},
                'to':          [{'email': to_email}],
                'subject':     subject,
                'htmlContent': html_body,
            },
            timeout=10
        )
        if response.status_code in (200, 201):
            print(f'[OTP] Email sent to {to_email} ({purpose})')
        else:
            print(f'[OTP] Brevo error {response.status_code}: {response.text}')
            print(f'[OTP] Fallback OTP for {to_email}: {otp}')
    except Exception as e:
        print(f'[OTP] Failed to send email to {to_email}: {e}')
        print(f'[OTP] Fallback OTP for {to_email}: {otp}')


def generate_otp(user_id: str) -> str:
    """Generates a 6-digit OTP, stores it in DB, and returns the code."""
    otp        = str(random.randint(100000, 999999))
    otp_id     = str(uuid.uuid4())
    expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
    DB.execute(
        'INSERT INTO otp_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        (otp_id, user_id, otp, expires_at)
    )
    return otp


# ── Routes ────────────────────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    data             = request.get_json(force=True, silent=True) or {}
    full_name        = (data.get('full_name') or '').strip()
    student_number   = (data.get('student_number') or '').strip()
    course           = (data.get('course') or '').strip()
    section          = (data.get('section') or '').strip()
    year_level       = (data.get('year_level') or '').strip()
    personal_email   = (data.get('personal_email') or '').strip().lower()
    plv_email        = (data.get('plv_email') or '').strip().lower()
    password         = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    required = [
        ('full_name', full_name), ('student_number', student_number),
        ('course', course), ('section', section), ('year_level', year_level),
        ('personal_email', personal_email), ('plv_email', plv_email),
        ('password', password), ('confirm_password', confirm_password),
    ]
    for field, val in required:
        if not val:
            return jsonify({'error': 'This field is required', 'field': field}), 400

    if not personal_email.endswith('@gmail.com'):
        return jsonify({'error': 'Must be a @gmail.com address', 'field': 'personal_email'}), 400

    if not plv_email.endswith('@plv.edu.ph'):
        return jsonify({'error': 'Must be a @plv.edu.ph address', 'field': 'plv_email'}), 400

    if not _valid_password(password):
        return jsonify({'error': 'Min 8 chars, 1 uppercase, 1 number', 'field': 'password'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match', 'field': 'confirm_password'}), 400

    # DB work isolated — email sending is outside so it never causes a 500
    try:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = str(uuid.uuid4())

        DB.execute('''
            INSERT INTO users (id, full_name, student_number, course, section, year_level, personal_email, plv_email, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, full_name, student_number, course, section, year_level, personal_email, plv_email, hashed_password))

        otp = generate_otp(user_id)
    except Exception as err:
        if 'unique' in str(err).lower():
            return jsonify({'error': 'Account already exists with this student number or email'}), 400
        return jsonify({'error': 'Registration failed'}), 500

    # Send OTP outside the DB try/except — email failure never blocks registration
    send_otp_email(personal_email, otp, purpose='email verification')

    return jsonify({'message': 'Registration successful. Verify OTP sent to your email.', 'email': personal_email})


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data  = request.get_json()
    email = data.get('email')
    otp   = data.get('otp')

    user = DB.query_one('SELECT id FROM users WHERE personal_email = ?', (email,))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    now       = datetime.now().isoformat()
    token_rec = DB.query_one(
        'SELECT id FROM otp_tokens WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > ?',
        (user['id'], otp, now)
    )

    if not token_rec:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    DB.execute('UPDATE otp_tokens SET used = 1 WHERE id = ?', (token_rec['id'],))
    DB.execute('UPDATE users SET email_verified = 1 WHERE id = ?', (user['id'],))
    return jsonify({'message': 'Email verified successfully. Please wait for admin approval.'})


@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    user = DB.query_one('SELECT * FROM users WHERE personal_email = ? OR plv_email = ?', (email, email))
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user['email_verified']:
        return jsonify({'error': 'Please verify your email first', 'code': 'UNVERIFIED', 'email': user['personal_email']}), 403

    if user['role'] not in ('admin', 'masteradmin') and not user['admin_approved']:
        return jsonify({'error': 'Your account is pending admin approval'}), 403

    token = jwt.encode({
        'id':    user['id'],
        'role':  user['role'],
        'email': user['personal_email'],
        'exp':   datetime.utcnow() + timedelta(days=7),
    }, JWT_SECRET, algorithm='HS256')

    response = make_response(jsonify({'user': {k: v for k, v in user.items() if k != 'password_hash'}}))
    response.set_cookie('plv_token', token, httponly=True, secure=True,
                        max_age=7 * 24 * 60 * 60, samesite='None')
    return response


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    data  = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = DB.query_one(
        'SELECT id FROM users WHERE personal_email = ? OR plv_email = ?',
        (email, email)
    )
    if not user:
        return jsonify({'error': 'No account found with this email'}), 404

    otp = generate_otp(user['id'])
    send_otp_email(email, otp, purpose='email verification')
    return jsonify({'message': 'OTP resent successfully'})


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.get_json()
    email = data.get('email')\

    user = DB.query_one('SELECT id FROM users WHERE personal_email = ? OR plv_email = ?', (email, email))
    if not user:
        return jsonify({'error': 'User with this email not found'}), 404

    otp = generate_otp(user['id'])
    send_otp_email(email, otp, purpose='password reset')

    return jsonify({'message': 'OTP sent to your email'})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data             = request.get_json()
    email            = data.get('email')
    otp              = data.get('otp')
    password         = data.get('password')
    confirm_password = data.get('confirm_password')

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    if not _valid_password(password):
        return jsonify({'error': 'Min 8 chars, 1 uppercase, 1 number'}), 400

    user = DB.query_one('SELECT id FROM users WHERE personal_email = ? OR plv_email = ?', (email, email))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    now       = datetime.now().isoformat()
    token_rec = DB.query_one(
        'SELECT id FROM otp_tokens WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > ?',
        (user['id'], otp, now)
    )
    if not token_rec:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    DB.execute('UPDATE users SET password_hash = ? WHERE id = ?', (hashed_password, user['id']))
    DB.execute('UPDATE otp_tokens SET used = 1 WHERE id = ?', (token_rec['id'],))
    return jsonify({'message': 'Password reset successful'})


@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'message': 'Logged out'}))
    response.set_cookie('plv_token', '', expires=0, httponly=True, secure=True, samesite='None')
    return response


@auth_bp.route('/selectibles', methods=['GET'])
def get_selectibles():
    rows    = DB.query('SELECT * FROM selectibles')
    grouped = {}
    for row in rows:
        cat = row['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append({'id': row['id'], 'value': row['value']})
    return jsonify(grouped)


@auth_bp.route('/me', methods=['GET'])
def me():
    token = request.cookies.get('plv_token')
    if not token:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = DB.query_one('''
            SELECT id, full_name, student_number, course, section, year_level,
                   personal_email, plv_email, role, status, admin_approved,
                   email_verified, avatar_url,
                   gender, birthdate, address, phone
            FROM users WHERE id = ?
        ''', (decoded['id'],))
        if not user:
            return jsonify({'error': 'User not found'}), 401
        return jsonify({'user': user})
    except Exception:
        return jsonify({'error': 'Invalid session'}), 401
