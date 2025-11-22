import sqlite3
import json
from typing import List, Dict, Any, Optional

DB_NAME = "student_performance.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create students table
    # We store complex objects like marks, academicHistory etc as JSON strings
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enrollmentNo TEXT NOT NULL,
        batch TEXT NOT NULL,
        department TEXT NOT NULL,
        data TEXT NOT NULL -- Stores the full JSON object
    )
    ''')
    
    # Create subjects table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department TEXT NOT NULL,
        semester INTEGER NOT NULL,
        data TEXT NOT NULL -- Stores the list of subjects as JSON
    )
    ''')

    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        college_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

def save_student(student_data: Dict[str, Any], batch: str, department: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    student_id = student_data.get('id')
    
    # Check if student exists
    cursor.execute('SELECT id FROM students WHERE id = ?', (student_id,))
    exists = cursor.fetchone()
    
    if exists:
        cursor.execute('''
        UPDATE students 
        SET name = ?, enrollmentNo = ?, batch = ?, department = ?, data = ?
        WHERE id = ?
        ''', (student_data['name'], student_data['enrollmentNo'], batch, department, json.dumps(student_data), student_id))
    else:
        cursor.execute('''
        INSERT INTO students (id, name, enrollmentNo, batch, department, data)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (student_id, student_data['name'], student_data['enrollmentNo'], batch, department, json.dumps(student_data)))
    
    conn.commit()
    conn.close()

def get_students(batch: str, department: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT data FROM students WHERE batch = ? AND department = ?', (batch, department))
    rows = cursor.fetchall()
    
    students = [json.loads(row['data']) for row in rows]
    conn.close()
    return students

def delete_student(student_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM students WHERE id = ?', (student_id,))
    conn.commit()
    conn.close()

def save_subjects(department: str, semester: int, subjects_data: List[Dict[str, Any]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if subjects exist for this dept/sem
    cursor.execute('SELECT id FROM subjects WHERE department = ? AND semester = ?', (department, semester))
    exists = cursor.fetchone()
    
    if exists:
        cursor.execute('''
        UPDATE subjects 
        SET data = ?
        WHERE department = ? AND semester = ?
        ''', (json.dumps(subjects_data), department, semester))
    else:
        cursor.execute('''
        INSERT INTO subjects (department, semester, data)
        VALUES (?, ?, ?)
        ''', (department, semester, json.dumps(subjects_data)))
        
    conn.commit()
    conn.close()

def get_subjects(department: str, semester: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT data FROM subjects WHERE department = ? AND semester = ?', (department, semester))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return json.loads(row['data'])
    return []

def create_user(username, password_hash, college_email=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO users (username, password_hash, college_email)
        VALUES (?, ?, ?)
        ''', (username, password_hash, college_email))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None
