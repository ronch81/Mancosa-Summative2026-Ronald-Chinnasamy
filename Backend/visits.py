# Sunrise Community Clinic
# visits.py - Records for visits and shows visit history
# By Ronald Chinnasamy
#
# Requirements: db.py and auth.py must be in the same folder.

from datetime import date

from flask import Blueprint, jsonify, request, session

import db
from auth import role_required

visits = Blueprint("visits", __name__)


# Record a visit
@visits.route("/api/visits", methods=["POST"])
@role_required("Doctor", "Nurse")
def record_visit():
    data = request.get_json(silent=True) or {}

    try:
        patient_id = int(data.get("patient_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Please choose a patient"}), 400

    reason = str(data.get("reason_for_visit", "")).strip()
    notes = str(data.get("notes", "")).strip()

    if reason == "":
        return jsonify({"error": "Why did the patient visit today?"}), 400
    if len(reason) > 200:
        return jsonify({"error": "The reason for the visit must be 200 characters or fewer"}), 400

    if db.get_one("SELECT PatientID FROM Patient WHERE PatientID = %s", (patient_id,)) is None:
        return jsonify({"error": "Patient not found"}), 404

    new_id = db.run_change(
        "INSERT INTO Visit (PatientID, VisitDate, ReasonForVisit, Notes, RecordedByID) "
        "VALUES (%s, %s, %s, %s, %s)",
        (patient_id, date.today().isoformat(), reason, notes, session["user_id"]),
    )
    return jsonify({"message": "Visit saved", "visit_id": new_id}), 201


# Show previous visits
@visits.route("/api/visits/<int:patient_id>")
@role_required("Doctor", "Nurse")
def visit_history(patient_id):
    if db.get_one("SELECT PatientID FROM Patient WHERE PatientID = %s", (patient_id,)) is None:
        return jsonify({"error": "Patient not found"}), 404

    rows = db.get_rows(
        "SELECT v.VisitID, v.VisitDate, v.ReasonForVisit, v.Notes, u.FullName AS RecordedBy "
        "FROM Visit v JOIN User_Account u ON u.UserID = v.RecordedByID "
        "WHERE v.PatientID = %s ORDER BY v.VisitDate DESC, v.VisitID DESC",
        (patient_id,),
    )

    result = []
    for row in rows:
        result.append({
            "visit_id": row["VisitID"],
            "date": str(row["VisitDate"]),
            "reason": row["ReasonForVisit"],
            "notes": row["Notes"] or "",
            "recorded_by": row["RecordedBy"],
        })
    return jsonify(result)
