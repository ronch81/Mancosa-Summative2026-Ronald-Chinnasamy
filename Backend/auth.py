# Sunrise Community Clinic
# auth.py - login, logout, session time-out and role checks.
# By Ronald Chinnasamy
#
# Requirements: 
# pip install flask
# The file must live in the same folder as config.py and db.py for it to work

import hashlib
import time
from functools import wraps

from flask import Blueprint, jsonify, request, session

import config
import db

auth = Blueprint("auth", __name__)


# The below function hashes a password with SHA2 (256 bit). This matches the hashing used in the MySQL database
# This is called using the hashlib library to hash the password using the SHA-256 algorithm
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# The below function adds a level of security to the application by ensuring that only authenticated users 
# can access certain routes and that sessions are automatically cleared after a period of inactivity    
def login_required(function):
    @wraps(function)
    def check(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Please log in"}), 401

        idle_seconds = time.time() - session.get("last_active", 0)
        if idle_seconds > config.SESSION_TIMEOUT_MINUTES * 60:
            session.clear()
            return jsonify({"error": "Session expired. Please log in again"}), 401

        session["last_active"] = time.time()
        return function(*args, **kwargs)
    return check


# The below function adds a level of security to the application by ensuring that only users with 
# specific roles can access certain routes
def role_required(*roles):
    def decorator(function):
        @wraps(function)
        @login_required
        def check(*args, **kwargs):
            if session["role"] not in roles:
                return jsonify({"error": "Access denied"}), 403
            return function(*args, **kwargs)
        return check
    return decorator


# The below function creates the login, logout and me routes for the application
# These routes are used to manage user authentication and session management
@auth.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if username == "" or password == "":
        return jsonify({"error": "Please enter a valid username and password"}), 400

    user = db.get_one("SELECT * FROM User_Account WHERE Username = %s", (username,))

    if user is None or user["IsActive"] == 0:
        return jsonify({"error": "Invalid username or password"}), 401

    if hash_password(password) != user["PasswordHash"]:
        return jsonify({"error": "Invalid username or password"}), 401

    # The session is started once the login is successful
    session.clear()
    session["user_id"] = user["UserID"]
    session["full_name"] = user["FullName"]
    session["role"] = user["Role"]
    session["last_active"] = time.time()

    return jsonify({"full_name": user["FullName"], "role": user["Role"]})


# The below function creates the logout route for the application
@auth.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


# For the below the route helps identify the user and their role for the front-end to display the correct menu and information
@auth.route("/api/me")
@login_required
def me():
    return jsonify({"full_name": session["full_name"], "role": session["role"]})
