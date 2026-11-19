# Sunrise Community Clinic
# db.py - connects to the MySQL database and runs SQL commands for the Sunrise Community Clinic web application.
# By Ronald Chinnasamy
#
# Requirements: 
# pip install mysql-connector-python
# config.py must be in the same folder for get_connection() to work.

import mysql.connector
import config


def get_connection():
    # Opens a new connection to the SunriseCC database
    return mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
    )


def get_rows(sql, values=()):
    # Runs a SELECT query and returns all rows as a list of dictionaries
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, values)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def get_one(sql, values=()):
    # Runs a SELECT and return the first row as a dictionary or None if nothing is found
    rows = get_rows(sql, values)
    if rows:
        return rows[0]
    return None


def run_change(sql, values=()):
    # Runs an INSERT, UPDATE or DELETE query and commits the changes to the database
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, values)
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()
