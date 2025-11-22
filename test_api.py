import requests
import json
import time

BASE_URL = "http://127.0.0.1:3001/api"

def test_api():
    print("Testing API...")
    
    # 1. Test Root
    try:
        response = requests.get("http://127.0.0.1:3001/")
        print(f"Root: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Root failed: {e}")
        return

    # 2. Test Save Subjects
    subjects_data = {
        "department": "cse",
        "semester": 1,
        "subjects": [
            {"name": "Maths", "code": "M101", "category": "Core"},
            {"name": "Physics", "code": "P101", "category": "Core"}
        ]
    }
    response = requests.post(f"{BASE_URL}/subjects", json=subjects_data)
    print(f"Save Subjects: {response.status_code} - {response.json()}")
    
    # 3. Test Get Subjects
    response = requests.get(f"{BASE_URL}/subjects?department=cse&semester=1")
    print(f"Get Subjects: {response.status_code} - {response.json()}")
    
    # 4. Test Save Students
    student_data = {
        "batch": "2023-2027",
        "department": "Computer Science and Engineering",
        "students": [
            {
                "id": "TEST001",
                "name": "Test Student",
                "enrollmentNo": "TEST001",
                "marks": [],
                "totalMarks": 0,
                "grade": "F",
                "academicHistory": {},
                "sports": [],
                "extracurricular": [],
                "accounts": {"collegeFeeDue": False, "isHostelResident": False, "hostelFeeDue": False},
                "library": []
            }
        ]
    }
    response = requests.post(f"{BASE_URL}/students", json=student_data)
    print(f"Save Students: {response.status_code} - {response.json()}")
    
    # 5. Test Get Students
    response = requests.get(f"{BASE_URL}/students?batch=2023-2027&department=Computer Science and Engineering")
    print(f"Get Students: {response.status_code} - {len(response.json())} students found")
    
    # 6. Test Delete Student
    response = requests.delete(f"{BASE_URL}/students/TEST001")
    print(f"Delete Student: {response.status_code} - {response.json()}")
    
    print("API Testing Completed.")

if __name__ == "__main__":
    # Wait a bit for server to start if running immediately after
    time.sleep(2)
    test_api()
