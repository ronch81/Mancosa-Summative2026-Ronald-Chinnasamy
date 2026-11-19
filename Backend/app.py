# Sunrise Community Clinic
# app.py - starts the web application.
# By Ronald Chinnasamy
#
# Requirements: pip install flask mysql-connector-python
# Open Instructions:    http://localhost:5000
# Requires the files to be in the same folder as config.py, db.py and auth.py for it to work

from flask import Flask, redirect
from patients import patients
from users import users
from appointments import appointments
from visits import visits
from reports import reports

import config
from auth import auth

# Initialize the Flask application - frontend files need to be /frontend folder for it to work
app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.secret_key = config.SECRET_KEY

# Connect each part of the system.
app.register_blueprint(auth)
app.register_blueprint(patients)
app.register_blueprint(users)
app.register_blueprint(appointments)
app.register_blueprint(visits)
app.register_blueprint(reports)

# redirects to the login.html page when starting up
@app.route("/")
def home():
    return redirect("/login.html")

# allows the system to run in the background and listen for requests on port 5000 while using the localhost IP address (127.0.0.1)
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
