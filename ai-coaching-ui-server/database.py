import sqlite3
import hashlib
import os
from datetime import datetime
from typing import Optional, List, Dict

DB_PATH = os.path.join(os.path.dirname(__file__), "devcoach.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            current_level TEXT,
            target_role TEXT,
            main_stack TEXT,
            focus_area TEXT,
            full_name TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            duration_minutes INTEGER,
            score INTEGER,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id INTEGER,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skills_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            current_value INTEGER DEFAULT 0,
            target_value INTEGER DEFAULT 100,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, skill_name)
        )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def register_user(username: str, password: str) -> tuple[bool, str]:
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return False, "Tên đăng nhập đã tồn tại"
        
        password_hash = hash_password(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
        user_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,))
        
        init_default_skills(cursor, user_id)
        
        conn.commit()
        return True, "Đăng ký thành công"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def login_user(username: str, password: str) -> tuple[bool, Optional[int], str]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return False, None, "Tên đăng nhập không tồn tại"
    
    if not check_password(password, row["password_hash"]):
        return False, None, "Mật khẩu không đúng"
    
    return True, row["id"], "Đăng nhập thành công"

def get_user_profile(user_id: int) -> Optional[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT up.*, u.username, u.created_at as user_created
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.user_id = ?
    """, (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return dict(row)

def update_user_profile(user_id: int, profile_data: Dict) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE user_profiles 
            SET current_level = ?, target_role = ?, main_stack = ?, focus_area = ?, 
                full_name = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (
            profile_data.get("current_level", ""),
            profile_data.get("target_role", ""),
            profile_data.get("main_stack", ""),
            profile_data.get("focus_area", ""),
            profile_data.get("full_name", ""),
            profile_data.get("first_name", ""),
            profile_data.get("last_name", ""),
            user_id
        ))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        return False
    finally:
        conn.close()

def init_default_skills(cursor, user_id: int):
    default_skills = [
        ("JavaScript/TypeScript", 50, 90),
        ("React/Next.js", 45, 90),
        ("Node.js", 40, 85),
        ("Python", 35, 80),
        ("System Design", 30, 85),
        ("Databases", 45, 80),
        ("Git/CI/CD", 55, 90),
        ("Docker/K8s", 25, 75),
        ("AWS/GCP", 30, 80),
        ("Testing", 40, 85),
        ("Communication", 50, 85),
        ("Problem Solving", 60, 95),
        ("Team Collaboration", 55, 90),
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO skills_progress (user_id, skill_name, current_value, target_value)
        VALUES (?, ?, ?, ?)
    """, [(user_id, name, current, target) for name, current, target in default_skills])

def add_training_history(user_id: int, activity_type: str, title: str, 
                         description: str = "", duration: int = 0, score: int = 0,
                         metadata: str = "") -> int:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO training_history 
        (user_id, activity_type, title, description, duration_minutes, score, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, activity_type, title, description, duration, score, metadata))
    
    history_id = cursor.lastrowid
    
    update_skill_progress(cursor, user_id, activity_type, score)
    
    conn.commit()
    conn.close()
    
    return history_id

def update_skill_progress(cursor, user_id: int, activity_type: str, score: int):
    skill_mapping = {
        "code": ["JavaScript/TypeScript", "Python", "Node.js"],
        "system_design": ["System Design"],
        "frontend": ["React/Next.js", "JavaScript/TypeScript"],
        "backend": ["Node.js", "Python", "Databases"],
        "devops": ["Docker/K8s", "Git/CI/CD", "AWS/GCP"],
        "soft_skill": ["Communication", "Team Collaboration", "Problem Solving"],
        "test": ["Testing"],
    }
    
    skills = skill_mapping.get(activity_type.lower(), [])
    for skill in skills:
        cursor.execute("""
            UPDATE skills_progress 
            SET current_value = MIN(target_value, current_value + ?),
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = ? AND skill_name = ?
        """, (score, user_id, skill))

def get_training_history(user_id: int, limit: int = 50) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM training_history 
        WHERE user_id = ?
        ORDER BY completed_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_skills_progress(user_id: int) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM skills_progress 
        WHERE user_id = ?
        ORDER BY (current_value * 1.0 / target_value) ASC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def add_chat_message(user_id: int, role: str, content: str, session_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO chat_history (user_id, session_id, role, content)
        VALUES (?, ?, ?, ?)
    """, (user_id, session_id, role, content))
    
    conn.commit()
    conn.close()

def get_chat_history(user_id: int, limit: int = 50) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM chat_history 
        WHERE user_id = ?
        ORDER BY created_at ASC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_user_stats(user_id: int) -> Dict:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_activities,
            SUM(duration_minutes) as total_minutes,
            AVG(score) as avg_score,
            MAX(completed_at) as last_activity
        FROM training_history 
        WHERE user_id = ?
    """, (user_id,))
    
    stats = dict(cursor.fetchone() or {})
    
    cursor.execute("""
        SELECT activity_type, COUNT(*) as count, SUM(duration_minutes) as minutes
        FROM training_history 
        WHERE user_id = ?
        GROUP BY activity_type
    """, (user_id,))
    
    stats["by_type"] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return stats

def create_chat_session(user_id: int, title: str = "Cuộc trò chuyện mới") -> int:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO chat_sessions (user_id, title)
        VALUES (?, ?)
    """, (user_id, title))
    
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return session_id

def get_chat_sessions(user_id: int, limit: int = 20) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM chat_sessions 
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def update_chat_session(session_id: int):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE chat_sessions 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (session_id,))
    
    conn.commit()
    conn.close()

def get_session_messages(session_id: int) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM chat_history 
        WHERE session_id = ?
        ORDER BY created_at ASC
    """, (session_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def migrate_add_name_columns():
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN first_name TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN last_name TEXT")
    except:
        pass
    
    conn.commit()
    conn.close()

init_db()
migrate_add_name_columns()
