# Sunrise Community Clinic
# reports.py Daily and visits reports for the clinic.
# By Ronald Chinnasamy
#
# Requirements: db.py, auth.py and appointments.py must be in the same folder.

from flask import Blueprint, jsonify, request

import db
from appointments import DAYS, read_date, time_text
from auth import role_required

reports = Blueprint("reports", __name__)


# Daily report: Report of all appointments for day, and the doctors on duty
@reports.route("/api/reports/daily")
@role_required("Administrator", "Receptionist")
def daily_report():
    day = read_date(request.args.get("date", ""))
    if day is None:
        return jsonify({"error": "Please choose a valid date"}), 400

    appointment_rows = db.get_rows(
        "SELECT a.AppointmentTime, a.Status, d.FullName AS DoctorName, p.FirstName, p.Surname "
        "FROM Appointment a "
        "JOIN User_Account d ON d.UserID = a.DoctorID "
        "JOIN Patient p ON p.PatientID = a.PatientID "
        "WHERE a.AppointmentDate = %s AND a.Status <> 'Cancelled' "
        "ORDER BY d.FullName, a.AppointmentTime",
        (day.isoformat(),),
    )
    appointments = []
    for row in appointment_rows:
        appointments.append({
            "doctor_name": row["DoctorName"],
            "time": time_text(row["AppointmentTime"]),
            "patient_name": row["FirstName"] + " " + row["Surname"],
            "status": row["Status"],
        })

    duty_rows = db.get_rows(
        "SELECT u.FullName, v.StartTime, v.EndTime "
        "FROM Doctor_Availability v JOIN User_Account u ON u.UserID = v.DoctorID "
        "WHERE v.DayOfWeek = %s AND u.Role = 'Doctor' AND u.IsActive = 1 "
        "ORDER BY u.FullName",
        (DAYS[day.weekday()],),
    )
    on_duty = []
    for row in duty_rows:
        on_duty.append({
            "doctor_name": row["FullName"],
            "start_time": time_text(row["StartTime"]),
            "end_time": time_text(row["EndTime"]),
        })

    return jsonify({"date": day.isoformat(), "day": DAYS[day.weekday()],
                    "appointments": appointments, "doctors_on_duty": on_duty})


# Visits report: Shows every visit between the selected dates
@reports.route("/api/reports/visits")
@role_required("Administrator")
def visits_report():
    start = read_date(request.args.get("from", ""))
    end = read_date(request.args.get("to", ""))
    if start is None or end is None:
        return jsonify({"error": "Please choose a start date and an end date"}), 400
    if end < start:
        return jsonify({"error": "The end date must not be before the start date"}), 400

    rows = db.get_rows(
        "SELECT v.VisitDate, v.ReasonForVisit, p.FirstName, p.Surname, u.FullName AS RecordedBy "
        "FROM Visit v "
        "JOIN Patient p ON p.PatientID = v.PatientID "
        "JOIN User_Account u ON u.UserID = v.RecordedByID "
        "WHERE v.VisitDate BETWEEN %s AND %s "
        "ORDER BY v.VisitDate, v.VisitID",
        (start.isoformat(), end.isoformat()),
    )
    visits = []
    for row in rows:
        visits.append({
            "date": str(row["VisitDate"]),
            "patient_name": row["FirstName"] + " " + row["Surname"],
            "reason": row["ReasonForVisit"],
            "recorded_by": row["RecordedBy"],
        })

    return jsonify({"from": start.isoformat(), "to": end.isoformat(),
                    "total": len(visits), "visits": visits})
