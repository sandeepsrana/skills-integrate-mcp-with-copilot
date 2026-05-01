document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const userIcon = document.getElementById("user-icon");
  const authPanel = document.getElementById("auth-panel");
  const authButton = document.getElementById("auth-button");
  const authStatus = document.getElementById("auth-status");
  const teacherOnlyNote = document.getElementById("teacher-only-note");
  const signupContainer = document.getElementById("signup-container");

  let teacherAuth = localStorage.getItem("teacherAuth") || "";

  function getAuthHeaders() {
    return teacherAuth ? { Authorization: teacherAuth } : {};
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function setTeacherUI() {
    const isTeacher = Boolean(teacherAuth);
    signupForm.classList.toggle("hidden", !isTeacher);
    teacherOnlyNote.classList.toggle("hidden", isTeacher);
    authButton.textContent = isTeacher ? "Logout" : "Teacher Login";
    authStatus.textContent = isTeacher
      ? "Logged in as teacher"
      : "Not logged in";
    signupContainer.querySelector("h3").textContent = isTeacher
      ? "Register Student for an Activity"
      : "Teacher Actions";
  }

  function promptForCredentials() {
    const username = window.prompt("Teacher username:");
    if (!username) {
      return null;
    }

    const password = window.prompt("Teacher password:");
    if (!password) {
      return null;
    }

    return btoa(`${username}:${password}`);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      const isTeacher = Boolean(teacherAuth);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isTeacher
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  userIcon.addEventListener("click", () => {
    authPanel.classList.toggle("hidden");
  });

  authButton.addEventListener("click", async () => {
    if (teacherAuth) {
      teacherAuth = "";
      localStorage.removeItem("teacherAuth");
      setTeacherUI();
      fetchActivities();
      showMessage("Logged out.", "info");
      return;
    }

    const encodedCredentials = promptForCredentials();
    if (!encodedCredentials) {
      return;
    }

    const authHeader = `Basic ${encodedCredentials}`;

    try {
      const response = await fetch("/auth/login", {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Login failed.", "error");
        return;
      }

      teacherAuth = authHeader;
      localStorage.setItem("teacherAuth", teacherAuth);
      setTeacherUI();
      fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Login failed. Please try again.", "error");
    }
  });

  // Initialize app
  setTeacherUI();
  fetchActivities();
});
