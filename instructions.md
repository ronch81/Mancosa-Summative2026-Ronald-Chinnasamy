# Final Techincal Summative
## Higher Certificate in coding (Mancosa)

### By Ronald Chinnasamy
### November 2026 

#### This file contains instructions for running the application:

##### MySQL:
Download and install MySQL from https://www.mysql.com/downloads/
Please use the following credentials for your admin account, else you will have to change them in \backend\config.py
u: root
p: P@ssw0rd123

##### Python:
1. Download and install Python from https://www.python.org/
2. Run the below commands in powershell:

pip install mysql-connector-python
pip install flask


mysql-connector-python allows python to talk to the MySQL database you set up earlier.
flask is an open source web framework that allows us to build web apps and api's which you will see demonstrated.

##### Browser:
Please download and install a modern web browser such as chrome (https://www.google.com/chrome/) or Edge which is preinstalled on most modern Microsoft systems.

#### SQL Database setup
in MYSQL Workbench please run the scripts in the following order:
    1-Create-database.sql
    2-create-tables.sql
    3-create-index.sql
    4-create-admin-user.sql

#### Default Application password
For your convenience script **4-create-admin-user.sql** creates an admin user that can be used in the application.
The details are:
    u: admin
    p: admin

#### Running the application

**Method 1: Using powershell**
    Please execute the file launcher.ps1 located in the root of the project folder.

**Method 2: Using the windows command line**
    Please execute the file launcher.bat located in the root of the project folder.

**Method 3: Using your Integrated Development Environment (example VScode, Visual Studio)**
    Execute the backend\app.py file using python
    Open up your modern browser and visit http://localhost:5000/


