// Sunrise Community Clinic
// common.js - code shared by every page after login.
// By Ronald Chinnasamy


// Sends a request to the back end and returns { ok, data }.
// If the user is not logged in (or the session timed out) it sends them to the login page.
async function callApi(url, method = "GET", body = null) {
    const options = { method: method, headers: { "Content-Type": "application/json" } };
    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.status === 401) {
        window.location.href = "login.html";
    }
    return { ok: response.ok, data: data };
}

// Shows logged in user's role in the top bar, and returns the users info
async function loadUser() {
    const result = await callApi("/api/me");
    if (result.ok) {
        document.getElementById("user-role").textContent = result.data.role;
    }
    const adminTab = document.getElementById("admin-tab");
    if (adminTab !== null && result.data.role !== "Administrator") {
        adminTab.style.display = "none";
    }    
    const visitsTab = document.getElementById("visits-tab");
    if (visitsTab !== null && result.data.role !== "Doctor" && result.data.role !== "Nurse") {
        visitsTab.style.display = "none";
    }
    const reportsTab = document.getElementById("reports-tab");
    if (reportsTab !== null && result.data.role !== "Administrator" && result.data.role !== "Receptionist") {
        reportsTab.style.display = "none";
    }
    return result.data;
}

const userReady = loadUser();

// Log out and redirect to the login page
document.getElementById("logout-link").addEventListener("click", async function (event) {
    event.preventDefault();
    await callApi("/api/logout", "POST");
    window.location.href = "login.html";
});
