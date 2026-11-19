# Sunrise Community Clinic
# patients.py - Patient management
# By Ronald Chinnasamy
#
# Requirements: Must be in the backend folder of the project
# Uses Flask to provide the api endpoint for the frontends

from flask import Blueprint, jsonify, request

import db
from auth import login_required, role_required

patients = Blueprint("patients", __name__)


def get_fields(data):
    # Reads the five patient fields from the request and removes extra spaces
    names = ["first_name", "surname", "id_number", "address", "contact_number"]
    fields = {}
    for name in names:
        value = str(data.get(name, "")).strip()
        if value == "":
            return None
        fields[name] = value
    return fields


# Search for patients by name or ID number
@patients.route("/api/patients")
@login_required
def search_patients():
    text = "%" + request.args.get("search", "").strip() + "%"
    rows = db.get_rows(
        "SELECT PatientID, FirstName, Surname, IDNumber, Address, ContactNumber "
        "FROM Patient "
        "WHERE FirstName LIKE %s OR Surname LIKE %s OR IDNumber LIKE %s "
        "OR CONCAT(FirstName, ' ', Surname) LIKE %s "
        "ORDER BY Surname, FirstName LIMIT 50",
        (text, text, text, text),
    )
    return jsonify(rows)


# View one patient
@patients.route("/api/patients/<int:patient_id>")
@login_required
def view_patient(patient_id):
    patient = db.get_one(
        "SELECT PatientID, FirstName, Surname, IDNumber, Address, ContactNumber "
        "FROM Patient WHERE PatientID = %s",
        (patient_id,),
    )
    if patient is None:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient)


# Register a new patient
@patients.route("/api/patients", methods=["POST"])
@role_required("Receptionist", "Administrator")
def register_patient():
    fields = get_fields(request.get_json(silent=True) or {})
    if fields is None:
        return jsonify({"error": "Please fill in all fields"}), 400

    # patient validation - checks if patient already exists in the database
    existing = db.get_one("SELECT PatientID FROM Patient WHERE IDNumber = %s", (fields["id_number"],))
    if existing is not None:
        return jsonify({"error": "This patient is already registered on the system"}), 409

    new_id = db.run_change(
        "INSERT INTO Patient (FirstName, Surname, IDNumber, Address, ContactNumber) "
        "VALUES (%s, %s, %s, %s, %s)",
        (fields["first_name"], fields["surname"], fields["id_number"],
         fields["address"], fields["contact_number"]),
    )
    return jsonify({"message": "New patient registered successfully", "patient_id": new_id}), 201


# Update a patient's details
@patients.route("/api/patients/<int:patient_id>", methods=["PUT"])
@role_required("Receptionist", "Administrator")
def update_patient(patient_id):
    fields = get_fields(request.get_json(silent=True) or {})
    if fields is None:
        return jsonify({"error": "Please fill in all fields"}), 400

    if db.get_one("SELECT PatientID FROM Patient WHERE PatientID = %s", (patient_id,)) is None:
        return jsonify({"error": "Patient not found"}), 404

    other = db.get_one(
        "SELECT PatientID FROM Patient WHERE IDNumber = %s AND PatientID <> %s",
        (fields["id_number"], patient_id),
    )
    if other is not None:
        return jsonify({"error": "Another patient already has this ID number"}), 409

    db.run_change(
        "UPDATE Patient SET FirstName = %s, Surname = %s, IDNumber = %s, "
        "Address = %s, ContactNumber = %s WHERE PatientID = %s",
        (fields["first_name"], fields["surname"], fields["id_number"],
         fields["address"], fields["contact_number"], patient_id),
    )
    return jsonify({"message": "Patient updated successfully"})
