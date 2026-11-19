// Sunrise Community Clinic
// login.js - controls login page behavior
// By Ronald Chinnasamy
//
// Used by login.html 
// The back end route is /api/login (auth.py).

// The page each role is taken to after a successful login
const homePages = {
    "Receptionist": "patients.html",
    "Doctor": "patients.html",
    "Nurse": "patients.html",
    "Administrator": "admin.html"
};

const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorMessage.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password })
        });
        const data = await response.json();

        if (response.ok) {
            window.location.href = homePages[data.role];
        } else {            
            errorMessage.textContent = data.error;
        }
    } catch (error) {
        errorMessage.textContent = "Cannot reach the system. Please try again.";
    }
});
