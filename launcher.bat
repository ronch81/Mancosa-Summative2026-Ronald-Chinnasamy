@echo off
REM Sunrise Community Clinic
REM Application Launcher for Windows systems
REM By Ronald Chinnasamy

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5000"
python backend\app.py
