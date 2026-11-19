// Sunrise Community Clinic
// patients.js - makes the patients page work: search, register, update and clear.
// By Ronald Chinnasamy

// Used by patients.html.
// The back end routes are in patients.py

const searchBox = document.getElementById("search-box");
const searchMessage = document.getElementById("search-message");
const resultsBody = document.getElementById("results-body");
const formSection = document.getElementById("patient-form-section");
const formTitle = document.getElementById("form-title");
const patientForm = document.getElementById("patient-form");
const saveButton = document.getElementById("save-button");
const formMessage = document.getElementById("form-message");

// holds the PatientID of the patient being edited, or null if registering a new patient
let editingId = null;

// true if the logged in user is allowed to edit patients (Receptionist or Administrator)
let canEdit = false;

function showFormMessage(text, isError) {
    formMessage.textContent = text;
    if (isError) {
        formMessage.className = "error-text";
    } else {
        formMessage.className = "success-text";
    }
}

// resets the form to be ready to register a new patient
function clearForm() {
    patientForm.reset();
    editingId = null;
    formTitle.textContent = "Register New Patient";
    saveButton.textContent = "Save Patient";
}


// Populates the form with the patient's details so that it can be updated
function editPatient(patient) {
    editingId = patient.PatientID;
    document.getElementById("first-name").value = patient.FirstName;
    document.getElementById("surname").value = patient.Surname;
    document.getElementById("id-number").value = patient.IDNumber;
    document.getElementById("address").value = patient.Address;
    document.getElementById("contact-number").value = patient.ContactNumber;

    formTitle.textContent = "Update Patient";
    saveButton.textContent = "Update Patient";
    formMessage.textContent = "";
    formSection.scrollIntoView();
}


// Adds one row to the results table
function addResultRow(patient) {
    const row = document.createElement("tr");

    const values = [patient.FirstName + " " + patient.Surname, patient.IDNumber,
                    patient.Address, patient.ContactNumber];
    for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    }

    // The last cell holds the Edit button (not shown to Doctors and Nurses)
    const buttonCell = document.createElement("td");
    if (canEdit) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "button-grey";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editPatient(patient);
        });
        buttonCell.appendChild(editButton);
    }
    row.appendChild(buttonCell);

    resultsBody.appendChild(row);
}


// Searches for patients by name or ID number and shows the results
async function searchPatients() {
    searchMessage.textContent = "";
    resultsBody.innerHTML = "";

    const text = encodeURIComponent(searchBox.value.trim());
    const result = await callApi("/api/patients?search=" + text);

    if (!result.ok) {
        searchMessage.textContent = result.data.error;
        return;
    }
    if (result.data.length === 0) {
        searchMessage.textContent = "No patients found";
        return;
    }
    for (const patient of result.data) {
        addResultRow(patient);
    }
}


// Saves the form: registers a new patient, or updates the one being edited
async function savePatient(event) {
    event.preventDefault();
    formMessage.textContent = "";

    const details = {
        first_name: document.getElementById("first-name").value,
        surname: document.getElementById("surname").value,
        id_number: document.getElementById("id-number").value,
        address: document.getElementById("address").value,
        contact_number: document.getElementById("contact-number").value
    };

    let result;
    if (editingId === null) {
        result = await callApi("/api/patients", "POST", details);
    } else {
        result = await callApi("/api/patients/" + editingId, "PUT", details);
    }

    if (!result.ok) {
        showFormMessage(result.data.error, true);
        return;
    }

    // It worked: empty the form, show the message and refresh the results if a search is showing
    clearForm();
    showFormMessage(result.data.message, false);
    if (searchBox.value.trim() !== "") {
        searchPatients();
    }
}


// Connect the buttons to the functions above
document.getElementById("search-button").addEventListener("click", searchPatients);
searchBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchPatients();
    }
});
patientForm.addEventListener("submit", savePatient);
document.getElementById("clear-button").addEventListener("click", function () {
    clearForm();
    formMessage.textContent = "";
});


// When the page opens, check the user's role and hide the form from Doctors and Nurses
async function setupPage() {
    const user = await userReady;
    if (user.role === "Receptionist" || user.role === "Administrator") {
        canEdit = true;
    } else {
        formSection.style.display = "none";
    }
}

setupPage();
