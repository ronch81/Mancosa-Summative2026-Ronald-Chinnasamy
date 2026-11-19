# Sunrise Community Clinic
# config.py - application settings used by the Sunrise Community Clinic web application.
# By Ronald Chinnasamy

# MySQL connection details.
# Contains the connection settings for the MySQL database used by the Sunrise Community Clinic web application

DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "P@ssw0rd123"
DB_NAME = "SunriseCC"

# Used by Flask to protect the login session.
SECRET_KEY = "SunRiseRulesHealhCare"

# Used to control the period of inactivity (session timeout).
SESSION_TIMEOUT_MINUTES = 15
