# Sunrise Community Clinic
# Application Launcher
# By Ronald Chinnasamy

Start-Job { Start-Sleep -Seconds 3; Start-Process "http://localhost:5000" } | Out-Null
python backend\app.py