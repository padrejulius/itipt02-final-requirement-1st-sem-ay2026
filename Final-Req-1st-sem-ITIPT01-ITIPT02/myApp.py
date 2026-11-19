from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from typing import Optional, List
from datetime import datetime, timedelta

app = FastAPI(title="NutriBantay API System")

activity_history = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="nutribantay_db"
        )
        return connection
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {err}")

# Pydantic Models
class ChildModel(BaseModel):
    name: str
    dob: str
    gender: str
    age: int
    guardian: str
    contact: str
    purok: str
    weight: float
    height: float
    nutritionalStatus: str

class VaccineScheduleModel(BaseModel):
    childId: int
    childName: str
    vaccineName: str
    schedDate: str
    schedTime: str
    contact: str
    remarks: Optional[str] = ""
    status: str

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "system": "NutriBantay FastAPI Backend Connection Active",
        "total_queries": len(activity_history),
        "history": activity_history
    }

    
# ==========================================
# CHILDREN ENDPOINTS
# ==========================================

@app.post("/api/children")
def add_child(child: ChildModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO children 
            (name, dob, gender, age, guardian, contact, purok, weight, height, nutritional_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            child.name, child.dob, child.gender, child.age, child.guardian,
            child.contact, child.purok, child.weight, child.height, child.nutritionalStatus
        )
        cursor.execute(query, values)
        conn.commit()
        child_id = cursor.lastrowid

        activity_history.insert(0, {
            "action": f"Added new child: {child.name}",
            "data": child.dict(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        return {"success": True, "message": "Child record successfully saved to database!", "child_id": child_id}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to insert child record: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/children")
def get_children():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM children WHERE is_archived = 0 OR is_archived IS NULL ORDER BY id DESC")
        records = cursor.fetchall()
        return {"success": True, "data": records}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch children records: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/children/archived")
def get_archived_children():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM children WHERE is_archived = 1 ORDER BY id DESC")
        result = cursor.fetchall()
        return {"success": True, "data": result}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch archived children: {err}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/children/{child_id}/archive")
def archive_child(child_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE children SET is_archived = 1 WHERE id = %s", (child_id,))
        conn.commit()

        activity_history.insert(0, {
            "action": f"Archived child (ID: {child_id})",
            "data": {"child_id": child_id},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        return {"success": True, "message": "Child successfully archived"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to archive child: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/children/fully-immunized")
def get_fully_immunized_children():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM children WHERE overall_status = 'Fully Immunized' ORDER BY id DESC"
        cursor.execute(query)
        records = cursor.fetchall()
        return {"success": True, "data": records}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fully immunized children: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/children/{child_id}")
def get_child_by_id(child_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM children WHERE id = %s", (child_id,))
        record = cursor.fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Child not found")
        return {"success": True, "data": record}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch child: {err}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/children/{child_id}")
def update_child(child_id: int, child: ChildModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            UPDATE children 
            SET name = %s, dob = %s, gender = %s, age = %s, guardian = %s, 
                contact = %s, purok = %s, weight = %s, height = %s, nutritional_status = %s
            WHERE id = %s
        """
        values = (
            child.name, child.dob, child.gender, child.age, child.guardian,
            child.contact, child.purok, child.weight, child.height, child.nutritionalStatus, child_id
        )
        cursor.execute(query, values)
        conn.commit()

        activity_history.insert(0, {
            "action": f"Updated child record: {child.name} (ID: {child_id})",
            "data": child.dict(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        return {"success": True, "message": "Child record successfully updated!"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update child record: {err}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/children/restore/{child_id}")
def restore_child(child_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE children SET is_archived = 0 WHERE id = %s", (child_id,))
        conn.commit()

        activity_history.insert(0, {
            "action": f"Restored child (ID: {child_id})",
            "data": {"child_id": child_id},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        return {"success": True, "message": "Child successfully restored"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to restore child: {err}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# VACCINATION & VACCINE SCHEDULES ENDPOINTS
# ==========================================

class VaccineItem(BaseModel):
    vaccine_name: str
    status: str
    date_given: Optional[str] = None

class FullVaccinationPayload(BaseModel):
    child_id: int
    overall_status: str
    vaccines: List[VaccineItem]

@app.get("/api/vaccinations/{child_id}")
def get_child_vaccinations(child_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM child_vaccinations WHERE child_id = %s", (child_id,))
        records = cursor.fetchall()
        return {"success": True, "data": records}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vaccinations: {err}")
    finally:
        cursor.close()
        conn.close()

