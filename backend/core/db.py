import os
import psycopg2
import psycopg2.extras
import psycopg2.pool

_pool = None

def _get_pool():
    global _pool
    if _pool is None:
        dsn = os.getenv('DATABASE_URL')
        if not dsn:
            raise RuntimeError('DATABASE_URL env var is not set')
        # Supabase connection strings use postgres:// — psycopg2 needs postgresql://
        if dsn.startswith('postgres://'):
            dsn = 'postgresql://' + dsn[len('postgres://'):]
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=dsn,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )
    return _pool


def _get_conn():
    return _get_pool().getconn()


def _put_conn(conn):
    _get_pool().putconn(conn)


def _adapt(sql: str) -> str:
    """Replace SQLite ? placeholders with PostgreSQL %s."""
    return sql.replace('?', '%s')


class DB:
    @staticmethod
    def query(sql, params=()):
        conn = _get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(_adapt(sql), params)
                return [dict(r) for r in cur.fetchall()]
        finally:
            _put_conn(conn)

    @staticmethod
    def query_one(sql, params=()):
        conn = _get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(_adapt(sql), params)
                row = cur.fetchone()
                return dict(row) if row else None
        finally:
            _put_conn(conn)

    @staticmethod
    def execute(sql, params=()):
        conn = _get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(_adapt(sql), params)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            _put_conn(conn)

    @staticmethod
    def execute_returning(sql, params=()):
        """Execute and return the first row (use with RETURNING clause)."""
        conn = _get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(_adapt(sql), params)
                row = cur.fetchone()
            conn.commit()
            return dict(row) if row else None
        except Exception:
            conn.rollback()
            raise
        finally:
            _put_conn(conn)
