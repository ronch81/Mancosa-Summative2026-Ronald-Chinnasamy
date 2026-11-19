-- Sunrise Community Clinic
-- Insert the first administrator
-- Developed and tested in MySQL Workbench
-- By Ronald Chinnasamy

-- Requirements: 
-- Scripts: 1-Create-database.sql, 2-create-tables.sql and 3-create-index.sql

-- Login for the first administrator:
-- Username: admin
-- Password: admin
-- Hashing Method: SHA2(256 bit)
-- The password is not stored as plain text, the password in this instance (admin) is hashed using SHA2 256
 
USE SunriseCC;

INSERT INTO User_Account (FullName, Username, PasswordHash, Role)
VALUES ('Administrator', 'admin', SHA2('admin', 256), 'Administrator');
 
 