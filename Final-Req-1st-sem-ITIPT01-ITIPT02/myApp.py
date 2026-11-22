from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="NutriBantay API System")

activity_history = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_model(model_obj):
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    return model_obj.dict()

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="nutribantay_db",
            connection_timeout=10,
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
        "history": activity_history,
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
            child.name,
            child.dob,
            child.gender,
            child.age,
            child.guardian,
            child.contact,
            child.purok,
            child.weight,
            child.height,
            child.nutritionalStatus,
        )
        cursor.execute(query, values)
        conn.commit()
        child_id = cursor.lastrowid

        activity_history.insert(0, {
            "action": f"Added new child: {child.name}",
            "data": serialize_model(child),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {
            "success": True,
            "message": "Child record successfully saved to database!",
            "child_id": child_id,
        }
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
        cursor.execute(
            "UPDATE vaccine_schedules SET is_archived = 1 WHERE child_id = %s AND (is_archived = 0 OR is_archived IS NULL)",
            (child_id,)
        )
        conn.commit()

        activity_history.insert(0, {
            "action": f"Archived child and active schedules (ID: {child_id})",
            "data": {"child_id": child_id},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Child and associated schedules successfully archived"}
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
            child.name,
            child.dob,
            child.gender,
            child.age,
            child.guardian,
            child.contact,
            child.purok,
            child.weight,
            child.height,
            child.nutritionalStatus,
            child_id,
        )
        cursor.execute(query, values)
        conn.commit()

        activity_history.insert(0, {
            "action": f"Updated child record: {child.name} (ID: {child_id})",
            "data": serialize_model(child),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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

@app.post("/api/children/save-full-vaccination")
def save_full_vaccination(data: FullVaccinationPayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        update_child_query = "UPDATE children SET overall_status = %s WHERE id = %s"
        cursor.execute(update_child_query, (data.overall_status, data.child_id))

        for vac in data.vaccines:
            upsert_vaccine_query = """
                INSERT INTO child_vaccinations (child_id, vaccine_name, date_given, status) 
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE status = VALUES(status), date_given = VALUES(date_given)
            """
            cursor.execute(upsert_vaccine_query, (
                data.child_id,
                vac.vaccine_name,
                vac.date_given if vac.date_given else None,
                vac.status,
            ))

        conn.commit()

        activity_history.insert(0, {
            "action": f"Saved full vaccination for child ID: {data.child_id}",
            "data": serialize_model(data),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Overall status and vaccination records successfully saved!"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save full vaccination record: {err}")
    finally:
        cursor.close()
        conn.close()


@app.get("/api/vaccine-schedules")
def get_all_vaccine_schedules():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT vs.*, c.is_archived AS child_is_archived, c.purok
            FROM vaccine_schedules vs
            LEFT JOIN children c ON vs.child_id = c.id
            ORDER BY vs.id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": row["id"],
                "childId": row["child_id"],
                "child_id": row["child_id"],
                "childName": row["child_name"],
                "child_name": row["child_name"],
                "vaccineName": row["vaccine_name"],
                "vaccine_name": row["vaccine_name"],
                "schedDate": str(row["sched_date"]) if row["sched_date"] else "",
                "sched_date": str(row["sched_date"]) if row["sched_date"] else "",
                "schedTime": str(row["sched_time"]) if row["sched_time"] else "",
                "sched_time": str(row["sched_time"]) if row["sched_time"] else "",
                "contact": row["contact"],
                "remarks": row["remarks"],
                "status": row["status"],
                "is_archived": row.get("is_archived", 0),
                "child_is_archived": row.get("child_is_archived", 0),
                "purok": row.get("purok") or "Purok 1",
            })
        return {"success": True, "data": data}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vaccine schedules: {err}")
    finally:
        cursor.close()
        conn.close()


@app.post("/api/vaccine-schedules")
def add_vaccine_schedule(sched: VaccineScheduleModel):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, is_archived FROM children WHERE id = %s", (sched.childId,))
        child_row = cursor.fetchone()
        if child_row and child_row.get("is_archived") == 1:
            return {
                "success": False,
                "message": "Cannot set schedule: this child record is archived.",
            }

        check_query = """
            SELECT id FROM vaccine_schedules 
            WHERE child_id = %s 
              AND (is_archived = 0 OR is_archived IS NULL)
        """
        cursor.execute(check_query, (sched.childId,))
        existing = cursor.fetchone()
        if existing:
            return {
                "success": False,
                "message": "This child already has an active scheduled appointment. Please archive the old schedule first to create a new one.",
            }

        insert_query = """
            INSERT INTO vaccine_schedules 
            (child_id, child_name, vaccine_name, sched_date, sched_time, contact, remarks, status, is_archived)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0)
        """
        values = (
            sched.childId,
            sched.childName,
            sched.vaccineName,
            sched.schedDate,
            sched.schedTime,
            sched.contact,
            sched.remarks,
            sched.status,
        )
        cursor.execute(insert_query, values)
        conn.commit()
        schedule_id = cursor.lastrowid

        activity_history.insert(0, {
            "action": f"Added vaccine schedule for {sched.childName}",
            "data": serialize_model(sched),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Vaccine schedule successfully saved!", "schedule_id": schedule_id}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to insert vaccine schedule: {err}")
    finally:
        cursor.close()
        conn.close()


@app.get("/api/vaccine-schedules/upcoming")
def get_upcoming_schedules():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT vs.*, c.purok 
            FROM vaccine_schedules vs
            LEFT JOIN children c ON vs.child_id = c.id
            WHERE (vs.is_archived = 0 OR vs.is_archived IS NULL)
              AND (c.is_archived = 0 OR c.is_archived IS NULL)
            ORDER BY vs.sched_date ASC, vs.sched_time ASC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": row["id"],
                "child_id": row["child_id"],
                "child_name": row["child_name"],
                "vaccine_name": row["vaccine_name"],
                "sched_date": str(row["sched_date"]) if row["sched_date"] else "",
                "sched_time": str(row["sched_time"]) if row["sched_time"] else "",
                "contact": row["contact"],
                "remarks": row["remarks"],
                "status": row["status"],
                "purok": row.get("purok") or "Purok 1",
            })
        return {"success": True, "data": data}
    except mysql.connector.Error as err:
        return {"success": False, "message": str(err)}
    finally:
        cursor.close()
        conn.close()

@app.get("/api/schedules/archived")
def get_archived_schedules():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT vs.*, c.purok 
            FROM vaccine_schedules vs
            LEFT JOIN children c ON vs.child_id = c.id
            WHERE vs.is_archived = 1
            ORDER BY vs.sched_date DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": row["id"],
                "child_id": row["child_id"],
                "childName": row["child_name"],
                "vaccineType": row["vaccine_name"],
                "date": str(row["sched_date"]) if row["sched_date"] else "",
                "purok": row.get("purok") or "Purok 1",
            })
        return {"success": True, "data": data}
    except mysql.connector.Error as err:
        return {"success": False, "message": str(err)}
    finally:
        cursor.close()
        conn.close()

@app.put("/api/schedules/archive/{schedule_id}")
def archive_schedule(schedule_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE vaccine_schedules SET is_archived = 1 WHERE id = %s", (schedule_id,))
        conn.commit()

        activity_history.insert(0, {
            "action": f"Archived schedule ID: {schedule_id}",
            "data": {"schedule_id": schedule_id},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Schedule successfully archived"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to archive schedule: {err}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/schedules/restore/{schedule_id}")
def restore_schedule(schedule_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE vaccine_schedules SET is_archived = 0 WHERE id = %s", (schedule_id,))
        conn.commit()

        activity_history.insert(0, {
            "action": f"Restored schedule ID: {schedule_id}",
            "data": {"schedule_id": schedule_id},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Schedule restored successfully"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to restore schedule: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/vaccine-schedules/{schedule_id}")
def get_schedule_by_id(schedule_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vaccine_schedules WHERE id = %s", (schedule_id,))
        schedule = cursor.fetchone()
        if not schedule:
            return {"success": False, "message": "Schedule not found"}
        data = {
            "id": schedule["id"],
            "childId": schedule["child_id"],
            "childName": schedule["child_name"],
            "vaccineName": schedule["vaccine_name"],
            "schedDate": str(schedule["sched_date"]) if schedule["sched_date"] else "",
            "schedTime": str(schedule["sched_time"]) if schedule["sched_time"] else "",
            "sched_time": str(schedule["sched_time"]) if schedule["sched_time"] else "",
            "contact": schedule["contact"],
            "remarks": schedule["remarks"],
            "status": schedule["status"],
        }
        return {"success": True, "data": data}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schedule: {err}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/vaccine-schedules/update/{schedule_id}")
def update_vaccine_schedule(schedule_id: int, payload: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        vaccine_name = payload.get("vaccineName") or payload.get("vaccine_name")
        sched_date = payload.get("schedDate") or payload.get("sched_date")
        sched_time = payload.get("schedTime") or payload.get("sched_time")
        contact = payload.get("contact")
        remarks = payload.get("remarks")
        status = payload.get("status")

        query = """
            UPDATE vaccine_schedules 
            SET vaccine_name = COALESCE(%s, vaccine_name),
                sched_date = COALESCE(%s, sched_date),
                sched_time = COALESCE(%s, sched_time),
                contact = COALESCE(%s, contact),
                remarks = COALESCE(%s, remarks),
                status = COALESCE(%s, status)
            WHERE id = %s
        """
        cursor.execute(query, (vaccine_name, sched_date, sched_time, contact, remarks, status, schedule_id))
        conn.commit()

        activity_history.insert(0, {
            "action": f"Updated vaccine schedule ID: {schedule_id}",
            "data": payload,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        return {"success": True, "message": "Schedule updated successfully"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update schedule: {err}")
    finally:
        cursor.close()
        conn.close()