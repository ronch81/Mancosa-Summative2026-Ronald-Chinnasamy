// Sunrise Community Clinic
// visits.js find a patient, record today's visit and show their previous visits
// By Ronald Chinnasamy
//
// Used by visits.html. common.js must be loaded before this file.
// The back end routes are in visits.py and patients.py
 
const patientSearch = document.getElementById("patient-search");
const patientChoice = document.getElementById("patient-choice");
const patientSelect = document.getElementById("patient-select");
const selectedPatientNote = document.getElementById("selected-patient");
const reasonBox = document.getElementById("reason-box");
const notesBox = document.getElementById("notes-box");
const visitMessage = document.getElementById("visit-message");
const historyMessage = document.getElementById("history-message");
const historyBody = document.getElementById("history-body");
 
let foundPatients = [];
 
let selectedPatient = null;

let historyRequest = 0;
 
 
// Error handling
function showMessage(element, text, isError) {
    element.textContent = text;
    if (isError) {
        element.className = "error-text";
    } else {
        element.className = "success-text";
    }
}
 
 
// Loads patient history
async function loadHistory() {    
    historyRequest = historyRequest + 1;
    const thisRequest = historyRequest;
 
    historyMessage.textContent = "";
    historyBody.innerHTML = "";
 
    if (selectedPatient === null) {
        return;
    }
 
    const result = await callApi("/api/visits/" + selectedPatient.PatientID);
    if (thisRequest !== historyRequest) {
        return;
    }
    if (!result.ok) {
        showMessage(historyMessage, result.data.error, true);
        return;
    }
    if (result.data.length === 0) {
        historyMessage.textContent = "No previous visits";
        historyMessage.className = "small-note";
        return;
    }
 
    for (const visit of result.data) {
        const row = document.createElement("tr");
        const values = [visit.date, visit.reason, visit.notes, visit.recorded_by];
        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }
        historyBody.appendChild(row);
    }
}
 
 
// Shows selected patient history
function chosePatient(patient) {
    selectedPatient = patient;
    if (patient === null) {
        selectedPatientNote.textContent = "No patient selected";
    } else {
        selectedPatientNote.textContent =
            "Selected: " + patient.FirstName + " " + patient.Surname + " (ID " + patient.IDNumber + ")";
    }
    loadHistory();
}
 
 
// Patient Search
async function searchPatients() {
    visitMessage.textContent = "";
    const text = patientSearch.value.trim();
    if (text === "") {
        showMessage(visitMessage, "Please enter a name or ID number", true);
        return;
    }
 
    const result = await callApi("/api/patients?search=" + encodeURIComponent(text));
    if (!result.ok) {
        showMessage(visitMessage, result.data.error, true);
        return;
    }
 
    foundPatients = result.data;
    chosePatient(null);
    patientSelect.innerHTML = "";
 
    if (foundPatients.length === 0) {
        patientChoice.style.display = "none";
        showMessage(visitMessage, "No patients found", true);
        return;
    }
 
    if (foundPatients.length > 1) {
        const reminder = document.createElement("option");
        reminder.value = "";
        reminder.textContent = "Select patient";
        patientSelect.appendChild(reminder);
    }
    for (const patient of foundPatients) {
        const option = document.createElement("option");
        option.value = patient.PatientID;
        option.textContent = patient.FirstName + " " + patient.Surname + " (" + patient.IDNumber + ")";
        patientSelect.appendChild(option);
    }
    patientChoice.style.display = "block";
 
    if (foundPatients.length === 1) {
        chosePatient(foundPatients[0]);
    }
}
 
 
// When the user picks a patient from the list, show their history
function patientPicked() {
    const id = patientSelect.value;
    chosePatient(foundPatients.find(function (p) { return String(p.PatientID) === id; }) || null);
}
 
 
// Saves visit
async function saveVisit() {
    visitMessage.textContent = "";
 
    if (selectedPatient === null) {
        showMessage(visitMessage, "Please choose a patient", true);
        return;
    }
 
    const result = await callApi("/api/visits", "POST", {
        patient_id: selectedPatient.PatientID,
        reason_for_visit: reasonBox.value,
        notes: notesBox.value
    });
 
    if (!result.ok) {
        showMessage(visitMessage, result.data.error, true);
        return;
    }
 
    reasonBox.value = "";
    notesBox.value = "";
    showMessage(visitMessage, result.data.message, false);
    loadHistory();
}
 
 
//Clear form
function clearForm() {
    patientSearch.value = "";
    patientChoice.style.display = "none";
    patientSelect.innerHTML = "";
    foundPatients = [];
    chosePatient(null);
    reasonBox.value = "";
    notesBox.value = "";
    visitMessage.textContent = "";
}
 
 
// Button handling
document.getElementById("patient-search-button").addEventListener("click", searchPatients);
patientSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchPatients();
    }
});
patientSelect.addEventListener("change", patientPicked);
document.getElementById("save-button").addEventListener("click", saveVisit);
document.getElementById("clear-button").addEventListener("click", clearForm);
 
 
// only allows doctors and nurses to use this page
async function setupPage() {
    const user = await userReady;
    if (user.role !== "Doctor" && user.role !== "Nurse") {
        window.location.href = "patients.html";
    }
}
 
setupPage();