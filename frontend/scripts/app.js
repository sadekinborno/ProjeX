// Wait for the HTML document to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- CALL THE NEW FUNCTION HERE ---
  updateSidebarOnLoad();

  const authToken = localStorage.getItem("authToken");

  // If we are on a page other than login.html OR register.html and there's no token,
  // redirect to the login page.
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith("login.html");
  const isRegisterPage = currentPath.endsWith("register.html");

  if (!authToken && !isLoginPage && !isRegisterPage) {
    window.location.href = "login.html";
    return; // Stop further execution
  }

  // Select the form and error message elements from the DOM
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  // Check if the login form exists on the current page
  if (loginForm) {
    // Add an event listener to handle the form submission
    loginForm.addEventListener("submit", async (event) => {
      // Prevent the default form submission behavior which reloads the page
      event.preventDefault();

      // Clear any previous error messages
      errorMessage.textContent = "";

      // Get the username and password values from the form inputs
      const username = loginForm.username.value;
      const password = loginForm.password.value;

      try {
        // Send a POST request to the login API endpoint
        const response = await fetch("http://127.0.0.1:8000/api/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        // Check if the server responded with an error status
        if (!response.ok) {
          throw new Error("Invalid credentials. Please try again.");
        }

        // Parse the JSON data from the response
        const data = await response.json();

        // If login is successful, save the auth token in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // Store user info

        // Redirect the user to the main dashboard page
        window.location.href = "index.html";
      } catch (error) {
        // If an error occurs, display it in the error message paragraph
        errorMessage.textContent = error.message;
      }
    });
  }

  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errorMessage = document.getElementById("error-message");
      errorMessage.textContent = "";

      const username = registerForm.username.value;
      const email = registerForm.email.value;
      const password = registerForm.password.value;

      try {
        const response = await fetch("http://127.0.0.1:8000/api/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        if (!response.ok) {
          throw new Error("Registration failed. Username may already exist.");
        }
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // Store user info
        window.location.href = "index.html";
      } catch (error) {
        errorMessage.textContent = error.message;
      }
    });
  }

  const projectList = document.getElementById("project-list");

  // If the project-list element exists, we are on the dashboard page
  if (projectList) {
    fetchProjects();
  }

  const projectListContainer = document.getElementById("project-list");

  if (projectListContainer) {
    projectListContainer.addEventListener("click", (event) => {
      // Use event delegation to find which project card was clicked
      const clickedCard = event.target.closest(".project-card");
      if (clickedCard) {
        const projectId = clickedCard.dataset.projectId;
        // -- ADD THIS --
        // Get the project name from the card's h3 tag
        const projectName = clickedCard.querySelector("h3").textContent;
        // Save both ID and name to localStorage
        localStorage.setItem("selectedProjectId", projectId);
        localStorage.setItem("selectedProjectName", projectName);

        // Remove 'active' class from all other cards
        document.querySelectorAll(".project-card").forEach((card) => {
          card.classList.remove("active");
        });
        // Add 'active' class to the clicked card
        clickedCard.classList.add("active");

        // Refresh stats for the selected project
        if (typeof window.refreshStats === "function") {
          window.refreshStats();
        }

        // Fetch details for the selected project
        fetchAndDisplayProjectDetailsOnDashboard(projectId);
      }
    });
  }

  async function fetchAndDisplayProjectDetailsOnDashboard(projectId) {
    const authToken = localStorage.getItem("authToken");
    const detailsSection = document.getElementById("details-section");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/projects/${projectId}/`,
        {
          headers: { Authorization: `Token ${authToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch project details.");

      const project = await response.json();

      // Update sidebar with project name
      document.getElementById("selected-project-name").textContent =
        project.name;

      // Populate and show the details section
      const memberList = document.getElementById("dashboard-member-list");
      memberList.innerHTML = "";
      project.members.forEach((member) => {
        const li = document.createElement("li");
        li.textContent = `${member.username} (${member.role})`;
        memberList.appendChild(li);
      });

      const taskList = document.getElementById("dashboard-task-list");
      taskList.innerHTML = "";
      project.tasks.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = `${task.title} - Status: ${task.status}`;
        taskList.appendChild(li);
      });

      detailsSection.classList.remove("hidden");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const profileCloseBtn = document.querySelector(".profile-close");

  // This logic should run on pages where the profile button exists (the dashboard)
  if (profileBtn) {
    // Populate profile button and modal with stored user info
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      document.getElementById("profile-btn").textContent = user.username
        .charAt(0)
        .toUpperCase();
      document.getElementById("profile-username").textContent = user.username;
      document.getElementById("profile-email").textContent = user.email;
    }

    profileBtn.addEventListener("click", () => {
      profileModal.style.display = "block";
    });

    profileCloseBtn.addEventListener("click", () => {
      profileModal.style.display = "none";
    });
  }

  // --- MODAL HANDLING ---
  const newProjectBtn = document.querySelector(".section-header .btn");
  const modal = document.getElementById("new-project-modal");
  const closeBtn = document.querySelector(".close-btn");
  const newProjectForm = document.getElementById("new-project-form");

  if (newProjectBtn) {
    // When the user clicks the "+ New Project" button, open the modal
    newProjectBtn.addEventListener("click", () => {
      modal.style.display = "block";
    });
  }

  if (closeBtn) {
    // When the user clicks on <span> (x), close the modal
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // When the user clicks anywhere outside of the modal, close it
  window.addEventListener("click", (event) => {
    const taskModal = document.getElementById("new-task-modal");
    const memberModal = document.getElementById("add-member-modal");
    if (
      event.target == modal ||
      event.target == profileModal ||
      event.target == taskModal ||
      event.target == memberModal
    ) {
      if (modal) modal.style.display = "none";
      if (profileModal) profileModal.style.display = "none";
      if (taskModal) taskModal.style.display = "none";
      if (memberModal) memberModal.style.display = "none";
    }
  });

  if (newProjectForm) {
    newProjectForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Stop the form from reloading the page

      const projectName = document.getElementById("project-name").value;
      const projectType = document.getElementById("project-type").value;
      const authToken = localStorage.getItem("authToken");

      try {
        const response = await fetch("http://127.0.0.1:8000/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify({
            name: projectName,
            project_type: projectType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create project.");
        }

        // If successful:
        modal.style.display = "none"; // Close the modal
        newProjectForm.reset(); // Clear the form fields
        fetchProjects(); // Refresh the project list on the dashboard
      } catch (error) {
        console.error("Error creating project:", error);
        alert(error.message); // Show an error message
      }
    });
  }

  // --- NEW TASK MODAL LOGIC on Project Detail Page ---
  const newTaskBtn = document.getElementById("new-task-btn");
  const taskModal = document.getElementById("new-task-modal");
  const taskCloseBtn = document.querySelector(".task-close");
  const newTaskForm = document.getElementById("new-task-form");

  if (newTaskBtn) {
    newTaskBtn.addEventListener("click", () => {
      // Populate the dropdown before showing the modal
      const assigneesSelect = document.getElementById("task-assignees");
      assigneesSelect.innerHTML = ""; // Clear previous options
      if (window.currentProjectMembers) {
        window.currentProjectMembers.forEach((member) => {
          const option = document.createElement("option");
          option.value = member.username;
          option.textContent = member.username;
          assigneesSelect.appendChild(option);
        });
      }
      taskModal.style.display = "block";
    });
  }

  if (taskCloseBtn) {
    taskCloseBtn.addEventListener("click", () => {
      taskModal.style.display = "none";
    });
  }

  if (newTaskForm) {
    newTaskForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const projectId = new URLSearchParams(window.location.search).get("id");
      const authToken = localStorage.getItem("authToken");

      // Get selected assignees from the multi-select dropdown
      const selectedOptions =
        document.getElementById("task-assignees").selectedOptions;
      const assignees = Array.from(selectedOptions).map(
        (option) => option.value
      );

      const taskData = {
        title: document.getElementById("task-title").value,
        description: document.getElementById("task-description").value,
        due_date: document.getElementById("task-due-date").value || null,
        status: "To Do", // Default status
        assignees: assignees,
      };

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/projects/${projectId}/tasks/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(taskData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }

        taskModal.style.display = "none";
        newTaskForm.reset();
        fetchProjectDetails(); // Refresh the task list on the page
      } catch (error) {
        console.error("Error creating task:", error);
        alert(`Failed to create task: ${error.message}`);
      }
    });
  }

  // --- ADD MEMBER MODAL LOGIC on Project Detail Page ---
  const addMemberBtn = document.getElementById("add-member-btn");
  const memberModal = document.getElementById("add-member-modal");
  const memberCloseBtn = document.querySelector(".member-close");
  const addMemberForm = document.getElementById("add-member-form");

  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", () => {
      memberModal.style.display = "block";
    });
  }

  if (memberCloseBtn) {
    memberCloseBtn.addEventListener("click", () => {
      memberModal.style.display = "none";
    });
  }

  if (addMemberForm) {
    addMemberForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const projectId = new URLSearchParams(window.location.search).get("id");
      const authToken = localStorage.getItem("authToken");
      const username = document.getElementById("member-username").value;

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/projects/${projectId}/members/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify({ username: username }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          // This converts the JSON error object from the API into a readable string
          const errorMessage = Object.values(errorData).join("\n");
          throw new Error(errorMessage);
        }

        memberModal.style.display = "none";
        addMemberForm.reset();
        fetchProjectDetails(); // Refresh the member list on the page
      } catch (error) {
        console.error("Error adding member:", error);
        alert(`Failed to add member: ${error.message}`);
      }
    });
  }

  // Add an event listener to the whole project list to catch clicks on "Details" buttons
  const projectListContainerForDetails =
    document.getElementById("project-list");
  if (projectListContainerForDetails) {
    projectListContainerForDetails.addEventListener("click", (event) => {
      // Check if a details button was the target of the click
      if (event.target.classList.contains("btn-details")) {
        const card = event.target.closest(".project-card");
        if (card) {
          const projectId = card.dataset.projectId;
          // -- ADD THIS --
          const projectName = card.querySelector("h3").textContent;
          // Save both ID and name to localStorage before navigating
          localStorage.setItem("selectedProjectId", projectId);
          localStorage.setItem("selectedProjectName", projectName);
        }
      }
    });
  }

  // Check if we are on the project detail page
  // Project details are now handled by project-details.js

  // Check if we are on the "My Tasks" page
  const myTasksTableBody = document.getElementById("my-tasks-tbody");
  if (myTasksTableBody) {
    fetchMyTasks();
  }

  async function fetchMyTasks() {
    console.log("1. Starting to fetch tasks...");
    const authToken = localStorage.getItem("authToken");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/mytasks/", {
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!response.ok) throw new Error("Could not fetch your tasks.");

      const tasks = await response.json();
      console.log("2. Successfully fetched tasks from API:", tasks);

      // Store tasks globally for kanban view
      window.myTasksData = tasks;

      displayMyTasks(tasks);
    } catch (error) {
      console.error("Error during fetch:", error);
      const tableBody = document.getElementById("my-tasks-tbody");
      if (tableBody) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = error.message;
        cell.style.textAlign = "center";
      }
    }
  }

  function displayMyTasks(tasks) {
    console.log("3. displayMyTasks function was called with:", tasks); // Checkpoint 3

    const tableBody = document.getElementById("my-tasks-tbody");
    if (!tableBody) {
      console.error(
        "Error: Could not find the element with ID 'my-tasks-tbody'."
      );
      return;
    }

    tableBody.innerHTML = ""; // Clear any existing rows

    if (tasks.length === 0) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5; // Span across all 5 columns
      cell.textContent = "You have no tasks assigned to you.";
      cell.style.textAlign = "center";
      return;
    }

    tasks.forEach((task) => {
      console.log("4. Processing and creating a row for task:", task.title); // Checkpoint 4
      const row = tableBody.insertRow();

      row.insertCell().textContent = task.title;
      row.insertCell().textContent = task.project_name;
      row.insertCell().textContent = task.assignees.join(", ");
      const dueDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString()
        : "N/A";
      row.insertCell().textContent = dueDate;
      const statusCell = row.insertCell();
      const statusBadge = document.createElement("span");
      statusBadge.className = `status-badge status-${task.status
        .toLowerCase()
        .replace(" ", "-")}`;
      statusBadge.textContent = task.status;
      statusCell.appendChild(statusBadge);
    });

    // Update calendar if it exists
    if (window.updateCalendar) {
      window.updateCalendar();
    }
  }

  // Project detail functions moved to project-details.js

  function displayProjects(projects) {
    const projectList = document.getElementById("project-list");
    projectList.innerHTML = ""; // Clear the container first

    if (projects.length === 0) {
      projectList.innerHTML =
        "<p>You are not a member of any projects yet.</p>";
      return;
    }

    projects.forEach((project) => {
      // The card is now a div, not a link
      const projectCard = document.createElement("div");
      projectCard.className = "project-card";
      // We add a data attribute to easily identify which project was clicked
      projectCard.dataset.projectId = project.id;

      projectCard.innerHTML = `
              <h3>${project.name}</h3>
              <p>${project.project_type}</p>
              <div class="card-footer">
                  <span>Created by: ${project.created_by}</span>
                  <a href="project.html?id=${project.id}" class="btn-details">Details</a>
              </div>
          `;
      projectList.appendChild(projectCard);
    });
  }

  async function fetchProjects() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/projects/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not fetch projects. Please log in again.");
      }

      const projects = await response.json();
      displayProjects(projects);

      // -- ADD THIS LOGIC --
      // After displaying, check if a project needs to be highlighted
      const selectedProjectId = localStorage.getItem("selectedProjectId");
      if (selectedProjectId) {
        const cardToSelect = document.querySelector(
          `.project-card[data-project-id="${selectedProjectId}"]`
        );
        if (cardToSelect) {
          cardToSelect.classList.add("active");
          // Also update the sidebar and show details for the sticky selection
          fetchAndDisplayProjectDetailsOnDashboard(selectedProjectId);
        }
      }
      // -- END OF ADDED LOGIC --
    } catch (error) {
      console.error("Error:", error);
      logout();
    }
  }

  function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  }

  function updateSidebarOnLoad() {
    const selectedProjectName = localStorage.getItem("selectedProjectName");
    const projectNameElement = document.getElementById("selected-project-name");

    if (projectNameElement && selectedProjectName) {
      projectNameElement.textContent = selectedProjectName;
    }
  }

  // Settings navigation handler
  const settingsLink = document.getElementById("settings-link");
  if (settingsLink) {
    settingsLink.addEventListener("click", async function (e) {
      e.preventDefault();
      const projectId = localStorage.getItem("selectedProjectId");
      const authToken = localStorage.getItem("authToken");

      if (!projectId) {
        alert("Please select a project first");
        return;
      }

      try {
        console.log("Checking admin status..."); // Debug log
        const response = await fetch(
          `http://127.0.0.1:8000/api/projects/${projectId}/check-admin/`,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        console.log("Admin check response:", data); // Debug log

        if (data.is_admin) {
          window.location.href = `settings.html?id=${projectId}`;
        } else {
          alert("Only project creators and admins can access settings");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to verify admin status. Please try again.");
      }
    });
  }

  // Project settings form handler
  const projectDetailsForm = document.getElementById("project-details-form");
  if (projectDetailsForm) {
    projectDetailsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const projectId = new URLSearchParams(window.location.search).get("id");
      const authToken = localStorage.getItem("authToken");

      // Get the submit button to show loading state
      const submitButton = projectDetailsForm.querySelector(
        'button[type="submit"]'
      );
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/projects/${projectId}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify({
              name: document.getElementById("project-name").value,
              project_type: document.getElementById("project-type").value,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Failed to update project details"
          );
        }

        const updatedProject = await response.json();

        // Update sidebar and localStorage
        const newProjectName = updatedProject.name;
        localStorage.setItem("selectedProjectName", newProjectName);
        document.getElementById("selected-project-name").textContent =
          newProjectName;

        // Show success message
        submitButton.textContent = "✓ Saved!";
        submitButton.classList.add("bg-green-600");
        submitButton.classList.remove("bg-blue-600");

        // Reset button after 2 seconds
        setTimeout(() => {
          submitButton.textContent = originalButtonText;
          submitButton.classList.remove("bg-green-600");
          submitButton.classList.add("bg-blue-600");
          submitButton.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to update project details: " + error.message);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }

  // Delete project handler
  const deleteProjectBtn = document.getElementById("delete-project-btn");
  if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener("click", async function () {
      if (
        confirm(
          "Are you sure you want to delete this project? This action cannot be undone."
        )
      ) {
        const projectId = new URLSearchParams(window.location.search).get("id");
        const authToken = localStorage.getItem("authToken");

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/api/projects/${projectId}/`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Token ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to delete project");
          }

          // Clear project from localStorage and redirect
          localStorage.removeItem("selectedProjectId");
          localStorage.removeItem("selectedProjectName");
          window.location.href = "index.html";
        } catch (error) {
          console.error("Error:", error);
          alert("Failed to delete project");
        }
      }
    });
  }

  // Task creation/edit form handler
  const taskSettingsForm = document.getElementById("task-settings-form");
  if (taskSettingsForm) {
    taskSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const projectId = new URLSearchParams(window.location.search).get("id");
      const authToken = localStorage.getItem("authToken");
      const taskId = document.getElementById("task-id").value;
      const isEditing = taskId !== "";

      // Get the submit button to show loading state
      const submitButton = taskSettingsForm.querySelector(
        'button[type="submit"]'
      );
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = isEditing ? "Updating..." : "Creating...";

      try {
        const taskTitle = document.getElementById("task-title").value.trim();
        const taskStatus = document.getElementById("task-section").value;
        const taskPriority = document.getElementById("task-priority").value;
        const taskDescription = document
          .getElementById("task-description")
          .value.trim();
        const taskAssignee = document.getElementById("task-assignee").value;
        const taskDueDate = document.getElementById("task-due-date").value;

        if (!taskTitle) {
          throw new Error("Task title is required");
        }

        const taskData = {
          title: taskTitle,
          status: taskStatus,
          priority: taskPriority,
          description: taskDescription,
          assignees: taskAssignee ? [taskAssignee] : [],
          due_date: taskDueDate || null,
        };

        // Determine URL and method based on whether we're editing or creating
        const url = isEditing
          ? `http://127.0.0.1:8000/api/tasks/${taskId}/`
          : `http://127.0.0.1:8000/api/projects/${projectId}/tasks/`;
        const method = isEditing ? "PATCH" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail ||
              `Failed to ${isEditing ? "update" : "create"} task`
          );
        }

        const savedTask = await response.json();

        // Show success message
        submitButton.textContent = isEditing ? "✓ Updated!" : "✓ Task Created!";
        submitButton.classList.add("bg-green-600");
        if (isEditing) {
          submitButton.classList.remove("bg-blue-600");
        }

        // Reset form after success
        setTimeout(() => {
          taskSettingsForm.reset();
          document.getElementById("task-id").value = "";
          document.getElementById("form-title").textContent = "Create New Task";
          document.getElementById("task-cancel-btn").classList.add("hidden");
          submitButton.textContent = "Create Task";
          submitButton.classList.remove("bg-green-600", "bg-blue-600");
          submitButton.classList.add("bg-green-600");
          submitButton.disabled = false;

          // Reload tasks list
          loadProjectTasks(projectId);

          alert(
            `Task "${savedTask.title}" ${
              isEditing ? "updated" : "created"
            } successfully!`
          );
        }, 1500);
      } catch (error) {
        console.error("Error:", error);
        alert(
          `Failed to ${isEditing ? "update" : "create"} task: ` + error.message
        );
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }

  // Task cancel button handler
  const taskCancelBtn = document.getElementById("task-cancel-btn");
  if (taskCancelBtn) {
    taskCancelBtn.addEventListener("click", () => {
      // Reset form
      document.getElementById("task-settings-form").reset();
      document.getElementById("task-id").value = "";
      document.getElementById("form-title").textContent = "Create New Task";
      document.getElementById("task-submit-btn").textContent = "Create Task";
      document
        .getElementById("task-submit-btn")
        .classList.remove("bg-blue-600");
      document.getElementById("task-submit-btn").classList.add("bg-green-600");
      taskCancelBtn.classList.add("hidden");
    });
  }

  // Timeline form handler
  const timelineForm = document.getElementById("timeline-form");
  if (timelineForm) {
    timelineForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const projectId = new URLSearchParams(window.location.search).get("id");
      const authToken = localStorage.getItem("authToken");

      // Get the submit button to show loading state
      const submitButton = timelineForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Updating...";

      try {
        const startDate = document.getElementById("project-start-date").value;
        const endDate = document.getElementById("project-end-date").value;

        // Validate dates
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          throw new Error("Start date cannot be after end date");
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/projects/${projectId}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify({
              start_date: startDate || null,
              end_date: endDate || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update timeline");
        }

        const updatedProject = await response.json();

        // Show success message
        submitButton.textContent = "✓ Updated!";
        submitButton.classList.add("bg-green-600");
        submitButton.classList.remove("bg-blue-600");

        // Reset button after 2 seconds
        setTimeout(() => {
          submitButton.textContent = originalButtonText;
          submitButton.classList.remove("bg-green-600");
          submitButton.classList.add("bg-blue-600");
          submitButton.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to update timeline: " + error.message);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }

  // Initialize settings page if we're on it
  if (window.location.pathname.includes("settings.html")) {
    const projectId = new URLSearchParams(window.location.search).get("id");
    if (!projectId) {
      window.location.href = "index.html";
      return;
    }
    initializeSettings(projectId);
  }
});

// Move initialization function outside the event listener
async function initializeSettings(projectId) {
  const authToken = localStorage.getItem("authToken");

  // First check if user has admin access
  try {
    console.log("Checking admin access..."); // Debug log
    const adminCheckResponse = await fetch(
      `http://127.0.0.1:8000/api/projects/${projectId}/check-admin/`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    const adminData = await adminCheckResponse.json();
    console.log("Admin check response:", adminData); // Debug log

    if (!adminCheckResponse.ok || !adminData.is_admin) {
      alert(
        "Access denied. Only project creators and admins can access settings."
      );
      window.location.href = "index.html";
      return;
    }
  } catch (error) {
    console.error("Error checking admin access:", error);
    alert("Failed to verify admin status. Please try again.");
    window.location.href = "index.html";
    return;
  }

  // If admin check passed, load project settings
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/projects/${projectId}/`,
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load project settings");
    }

    const project = await response.json();

    // Update form fields
    document.getElementById("project-name").value = project.name;
    document.getElementById("project-type").value = project.project_type;
    document.getElementById("selected-project-name").textContent = project.name;

    // Update timeline fields if they exist
    if (project.start_date) {
      document.getElementById("project-start-date").value = project.start_date;
    }
    if (project.end_date) {
      document.getElementById("project-end-date").value = project.end_date;
    }

    // Update assignee dropdown if it exists
    const assigneeSelect = document.getElementById("task-assignee");
    if (assigneeSelect && project.members) {
      assigneeSelect.innerHTML = ""; // Clear existing options

      // Add member options
      project.members.forEach((member) => {
        const option = document.createElement("option");
        option.value = member.username;
        option.textContent = `${member.username} (${member.role})`;
        assigneeSelect.appendChild(option);
      });
    }

    // Load tasks for this project
    loadProjectTasks(projectId);
  } catch (error) {
    console.error("Error loading project settings:", error);
    alert("Failed to load project settings");
    window.location.href = "index.html";
  }
}

// Function to load and display tasks
async function loadProjectTasks(projectId) {
  const authToken = localStorage.getItem("authToken");
  const tasksList = document.getElementById("tasks-list");

  if (!tasksList) return;

  try {
    tasksList.innerHTML =
      '<p class="text-gray-500 text-sm">Loading tasks...</p>';

    const response = await fetch(
      `http://127.0.0.1:8000/api/projects/${projectId}/tasks/`,
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load tasks");
    }

    const tasks = await response.json();

    if (tasks.length === 0) {
      tasksList.innerHTML =
        '<p class="text-gray-500 text-sm">No tasks yet. Create one below!</p>';
      return;
    }

    // Display tasks
    tasksList.innerHTML = tasks
      .map((task) => {
        const priorityColors = {
          low: "bg-blue-100 text-blue-800",
          medium: "bg-yellow-100 text-yellow-800",
          high: "bg-red-100 text-red-800",
        };
        const statusColors = {
          "To Do": "bg-gray-100 text-gray-800",
          "In Progress": "bg-blue-100 text-blue-800",
          Done: "bg-green-100 text-green-800",
        };

        return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-medium text-gray-900">${task.title}</h4>
              <span class="px-2 py-1 text-xs rounded ${
                priorityColors[task.priority] || "bg-gray-100 text-gray-800"
              }">${task.priority || "medium"}</span>
              <span class="px-2 py-1 text-xs rounded ${
                statusColors[task.status] || "bg-gray-100 text-gray-800"
              }">${task.status}</span>
            </div>
            ${
              task.description
                ? `<p class="text-sm text-gray-600">${task.description}</p>`
                : ""
            }
            <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
              ${
                task.assignees && task.assignees.length > 0
                  ? `<span>👤 ${task.assignees.join(", ")}</span>`
                  : ""
              }
              ${task.due_date ? `<span>📅 ${task.due_date}</span>` : ""}
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button onclick="editTask(${
              task.id
            })" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50">
              Edit
            </button>
            <button onclick="deleteTask(${task.id}, '${
          task.title
        }')" class="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50">
              Delete
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasksList.innerHTML =
      '<p class="text-red-500 text-sm">Failed to load tasks</p>';
  }
}

// Function to edit a task
async function editTask(taskId) {
  const authToken = localStorage.getItem("authToken");

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load task details");
    }

    const task = await response.json();

    // Populate form with task data
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-section").value = task.status;
    document.getElementById("task-priority").value = task.priority || "medium";
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-due-date").value = task.due_date || "";

    // Set assignee if exists
    if (task.assignees && task.assignees.length > 0) {
      document.getElementById("task-assignee").value = task.assignees[0];
    }

    // Update form UI
    document.getElementById("form-title").textContent = "Edit Task";
    document.getElementById("task-submit-btn").textContent = "Update Task";
    document.getElementById("task-submit-btn").classList.remove("bg-green-600");
    document.getElementById("task-submit-btn").classList.add("bg-blue-600");
    document.getElementById("task-cancel-btn").classList.remove("hidden");

    // Scroll to form
    document
      .getElementById("task-settings-form")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error loading task:", error);
    alert("Failed to load task details");
  }
}

// Function to delete a task
async function deleteTask(taskId, taskTitle) {
  if (
    !confirm(
      `Are you sure you want to delete the task "${taskTitle}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  const authToken = localStorage.getItem("authToken");
  const projectId = new URLSearchParams(window.location.search).get("id");

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    alert(`Task "${taskTitle}" deleted successfully!`);

    // Reload tasks list
    loadProjectTasks(projectId);
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task");
  }
}
