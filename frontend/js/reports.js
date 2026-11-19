// Sunrise Community Clinic
// reports.js - makes the reports page work: the daily appointments report and the visits report.
// By Ronald Chinnasamy
//
// Used by reports.html. common.js must be loaded before this file.
// The back end routes are in reports.py.
 
const reportDate = document.getElementById("report-date");
const dailyMessage = document.getElementById("daily-message");
const dutyBody = document.getElementById("duty-body");
const dailyBody = document.getElementById("daily-body");
const visitsSection = document.getElementById("visits-report-section");
const fromDate = document.getElementById("from-date");
const toDate = document.getElementById("to-date");
const visitsMessage = document.getElementById("visits-message");
const visitsBody = document.getElementById("visits-body");
 
 
// Error handling
function showMessage(element, text, isError) {
    element.textContent = text;
    if (isError) {
        element.className = "error-text";
    } else {
        element.className = "success-text";
    }
}
 
 
// Fetches the current date in YYYY-MM-DD format
function todayText() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
}
 
// adds a row to the table and populates it with the values in the array
function addRow(tableBody, values) {
    const row = document.createElement("tr");
    for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    }
    tableBody.appendChild(row);
}
 
 
// Shows Daily report for the doctors on duty for specified day
async function showDailyReport() {
    dailyMessage.textContent = "";
 
    const result = await callApi("/api/reports/daily?date=" + reportDate.value);
 
    dutyBody.innerHTML = "";
    dailyBody.innerHTML = "";
 
    if (!result.ok) {
        showMessage(dailyMessage, result.data.error, true);
        return;
    }
 
    for (const doctor of result.data.doctors_on_duty) {
        addRow(dutyBody, [doctor.doctor_name, doctor.start_time, doctor.end_time]);
    }
    for (const appointment of result.data.appointments) {
        addRow(dailyBody, [appointment.doctor_name, appointment.time, appointment.patient_name, appointment.status]);
    }
 
    if (result.data.doctors_on_duty.length === 0 && result.data.appointments.length === 0) {
        showMessage(dailyMessage, "No doctors on duty and no appointments on " + result.data.day, true);
    } else {
        showMessage(dailyMessage, result.data.day + " " + result.data.date + ": " +
            result.data.doctors_on_duty.length + " doctor(s) on duty, " +
            result.data.appointments.length + " appointment(s)", false);
    }
}
 
 
// Shows vist history between 2 dates
async function showVisitsReport() {
    visitsMessage.textContent = "";
 
    const result = await callApi("/api/reports/visits?from=" + fromDate.value + "&to=" + toDate.value);
 
    visitsBody.innerHTML = "";
 
    if (!result.ok) {
        showMessage(visitsMessage, result.data.error, true);
        return;
    }
 
    for (const visit of result.data.visits) {
        addRow(visitsBody, [visit.date, visit.patient_name, visit.reason, visit.recorded_by]);
    }
    showMessage(visitsMessage, "Total visits: " + result.data.total, false);
}
 
 
// Button handling
document.getElementById("daily-button").addEventListener("click", showDailyReport);
document.getElementById("visits-button").addEventListener("click", showVisitsReport);
 
 
// Prevents unauthorized users from seeing the reports page, and hides the visits report from Receptionists
async function setupPage() {
    reportDate.value = todayText();
    fromDate.value = todayText();
    toDate.value = todayText();
 
    const user = await userReady;
    if (user.role !== "Administrator" && user.role !== "Receptionist") {
        window.location.href = "patients.html";
        return;
    }
    if (user.role !== "Administrator") {
        visitsSection.style.display = "none";
    }
    showDailyReport();
}
 
setupPage();