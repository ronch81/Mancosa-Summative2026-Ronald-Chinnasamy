# Sunrise Community Clinic
# users.py - creation and administration of user accounts
# By Ronald Chinnasamy
#
# Requirements: db.py and auth.py must be in the same folder
# Uses flask to provide the api endpoint for the frontends

from flask import Blueprint, jsonify, request, session

import db
from auth import role_required, hash_password

users = Blueprint("users", __name__)

ROLES = ["Receptionist", "Doctor", "Nurse", "Administrator"]


def password_problem(password):
    # Password strength check - hard coded to 8 chars
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return "Password must contain an uppercase letter"
    if not any(c.islower() for c in password):
        return "Password must contain a lowercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain a number"
    return None


# List all users
@users.route("/api/users")
@role_required("Administrator")
def list_users():
    rows = db.get_rows(
        "SELECT UserID, FullName, Username, Role, IsActive FROM User_Account "
        "ORDER BY FullName"
    )
    return jsonify(rows)



# Create a new user
@users.route("/api/users", methods=["POST"])
@role_required("Administrator")
def create_user():
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    role = str(data.get("role", ""))

    if full_name == "" or username == "" or password == "" or role == "":
        return jsonify({"error": "Please fill in all fields"}), 400
    if role not in ROLES:
        return jsonify({"error": "Please choose a valid role"}), 400

    problem = password_problem(password)
    if problem is not None:
        return jsonify({"error": problem}), 400
    
    # check if the username is already taken
    if db.get_one("SELECT UserID FROM User_Account WHERE Username = %s", (username,)) is not None:
        return jsonify({"error": "This username is already taken"}), 409

    new_id = db.run_change(
        "INSERT INTO User_Account (FullName, Username, PasswordHash, Role) "
        "VALUES (%s, %s, %s, %s)",
        (full_name, username, hash_password(password), role),
    )
    return jsonify({"message": "User created successfully", "user_id": new_id}), 201


# Edit a user
@users.route("/api/users/<int:user_id>", methods=["PUT"])
@role_required("Administrator")
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    role = str(data.get("role", ""))
    password = str(data.get("password", ""))
    is_active = data.get("is_active")

    if full_name == "" or role == "":
        return jsonify({"error": "Please fill in all fields"}), 400
    if role not in ROLES:
        return jsonify({"error": "Please choose a valid role"}), 400
    if not isinstance(is_active, bool):
        return jsonify({"error": "Please choose Active or Inactive"}), 400

    if db.get_one("SELECT UserID FROM User_Account WHERE UserID = %s", (user_id,)) is None:
        return jsonify({"error": "User not found"}), 404

    # Administrator safeguard to prevent lockout or inadvertant role change
    if user_id == session["user_id"] and (role != "Administrator" or not is_active):
        return jsonify({"error": "You cannot deactivate or change the role of your own account"}), 400

    if password != "":
        problem = password_problem(password)
        if problem is not None:
            return jsonify({"error": problem}), 400
        db.run_change(
            "UPDATE User_Account SET PasswordHash = %s WHERE UserID = %s",
            (hash_password(password), user_id),
        )

    db.run_change(
        "UPDATE User_Account SET FullName = %s, Role = %s, IsActive = %s WHERE UserID = %s",
        (full_name, role, 1 if is_active else 0, user_id),
    )
    return jsonify({"message": "User updated successfully"})
