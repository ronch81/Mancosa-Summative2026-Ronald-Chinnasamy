# Sunrise Community Clinic
# appointments.py - doctors, doctor availability and appointments
# By Ronald Chinnasamy
#
# Requirements: db.py and auth.py must be in the same folder.


from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request
from mysql.connector import IntegrityError

import db
from auth import login_required, role_required

appointments = Blueprint("appointments", __name__)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Appointments are booked in 30 minute slots
SLOT_MINUTES = 30


# Utility functions for working with dates and times

def time_text(value):
    # reformat a time or timedelta as "HH:MM"
    if isinstance(value, timedelta):
        minutes = int(value.total_seconds() // 60)
        return "%02d:%02d" % (minutes // 60, minutes % 60)
    return str(value)[:5]


def read_time(text):
    # Checks time text validty
    try:
        return datetime.strptime(str(text).strip(), "%H:%M").strftime("%H:%M")
    except ValueError:
        return None


def read_date(text):
    # Checks date text validity
    try:
        return datetime.strptime(str(text).strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def read_number(value):
    # changes a value into an integer
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def to_minutes(hhmm):
    # Coverts time to minute of the day
    return int(hhmm[:2]) * 60 + int(hhmm[3:5])


def availability_rows(doctor_id):
    # gets the availibility of a doctor
    rows = db.get_rows(
        "SELECT DayOfWeek, StartTime, EndTime FROM Doctor_Availability WHERE DoctorID = %s",
        (doctor_id,),
    )
    result = []
    for row in rows:
        result.append({
            "day_of_week": row["DayOfWeek"],
            "start_time": time_text(row["StartTime"]),
            "end_time": time_text(row["EndTime"]),
        })
    result.sort(key=lambda r: DAYS.index(r["day_of_week"]))
    return result


def find_doctor(doctor_id):
    # gets the doctor details if the doctor exists and is active
    return db.get_one(
        "SELECT UserID, FullName FROM User_Account "
        "WHERE UserID = %s AND Role = 'Doctor' AND IsActive = 1",
        (doctor_id,),
    )


def slots_for(doctor_id, day):
    # works out a list of the time slots a doctor works on a day of the week, based on their availability
    hours = db.get_one(
        "SELECT StartTime, EndTime FROM Doctor_Availability WHERE DoctorID = %s AND DayOfWeek = %s",
        (doctor_id, DAYS[day.weekday()]),
    )
    if hours is None:
        return []

    slots = []
    minutes = to_minutes(time_text(hours["StartTime"]))
    end = to_minutes(time_text(hours["EndTime"]))
    while minutes < end:
        slots.append("%02d:%02d" % (minutes // 60, minutes % 60))
        minutes += SLOT_MINUTES
    return slots


def check_booking(doctor_id, date_text, time_value, appointment_id=0):
    # validtes a booking for a doctor on a date and time, and checks if the doctor is available and not already booked
    day = read_date(date_text)
    time = read_time(time_value)
    if day is None or time is None:
        return None, None, ("Please enter a valid date and time", 400)
    if day < date.today():
        return None, None, ("You cannot book an appointment in the past", 400)
    if find_doctor(doctor_id) is None:
        return None, None, ("Doctor not found", 404)
    if time not in slots_for(doctor_id, day):
        return None, None, ("The Doctor is not available at this time", 400)

    clash = db.get_one(
        "SELECT AppointmentID FROM Appointment "
        "WHERE DoctorID = %s AND AppointmentDate = %s AND AppointmentTime = %s "
        "AND Status <> 'Cancelled' AND AppointmentID <> %s",
        (doctor_id, day.isoformat(), time, appointment_id),
    )
    if clash is not None:
        return None, None, ("This time has already been booked", 409)

    return day.isoformat(), time, None



# Logic for Doctor Availability and Appointments

# List the doctors, for the booking screen and the availability screen
@appointments.route("/api/doctors")
@login_required
def list_doctors():
    rows = db.get_rows(
        "SELECT UserID, FullName FROM User_Account "
        "WHERE Role = 'Doctor' AND IsActive = 1 ORDER BY FullName"
    )
    return jsonify(rows)


# Show the days and hours a doctor works
@appointments.route("/api/availability/<int:doctor_id>")
@login_required
def view_availability(doctor_id):
    if find_doctor(doctor_id) is None:
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify(availability_rows(doctor_id))


# Set the hours a doctor works on one day of the week
@appointments.route("/api/availability/<int:doctor_id>", methods=["PUT"])
@role_required("Administrator")
def set_availability(doctor_id):
    data = request.get_json(silent=True) or {}
    day = str(data.get("day_of_week", ""))
    start = read_time(data.get("start_time", ""))
    end = read_time(data.get("end_time", ""))

    if day not in DAYS:
        return jsonify({"error": "Please choose a day of the week"}), 400
    if start is None or end is None:
        return jsonify({"error": "Please enter a start time and an end time"}), 400
    if start >= end:
        return jsonify({"error": "The end time must be after the start time"}), 400

    if find_doctor(doctor_id) is None:
        return jsonify({"error": "Doctor not found"}), 404

    existing = db.get_one(
        "SELECT AvailabilityID FROM Doctor_Availability WHERE DoctorID = %s AND DayOfWeek = %s",
        (doctor_id, day),
    )
    if existing is None:
        db.run_change(
            "INSERT INTO Doctor_Availability (DoctorID, DayOfWeek, StartTime, EndTime) "
            "VALUES (%s, %s, %s, %s)",
            (doctor_id, day, start, end),
        )
    else:
        db.run_change(
            "UPDATE Doctor_Availability SET StartTime = %s, EndTime = %s "
            "WHERE AvailabilityID = %s",
            (start, end, existing["AvailabilityID"]),
        )
    return jsonify({"message": "Availability saved"})


# remove the hours a doctor works on one day of the week
@appointments.route("/api/availability/<int:doctor_id>/<day>", methods=["DELETE"])
@role_required("Administrator")
def remove_availability(doctor_id, day):
    if day not in DAYS:
        return jsonify({"error": "Please choose a day of the week"}), 400
    if find_doctor(doctor_id) is None:
        return jsonify({"error": "Doctor not found"}), 404

    db.run_change(
        "DELETE FROM Doctor_Availability WHERE DoctorID = %s AND DayOfWeek = %s",
        (doctor_id, day),
    )
    return jsonify({"message": "Availability removed"})



# Appointments


# Calculate the available times for a doctor on a date
@appointments.route("/api/available-times")
@login_required
def available_times():
    doctor_id = read_number(request.args.get("doctor_id"))
    day = read_date(request.args.get("date", ""))
    if doctor_id is None or day is None:
        return jsonify({"error": "Please choose a doctor and a date"}), 400
    if find_doctor(doctor_id) is None:
        return jsonify({"error": "Doctor not found"}), 404

    booked = db.get_rows(
        "SELECT AppointmentTime FROM Appointment "
        "WHERE DoctorID = %s AND AppointmentDate = %s AND Status <> 'Cancelled'",
        (doctor_id, day.isoformat()),
    )
    taken = [time_text(row["AppointmentTime"]) for row in booked]

    free = [t for t in slots_for(doctor_id, day) if t not in taken]
    return jsonify(free)


# List the appointments on a date, for one doctor or for all doctors
@appointments.route("/api/appointments")
@login_required
def list_appointments():
    day = read_date(request.args.get("date", date.today().isoformat()))
    if day is None:
        return jsonify({"error": "Please enter a valid date"}), 400

    sql = (
        "SELECT a.AppointmentID, a.AppointmentDate, a.AppointmentTime, a.Status, "
        "p.PatientID, p.FirstName, p.Surname, u.UserID AS DoctorID, u.FullName AS DoctorName "
        "FROM Appointment a "
        "JOIN Patient p ON p.PatientID = a.PatientID "
        "JOIN User_Account u ON u.UserID = a.DoctorID "
        "WHERE a.AppointmentDate = %s AND a.Status <> 'Cancelled' "
    )
    values = [day.isoformat()]

    doctor_id = read_number(request.args.get("doctor_id"))
    if doctor_id is not None:
        sql += "AND a.DoctorID = %s "
        values.append(doctor_id)

    sql += "ORDER BY a.AppointmentTime, u.FullName"

    result = []
    for row in db.get_rows(sql, tuple(values)):
        result.append({
            "appointment_id": row["AppointmentID"],
            "date": str(row["AppointmentDate"]),
            "time": time_text(row["AppointmentTime"]),
            "status": row["Status"],
            "patient_id": row["PatientID"],
            "patient_name": row["FirstName"] + " " + row["Surname"],
            "doctor_id": row["DoctorID"],
            "doctor_name": row["DoctorName"],
        })
    return jsonify(result)


# Book an appointment
@appointments.route("/api/appointments", methods=["POST"])
@role_required("Receptionist", "Administrator")
def book_appointment():
    data = request.get_json(silent=True) or {}
    patient_id = read_number(data.get("patient_id"))
    doctor_id = read_number(data.get("doctor_id"))

    if patient_id is None or doctor_id is None or not data.get("date") or not data.get("time"):
        return jsonify({"error": "Please complete all fields"}), 400

    if db.get_one("SELECT PatientID FROM Patient WHERE PatientID = %s", (patient_id,)) is None:
        return jsonify({"error": "Patient not found"}), 404

    day, time, error = check_booking(doctor_id, data["date"], data["time"])
    if error is not None:
        return jsonify({"error": error[0]}), error[1]

    try:
        new_id = db.run_change(
            "INSERT INTO Appointment (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status) "
            "VALUES (%s, %s, %s, %s, 'Booked')",
            (patient_id, doctor_id, day, time),
        )
    except IntegrityError:
        # Two receptionists booked the same time at the same moment: the database index stops the second one
        return jsonify({"error": "This time has already been booked"}), 409

    return jsonify({"message": "Appointment booked", "appointment_id": new_id}), 201


# Reschedule a booked appointment
@appointments.route("/api/appointments/<int:appointment_id>/reschedule", methods=["PUT"])
@role_required("Receptionist", "Administrator")
def reschedule_appointment(appointment_id):
    data = request.get_json(silent=True) or {}
    if not data.get("date") or not data.get("time"):
        return jsonify({"error": "Please complete all fields"}), 400

    appointment = db.get_one(
        "SELECT DoctorID, Status FROM Appointment WHERE AppointmentID = %s", (appointment_id,)
    )
    if appointment is None:
        return jsonify({"error": "Appointment not found"}), 404
    if appointment["Status"] != "Booked":
        return jsonify({"error": "Only a booked appointment can be changed"}), 409

    # The appointment stays with the same doctor
    day, time, error = check_booking(appointment["DoctorID"], data["date"], data["time"], appointment_id)
    if error is not None:
        return jsonify({"error": error[0]}), error[1]

    try:
        db.run_change(
            "UPDATE Appointment SET AppointmentDate = %s, AppointmentTime = %s WHERE AppointmentID = %s",
            (day, time, appointment_id),
        )
    except IntegrityError:
        return jsonify({"error": "This time has already been booked"}), 409

    return jsonify({"message": "Appointment rescheduled"})


# Mark an appointment as Attended, Missed or Cancelled
@appointments.route("/api/appointments/<int:appointment_id>/status", methods=["PUT"])
@role_required("Receptionist", "Administrator")
def change_status(appointment_id):
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", ""))

    if status not in ["Attended", "Missed", "Cancelled"]:
        return jsonify({"error": "Please choose Attended, Missed or Cancelled"}), 400

    appointment = db.get_one(
        "SELECT Status FROM Appointment WHERE AppointmentID = %s", (appointment_id,)
    )
    if appointment is None:
        return jsonify({"error": "Appointment not found"}), 404
    if appointment["Status"] != "Booked":
        return jsonify({"error": "Only a booked appointment can be changed"}), 409

    db.run_change(
        "UPDATE Appointment SET Status = %s WHERE AppointmentID = %s", (status, appointment_id)
    )
    return jsonify({"message": "Appointment marked as " + status})
