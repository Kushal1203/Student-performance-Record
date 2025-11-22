from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import database

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
database.init_db()

class StudentUpdate(BaseModel):
    batch: str
    department: str
    students: List[Dict[str, Any]]

class SubjectUpdate(BaseModel):
    department: str
    semester: int
    subjects: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {"message": "Student Performance Analyzer API is running"}

@app.get("/api/students")
def get_students(batch: str = Query(...), department: str = Query(...)):
    print(f"Fetching students for batch: {batch}, dept: {department}")
    return database.get_students(batch, department)

@app.post("/api/students")
def update_students(data: StudentUpdate):
    print(f"Received update_students request for batch: {data.batch}, dept: {data.department}")
    print(f"Number of students: {len(data.students)}")
    try:
        # We'll replace all students for this batch/dept or update them individually
        # The frontend sends the full list, but for now let's just save each one
        # A better approach might be to sync, but let's stick to the simple save for now
        # However, the frontend logic sends the whole list to 'updateStudentsForBatchDept'
        
        # First, let's just iterate and save/update each student
        for student in data.students:
            database.save_student(student, data.batch, data.department)
            
        return {"status": "success", "message": f"Updated {len(data.students)} students"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}")
def delete_student(student_id: str):
    try:
        database.delete_student(student_id)
        return {"status": "success", "message": "Student deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/subjects")
def get_subjects(department: str = Query(...), semester: int = Query(...)):
    return database.get_subjects(department, semester)

@app.post("/api/subjects")
def update_subjects(data: SubjectUpdate):
    print(f"Received update_subjects request for dept: {data.department}, sem: {data.semester}")
    print(f"Subjects data: {data.subjects}")
    try:
        database.save_subjects(data.department, data.semester, data.subjects)
        return {"status": "success", "message": "Subjects updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Auth Endpoints
import hashlib

class UserCreate(BaseModel):
    username: str
    password: str
    college_email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/signup")
def signup(user: UserCreate):
    if database.get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = hash_password(user.password)
    if database.create_user(user.username, hashed_password, user.college_email):
        return {"status": "success", "message": "User created successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to create user")

@app.post("/api/login")
def login(user: UserLogin):
    db_user = database.get_user_by_username(user.username)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if hash_password(user.password) != db_user['password_hash']:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "status": "success", 
        "message": "Login successful", 
        "user": {
            "username": db_user['username'],
            "college_email": db_user['college_email']
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
