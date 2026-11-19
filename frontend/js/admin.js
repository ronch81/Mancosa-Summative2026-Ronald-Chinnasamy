// Sunrise Community Clinic
// admin.js - makes the administration page work: list, add, edit and deactivate users,
// and set doctor availability.
// By Ronald Chinnasamy
//
// Used by admin.html
// The back end routes are in users.py (users) and appointments.py (doctor availability)
 
const listMessage = document.getElementById("list-message");
const usersBody = document.getElementById("users-body");
const formTitle = document.getElementById("form-title");
const userForm = document.getElementById("user-form");
const usernameBox = document.getElementById("username");
const passwordLabel = document.getElementById("password-label");
const statusField = document.getElementById("status-field");
const saveButton = document.getElementById("save-button");
const formMessage = document.getElementById("form-message");
 
// Holds the UserID of the user being edited, or null if adding a new user
let editingId = null;
 
// Errorhandling
function showFormMessage(text, isError) {
    formMessage.textContent = text;
    if (isError) {
        formMessage.className = "error-text";
    } else {
        formMessage.className = "success-text";
    }
}
 
 
// Resets the form
function clearForm() {
    userForm.reset();
    editingId = null;
    usernameBox.disabled = false;
    passwordLabel.textContent = "Password *";
    statusField.style.display = "none";
    formTitle.textContent = "Add New User";
    saveButton.textContent = "Save User";
}
 
 
// Populates the form with the user's details so that it can be updated
function editUser(user) {
    editingId = user.UserID;
    document.getElementById("full-name").value = user.FullName;
    usernameBox.value = user.Username;
    usernameBox.disabled = true;               // usernames cannot be changed
    document.getElementById("role").value = user.Role;
    document.getElementById("password").value = "";
    document.getElementById("status").value = user.IsActive ? "active" : "inactive";
 
    passwordLabel.textContent = "New Password (leave empty to keep the current one)";
    statusField.style.display = "block";
    formTitle.textContent = "Edit User";
    saveButton.textContent = "Update User";
    formMessage.textContent = "";
    userForm.scrollIntoView();
}
 
// Adds a new row to the users table
function addUserRow(user) {
    const row = document.createElement("tr");
 
    let status = "Inactive";
    if (user.IsActive) {
        status = "Active";
    }
 
    const values = [user.FullName, user.Username, user.Role, status];
    for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    }
 
    const buttonCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "button-grey";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
        editUser(user);
    });
    buttonCell.appendChild(editButton);
    row.appendChild(buttonCell);
 
    usersBody.appendChild(row);
}
 
 
// Displays all users in a table
async function loadUsers() {
    listMessage.textContent = "";
    usersBody.innerHTML = "";
 
    const result = await callApi("/api/users");
    if (!result.ok) {
        listMessage.textContent = result.data.error;
        return;
    }
    for (const user of result.data) {
        addUserRow(user);
    }
}
 
 
// Save features
async function saveUser(event) {
    event.preventDefault();
    formMessage.textContent = "";
 
    const fullName = document.getElementById("full-name").value;
    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;
 
    let result;
    if (editingId === null) {
        result = await callApi("/api/users", "POST", {
            full_name: fullName,
            username: usernameBox.value,
            password: password,
            role: role
        });
    } else {
        result = await callApi("/api/users/" + editingId, "PUT", {
            full_name: fullName,
            role: role,
            password: password,
            is_active: document.getElementById("status").value === "active"
        });
    }
 
    if (!result.ok) {
        showFormMessage(result.data.error, true);
        return;
    }
 
    // Clear the form, show a success message, and reload the users list and the doctor list
    clearForm();
    showFormMessage(result.data.message, false);
    loadUsers();
    loadDoctors();
}
 
 

// Doctor availability

 
const doctorSelect = document.getElementById("doctor-select");
const availabilityBody = document.getElementById("availability-body");
const availabilityMessage = document.getElementById("availability-message");
 
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
 
// stores the start and end time boxes for each day of the week, so they can be filled in when a doctor is chosen
const timeBoxes = {};
 
 
// Error handling for the availability section
function showAvailabilityMessage(text, isError) {
    availabilityMessage.textContent = text;
    if (isError) {
        availabilityMessage.className = "error-text";
    } else {
        availabilityMessage.className = "success-text";
    }
}
 
 
// Creates an availability table with a row for each day of the week, and start and end time boxes in each row
function buildAvailabilityTable() {
    for (const day of DAYS) {
        const row = document.createElement("tr");
 
        const dayCell = document.createElement("td");
        dayCell.textContent = day;
        row.appendChild(dayCell);
 
        // Start time and end time boxes
        const startBox = document.createElement("input");
        startBox.type = "time";
        const endBox = document.createElement("input");
        endBox.type = "time";
        timeBoxes[day] = { start: startBox, end: endBox };
 
        const startCell = document.createElement("td");
        startCell.appendChild(startBox);
        row.appendChild(startCell);
 
        const endCell = document.createElement("td");
        endCell.appendChild(endBox);
        row.appendChild(endCell);
 
        // Save and Remove buttons
        const buttonCell = document.createElement("td");
 
        const saveDayButton = document.createElement("button");
        saveDayButton.type = "button";
        saveDayButton.className = "button-orange";
        saveDayButton.textContent = "Save";
        saveDayButton.addEventListener("click", function () {
            saveDay(day);
        });
        buttonCell.appendChild(saveDayButton);
 
        const removeDayButton = document.createElement("button");
        removeDayButton.type = "button";
        removeDayButton.className = "button-grey";
        removeDayButton.style.marginLeft = "8px";
        removeDayButton.textContent = "Remove";
        removeDayButton.addEventListener("click", function () {
            removeDay(day);
        });
        buttonCell.appendChild(removeDayButton);
 
        row.appendChild(buttonCell);
        availabilityBody.appendChild(row);
    }
}
 
 
// Loads active doctors into the select box
async function loadDoctors() {
    const chosen = doctorSelect.value;
 
    const result = await callApi("/api/doctors");
    if (!result.ok) {
        showAvailabilityMessage(result.data.error, true);
        return;
    }
 
    doctorSelect.innerHTML = "";
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Select doctor";
    doctorSelect.appendChild(firstOption);
 
    for (const doctor of result.data) {
        const option = document.createElement("option");
        option.value = doctor.UserID;
        option.textContent = doctor.FullName;
        doctorSelect.appendChild(option);
    }
 
    doctorSelect.value = chosen;
    loadAvailability();
}
 
 
// Show doctor times
async function loadAvailability() {
    availabilityMessage.textContent = "";
 
    // Empty every box first
    for (const day of DAYS) {
        timeBoxes[day].start.value = "";
        timeBoxes[day].end.value = "";
    }
 
    if (doctorSelect.value === "") {
        return;
    }
 
    const result = await callApi("/api/availability/" + doctorSelect.value);
    if (!result.ok) {
        showAvailabilityMessage(result.data.error, true);
        return;
    }
    for (const entry of result.data) {
        timeBoxes[entry.day_of_week].start.value = entry.start_time;
        timeBoxes[entry.day_of_week].end.value = entry.end_time;
    }
}
 
 
// Saves day times
async function saveDay(day) {
    availabilityMessage.textContent = "";
    if (doctorSelect.value === "") {
        showAvailabilityMessage("Please select a doctor", true);
        return;
    }
 
    const result = await callApi("/api/availability/" + doctorSelect.value, "PUT", {
        day_of_week: day,
        start_time: timeBoxes[day].start.value,
        end_time: timeBoxes[day].end.value
    });
 
    if (!result.ok) {
        showAvailabilityMessage(day + ": " + result.data.error, true);
        return;
    }
    showAvailabilityMessage(day + ": " + result.data.message, false);
}
 
 
// Removes a day so a doctor doesnt need to work on that day
async function removeDay(day) {
    availabilityMessage.textContent = "";
    if (doctorSelect.value === "") {
        showAvailabilityMessage("Please select a doctor", true);
        return;
    }
 
    const result = await callApi("/api/availability/" + doctorSelect.value + "/" + day, "DELETE");
 
    if (!result.ok) {
        showAvailabilityMessage(day + ": " + result.data.error, true);
        return;
    }
    timeBoxes[day].start.value = "";
    timeBoxes[day].end.value = "";
    showAvailabilityMessage(day + ": " + result.data.message, false);
}
 
 
// Button handling
userForm.addEventListener("submit", saveUser);
document.getElementById("clear-button").addEventListener("click", function () {
    clearForm();
    formMessage.textContent = "";
});
doctorSelect.addEventListener("change", loadAvailability);
 
 
// user handling
async function setupPage() {
    const user = await userReady;
    if (user.role !== "Administrator") {
        window.location.href = "patients.html";
        return;
    }
    buildAvailabilityTable();
    loadUsers();
    loadDoctors();
}
 
setupPage();