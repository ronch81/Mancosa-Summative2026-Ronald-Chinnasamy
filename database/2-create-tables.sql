-- Sunrise Community Clinic
-- Creation of tables
-- Developed and tested in MySQL Workbench
-- By Ronald Chinnasamy
--
-- Requirements: Database creation script (1-Create-database.sql) needs to be executed first.

-- Ensure the SQL code is run on SunriseCC
USE SunriseCC;

-- Creation of the User_Account table for users who use the system, i.e Receptionist, Doctor, Nurse, Administrator
-- uses auto incrementation so that UserID is never duplicated. UserID therefore must not be filled in at the front end
CREATE TABLE User_Account (
    UserID        INT AUTO_INCREMENT PRIMARY KEY,
    FullName      VARCHAR(100) NOT NULL,
    Username      VARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash  VARCHAR(255) NOT NULL,
    Role          ENUM('Receptionist', 'Doctor', 'Nurse', 'Administrator') NOT NULL,
    IsActive      TINYINT(1)   NOT NULL DEFAULT 1
);

-- Creation of the patients table
-- Auto incrementation is used here again to prevent duplicate values in the PatientID field
CREATE TABLE Patient (
    PatientID      INT AUTO_INCREMENT PRIMARY KEY,
    FirstName      VARCHAR(50)  NOT NULL,
    Surname        VARCHAR(50)  NOT NULL,
    IDNumber       VARCHAR(20)  NOT NULL UNIQUE,
    Address        VARCHAR(200) NOT NULL,
    ContactNumber  VARCHAR(20)  NOT NULL
);

-- Creation of the doctor availability table
-- This is used to store the availability of the doctors
-- AvailabilityID is again set to auto increment
-- UNIQUE is used to prevent a doctor from having more than one availability entry for the same day
-- FK - links back to User_Account
CREATE TABLE Doctor_Availability (
    AvailabilityID  INT AUTO_INCREMENT PRIMARY KEY,
    DoctorID        INT NOT NULL,
    DayOfWeek       ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday','Friday', 'Saturday', 'Sunday') NOT NULL,
    StartTime       TIME NOT NULL,
    EndTime         TIME NOT NULL,
    FOREIGN KEY (DoctorID) REFERENCES User_Account (UserID),
    UNIQUE (DoctorID, DayOfWeek)
);

-- Creation of the appointments table
-- Auto Incrementation is used once again to ensure that AppointmentID is unique
-- FK - links back to tables Patient and User_Account
CREATE TABLE Appointment (
    AppointmentID    INT AUTO_INCREMENT PRIMARY KEY,
    PatientID        INT  NOT NULL,
    DoctorID         INT  NOT NULL,
    AppointmentDate  DATE NOT NULL,
    AppointmentTime  TIME NOT NULL,
    Status           ENUM('Booked', 'Attended', 'Missed', 'Cancelled')
                     NOT NULL DEFAULT 'Booked',
    ActiveSlot       TINYINT GENERATED ALWAYS AS
                     (CASE WHEN Status = 'Cancelled' THEN NULL ELSE 1 END) STORED,
    FOREIGN KEY (PatientID) REFERENCES Patient (PatientID),
    FOREIGN KEY (DoctorID)  REFERENCES User_Account (UserID)
);

-- Creation of the visit table
-- used to store Visit information
-- FK - links back to tables Patient and User_account
CREATE TABLE Visit (
    VisitID         INT AUTO_INCREMENT PRIMARY KEY,
    PatientID       INT  NOT NULL,
    VisitDate       DATE NOT NULL,
    ReasonForVisit  VARCHAR(200) NOT NULL,
    Notes           TEXT,
    RecordedByID    INT  NOT NULL,
    FOREIGN KEY (PatientID)    REFERENCES Patient (PatientID),
    FOREIGN KEY (RecordedByID) REFERENCES User_Account (UserID)
);
