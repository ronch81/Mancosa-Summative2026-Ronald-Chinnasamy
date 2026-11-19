# Example of a backup Solution using PowerShell
# by Ronald Chinnasamy

# Chnage only the top 3 variables
# Source folders

$DBFolder = "C:\ProgramData\MySQL\MySQL Server 8.0\Data\sunrisecc"
$ProgramFolder = "C:\Data\Program"
$BackupRoot = "C:\Backup"

# DO NOT CHANGE BELOW THIS LINE

#Variable - joins folder name with date
$Today = Get-Date -Format "yyyy-MM-dd"
$DateFolder = Join-Path $BackupRoot $Today

$DBZip = Join-Path $DateFolder "db-$Today.zip"
$ProgramZip = Join-Path $DateFolder "program-$Today.zip"


# Create backup directory
if (!(Test-Path $DateFolder)) {
    New-Item -ItemType Directory -Path $DateFolder -Force | Out-Null
}

# Zip the database folder
try {
    if (Test-Path $DBZip) {
        Remove-Item $DBZip -Force
    }

    Write-Host "Creating database backup..." -ForegroundColor Yellow

    Compress-Archive -Path $DBFolder -DestinationPath $DBZip -CompressionLevel Optimal -ErrorAction Stop

    Write-Host "Database backup completed: $DBZip" -ForegroundColor Green
}
catch {
    Write-Host "Database backup failed: $($_.Exception.Message)" -ForegroundColor Red
}

#Zip the program folder
try {
    if (Test-Path $ProgramZip) {
        Remove-Item $ProgramZip -Force
    }

    Write-Host "Creating program backup..." -ForegroundColor Yellow

    Compress-Archive -Path $ProgramFolder -DestinationPath $ProgramZip -CompressionLevel Optimal -ErrorAction Stop

    Write-Host "Program backup completed: $ProgramZip" -ForegroundColor Green
}
catch {
    Write-Host "Program backup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"