// Sunrise Community Clinic
// appointments.js - makes the appointments page work: book, reschedule, cancel and view appointments.
// By Ronald Chinnasamy
//
// Used by appointments.html
// The back end routes are in appointments.py (appointments, doctors) and patients.py (patient search)
 
const patientSearch = document.getElementById("patient-search");
const patientChoice = document.getElementById("patient-choice");
const patientSelect = document.getElementById("patient-select");
const selectedPatientNote = document.getElementById("selected-patient");
const doctorSelect = document.getElementById("doctor-select");
const dateBox = document.getElementById("date-box");
const timeSelect = document.getElementById("time-select");
const bookingMessage = document.getElementById("booking-message");
const appointmentsMessage = document.getElementById("appointments-message");
const appointmentsBody = document.getElementById("appointments-body");
const reschedulePanel = document.getElementById("reschedule-panel");
const rescheduleInfo = document.getElementById("reschedule-info");
const newDateBox = document.getElementById("new-date");
const newTimeSelect = document.getElementById("new-time");
 

let foundPatients = [];
 
let selectedPatient = null;
 
let selectedAppointment = null;
 
let appointmentsRequest = 0;
 
 
// Error handling
function showMessage(element, text, isError) {
    element.textContent = text;
    if (isError) {
        element.className = "error-text";
    } else {
        element.className = "success-text";
    }
}
 
 
// Fetch todays date in YYYY-MM-DD format
function todayText() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
}

// Patient search
 
// Shows selected patient
function chosePatient(patient) {
    selectedPatient = patient;
    if (patient === null) {
        selectedPatientNote.textContent = "No patient selected";
    } else {
        selectedPatientNote.textContent =
            "Selected: " + patient.FirstName + " " + patient.Surname + " (ID " + patient.IDNumber + ")";
    }
}
 
 
// Patient Search
async function searchPatients() {
    bookingMessage.textContent = "";
    const text = patientSearch.value.trim();
    if (text === "") {
        showMessage(bookingMessage, "Please enter a name or ID number", true);
        return;
    }
 
    const result = await callApi("/api/patients?search=" + encodeURIComponent(text));
    if (!result.ok) {
        showMessage(bookingMessage, result.data.error, true);
        return;
    }
 
    foundPatients = result.data;
    chosePatient(null);
    patientSelect.innerHTML = "";
 
    if (foundPatients.length === 0) {
        patientChoice.style.display = "none";
        showMessage(bookingMessage, "No patients found", true);
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
 
 
// stores the chosen patient and shows it in the form
function patientPicked() {
    const id = patientSelect.value;
    chosePatient(foundPatients.find(function (p) { return String(p.PatientID) === id; }) || null);
}
 
 

// Doctor free times and appointments

 
// Loads the list of only the doctors who have appointments
async function loadDoctors() {
    const result = await callApi("/api/doctors");
    if (!result.ok) {
        showMessage(appointmentsMessage, result.data.error, true);
        return;
    }
    for (const doctor of result.data) {
        const option = document.createElement("option");
        option.value = doctor.UserID;
        option.textContent = doctor.FullName;
        doctorSelect.appendChild(option);
    }
}
 
 
// Fills in the list of free times for the chosen doctor and date
async function fillTimes(timeList, doctorId, day) {
    const thisRequest = (timeList.requestNumber || 0) + 1;
    timeList.requestNumber = thisRequest;
 
    let firstText = "Select available time";
    let times = [];
 
    if (doctorId !== "" && day !== "") {
        const result = await callApi("/api/available-times?doctor_id=" + doctorId + "&date=" + day);
        if (timeList.requestNumber !== thisRequest) {
            return;
        }
        if (!result.ok) {
            firstText = result.data.error;
        } else if (result.data.length === 0) {
            firstText = "No times available";
        } else {
            times = result.data;
        }
    }
 
    timeList.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = firstText;
    timeList.appendChild(first);
 
    for (const time of times) {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        timeList.appendChild(option);
    }
}
 
 
// Adds a row to the appointments table
function addAppointmentRow(appointment) {
    const row = document.createElement("tr");
    row.className = "clickable";
 
    const values = [appointment.time, appointment.patient_name, appointment.status];
    for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    }
 
    row.addEventListener("click", function () {
        for (const other of appointmentsBody.children) {
            other.classList.remove("selected-row");
        }
        row.classList.add("selected-row");
        selectedAppointment = appointment;
        appointmentsMessage.textContent = "";
    });
 
    appointmentsBody.appendChild(row);
}
 
 
// Shows the selected doctor's appointments on the chosen date
async function loadAppointments() {    
    appointmentsRequest = appointmentsRequest + 1;
    const thisRequest = appointmentsRequest;
 
    appointmentsMessage.textContent = "";
    appointmentsBody.innerHTML = "";
    selectedAppointment = null;
    reschedulePanel.style.display = "none";
 
    if (doctorSelect.value === "" || dateBox.value === "") {
        return;
    }
 
    const result = await callApi("/api/appointments?date=" + dateBox.value + "&doctor_id=" + doctorSelect.value);
    if (thisRequest !== appointmentsRequest) {
        return;
    }
    if (!result.ok) {
        showMessage(appointmentsMessage, result.data.error, true);
        return;
    }
    if (result.data.length === 0) {
        appointmentsMessage.textContent = "No appointments for this doctor on this date";
        appointmentsMessage.className = "small-note";
        return;
    }
    for (const appointment of result.data) {
        addAppointmentRow(appointment);
    }
}
 
 
// used to refresh the appointments and free times when the doctor or date is changed
function doctorOrDateChanged() {
    bookingMessage.textContent = "";
    loadAppointments();
    fillTimes(timeSelect, doctorSelect.value, dateBox.value);
}

// Booking
// Books the appointment
async function bookAppointment() {
    bookingMessage.textContent = "";
 
    if (selectedPatient === null || doctorSelect.value === "" || dateBox.value === "" || timeSelect.value === "") {
        showMessage(bookingMessage, "Please complete all fields", true);
        return;
    }
 
    const result = await callApi("/api/appointments", "POST", {
        patient_id: selectedPatient.PatientID,
        doctor_id: doctorSelect.value,
        date: dateBox.value,
        time: timeSelect.value
    });
 
    if (!result.ok) {
        showMessage(bookingMessage, result.data.error, true);
        return;
    }
 
    showMessage(bookingMessage, result.data.message, false);
    loadAppointments();
    fillTimes(timeSelect, doctorSelect.value, dateBox.value);
}
 
 
// Clears booking form
function clearBooking() {
    patientSearch.value = "";
    patientChoice.style.display = "none";
    patientSelect.innerHTML = "";
    foundPatients = [];
    chosePatient(null);
    doctorSelect.value = "";
    dateBox.value = todayText();
    bookingMessage.textContent = "";
    doctorOrDateChanged();
}
 
 

// Appointment editing

 
// Validates if an appointment can be changed
function canChangeSelected() {
    appointmentsMessage.textContent = "";
    if (selectedAppointment === null) {
        showMessage(appointmentsMessage, "Please click an appointment in the table first", true);
        return false;
    }
    if (selectedAppointment.status !== "Booked") {
        showMessage(appointmentsMessage, "Only a booked appointment can be changed", true);
        return false;
    }
    return true;
}
 
 
// Changes the status of the appointment to Attended, Missed or Cancelled
async function changeStatus(status) {
    if (!canChangeSelected()) {
        return;
    }
    if (status === "Cancelled" && !confirm("Cancel this appointment?")) {
        return;
    }
 
    const result = await callApi("/api/appointments/" + selectedAppointment.appointment_id + "/status", "PUT",
        { status: status });
    if (!result.ok) {
        showMessage(appointmentsMessage, result.data.error, true);
        return;
    }
 
    await loadAppointments();
    showMessage(appointmentsMessage, result.data.message, false);
    fillTimes(timeSelect, doctorSelect.value, dateBox.value);
}
 
 
// Opens the reschedule panel
function openReschedule() {
    if (!canChangeSelected()) {
        return;
    }
    rescheduleInfo.textContent = selectedAppointment.time + " - " + selectedAppointment.patient_name;
    newDateBox.value = selectedAppointment.date;
    fillTimes(newTimeSelect, selectedAppointment.doctor_id, newDateBox.value);
    reschedulePanel.style.display = "block";
}
 
 
// Confirms the reschedule of the appointment
async function confirmReschedule() {
    if (newDateBox.value === "" || newTimeSelect.value === "") {
        showMessage(appointmentsMessage, "Please choose a new date and time", true);
        return;
    }
 
    const result = await callApi("/api/appointments/" + selectedAppointment.appointment_id + "/reschedule", "PUT",
        { date: newDateBox.value, time: newTimeSelect.value });
    if (!result.ok) {
        showMessage(appointmentsMessage, result.data.error, true);
        return;
    }
 
    await loadAppointments();
    showMessage(appointmentsMessage, result.data.message, false);
    fillTimes(timeSelect, doctorSelect.value, dateBox.value);
}
 
 
// Button handlers
document.getElementById("patient-search-button").addEventListener("click", searchPatients);
patientSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchPatients();
    }
});
patientSelect.addEventListener("change", patientPicked);
doctorSelect.addEventListener("change", doctorOrDateChanged);
dateBox.addEventListener("change", doctorOrDateChanged);
document.getElementById("book-button").addEventListener("click", bookAppointment);
document.getElementById("clear-button").addEventListener("click", clearBooking);
 
document.getElementById("reschedule-button").addEventListener("click", openReschedule);
document.getElementById("attended-button").addEventListener("click", function () { changeStatus("Attended"); });
document.getElementById("missed-button").addEventListener("click", function () { changeStatus("Missed"); });
document.getElementById("cancel-appointment-button").addEventListener("click", function () { changeStatus("Cancelled"); });
newDateBox.addEventListener("change", function () {
    fillTimes(newTimeSelect, selectedAppointment.doctor_id, newDateBox.value);
});
document.getElementById("confirm-reschedule-button").addEventListener("click", confirmReschedule);
document.getElementById("close-reschedule-button").addEventListener("click", function () {
    reschedulePanel.style.display = "none";
});
 
 
// Page opening and setup
async function setupPage() {
    dateBox.value = todayText();
    newDateBox.min = todayText();
 
    const user = await userReady;
    if (user.role !== "Receptionist" && user.role !== "Administrator") {
        document.getElementById("patient-part").style.display = "none";
        document.getElementById("booking-part").style.display = "none";
        document.getElementById("appointment-actions").style.display = "none";
    }
    loadDoctors();
}
 
setupPage();
