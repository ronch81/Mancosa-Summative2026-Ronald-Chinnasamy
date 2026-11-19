-- Sunrise Community Clinic
-- Creation of Indexes
-- Developed and tested in MySQL Workbench
-- By Ronald Chinnasamy
--
-- Requirements: Database creation script (1-Create-Database.sql)
-- Requirements: Create Tables script (2-create-tables.sql)

USE SunriseCC;

-- Creation of a unique index to help prevent double booking
CREATE UNIQUE INDEX idx_no_double_booking
    ON Appointment (DoctorID, AppointmentDate, AppointmentTime, ActiveSlot);

-- Indexes that will assist with faster searching on the tables created.
CREATE INDEX idx_patient_surname ON Patient (Surname);
CREATE INDEX idx_visit_patient   ON Visit (PatientID, VisitDate);
CREATE INDEX idx_appt_date       ON Appointment (AppointmentDate);