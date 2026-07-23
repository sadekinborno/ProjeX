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
      const sidebarName = document.getElementById("selected-project-name");
      if (sidebarName) sidebarName.textContent = project.name;

      // Update inspector title and link
      const inspectorTitle = document.getElementById("inspector-project-name");
      if (inspectorTitle) inspectorTitle.textContent = project.name;
      const inspectorLink = document.getElementById("inspector-open-link");
      if (inspectorLink) inspectorLink.href = `project.html?id=${project.id}`;

      // Populate and show the details section
      const memberList = document.getElementById("dashboard-member-list");
      memberList.innerHTML = "";
      if ((project.members || []).length === 0) {
        memberList.innerHTML = '<li style="color:var(--text-3); font-size:0.78rem;">No team members assigned yet.</li>';
      } else {
        (project.members || []).forEach((member) => {
          const li = document.createElement("li");
          const initial = (member.username || 'U').charAt(0).toUpperCase();
          li.innerHTML = `
            <div class="avatar-chip">
              <div class="avatar-chip-left">
                <div class="chip-circle">${initial}</div>
                <span class="chip-name">${member.username}</span>
              </div>
              <span class="chip-role">${member.role || 'Member'}</span>
            </div>
          `;
          memberList.appendChild(li);
        });
      }

      const taskList = document.getElementById("dashboard-task-list");
      taskList.innerHTML = "";
      if ((project.tasks || []).length === 0) {
        taskList.innerHTML = '<li style="color:var(--text-3); font-size:0.78rem;">No active tasks found.</li>';
      } else {
        project.tasks.forEach((task) => {
          const li = document.createElement("li");
          const rawStatus = (task.status || 'To Do').toLowerCase();
          let tagClass = 'task-tag-todo';
          if (rawStatus.includes('done') || rawStatus.includes('complete')) {
            tagClass = 'task-tag-done';
          } else if (rawStatus.includes('progress')) {
            tagClass = 'task-tag-in-progress';
          }
          li.innerHTML = `
            <div class="task-chip">
              <span class="task-chip-title">${task.title}</span>
              <span class="task-status-tag ${tagClass}">
                <span class="status-dot"></span>
                ${task.status}
              </span>
            </div>
          `;
          taskList.appendChild(li);
        });
      }

      detailsSection.classList.remove("hidden");
      const placeholder = document.getElementById("inspector-placeholder");
      if (placeholder) placeholder.classList.add("hidden");
    } catch (error) {
      console.error(error);
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
      profileModal.style.display = "flex";
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
      modal.style.display = "flex";
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
      taskModal.style.display = "flex";
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

  // --- TEAM MEMBERS SECTION & MODAL LOGIC ---
  const addMemberBtn = document.getElementById("add-member-btn");
  const memberModal = document.getElementById("add-member-modal");
  const memberCloseBtn = document.querySelector(".member-close");
  const addMemberForm = document.getElementById("add-member-form");
  const modalProjectSelect = document.getElementById("modal-project-select");
  const modalProjectSelectWrap = document.getElementById("modal-project-select-wrap");

  // Function to load and render member list inside the modal
  async function loadModalMembers(projectId) {
    const modalMemberList = document.getElementById("modal-member-list");
    if (!modalMemberList) return;

    if (!projectId) {
      modalMemberList.innerHTML = '<li style="color:var(--text-3, #71717a); font-size:0.78rem;">Please select a project to view members.</li>';
      return;
    }

    const authToken = localStorage.getItem("authToken");
    try {
      modalMemberList.innerHTML = '<li style="color:var(--text-3, #71717a); font-size:0.78rem;">Loading members...</li>';
      const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/`, {
        headers: { Authorization: `Token ${authToken}` }
      });
      if (!response.ok) throw new Error("Failed to load project members");
      const project = await response.json();

      if (memberModal) {
        memberModal.dataset.projectId = projectId;
      }

      if ((project.members || []).length === 0) {
        modalMemberList.innerHTML = '<li style="color:var(--text-3, #71717a); font-size:0.78rem;">No team members assigned yet.</li>';
      } else {
        modalMemberList.innerHTML = "";
        project.members.forEach((member) => {
          const li = document.createElement("li");
          const initial = (member.username || 'U').charAt(0).toUpperCase();
          const role = member.role || 'Member';
          li.innerHTML = `
            <div class="avatar-chip" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:0.45rem 0.65rem; border-radius:0.5rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); margin-bottom:0.4rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <div class="chip-circle" style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg, #6366f1, #8b5cf6); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; color:#fff;">${initial}</div>
                <span class="chip-name" style="font-weight:600; font-size:0.83rem; color:var(--text-1, #fafafa);">${member.username}</span>
              </div>
              <span class="chip-role" style="font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:1rem; background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3);">${role}</span>
            </div>
          `;
          modalMemberList.appendChild(li);
        });
      }
    } catch (err) {
      console.error("Error loading modal members:", err);
      modalMemberList.innerHTML = `<li style="color:#ef4444; font-size:0.78rem;">Error loading members: ${err.message}</li>`;
    }
  }

  // Open Members Modal Function
  async function openMembersModal(overrideProjectId = null) {
    if (!memberModal) return;

    memberModal.classList.remove("hidden");
    memberModal.classList.add("flex");
    memberModal.style.display = "flex";

    let targetProjectId = overrideProjectId || new URLSearchParams(window.location.search).get("id") || window.currentProjectId;

    const authToken = localStorage.getItem("authToken");

    // Fetch user projects if we need project selector or targetProjectId is missing
    try {
      const response = await fetch("http://127.0.0.1:8000/api/projects/", {
        headers: { Authorization: `Token ${authToken}` }
      });
      if (response.ok) {
        const projects = await response.json();
        if (projects.length > 0) {
          if (!targetProjectId) {
            targetProjectId = projects[0].id;
          }
          if (modalProjectSelect && modalProjectSelectWrap) {
            modalProjectSelect.innerHTML = "";
            projects.forEach((proj) => {
              const opt = document.createElement("option");
              opt.value = proj.id;
              opt.textContent = proj.name;
              if (proj.id == targetProjectId) opt.selected = true;
              modalProjectSelect.appendChild(opt);
            });
            modalProjectSelectWrap.style.display = projects.length > 1 ? "block" : "none";
          }
        }
      }
    } catch (e) {
      console.error("Could not fetch project list for modal:", e);
    }

    if (targetProjectId) {
      loadModalMembers(targetProjectId);
    }
  }

  // Bind project selector change inside modal
  if (modalProjectSelect) {
    modalProjectSelect.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        loadModalMembers(selectedId);
      }
    });
  }

  // Bind sidebar "Members" navigation links
  const sidebarMembersLinks = document.querySelectorAll("#members-nav-link, .members-nav-btn");
  sidebarMembersLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // If on project detail page, scroll to member-list if present or open modal
      const memberListOnPage = document.getElementById("member-list");
      if (memberListOnPage) {
        memberListOnPage.scrollIntoView({ behavior: "smooth" });
      }
      openMembersModal();
    });
  });

  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", () => {
      openMembersModal();
    });
  }

  if (memberCloseBtn && memberModal) {
    memberCloseBtn.addEventListener("click", () => {
      memberModal.classList.remove("flex");
      memberModal.style.display = "none";
    });
  }

  if (addMemberForm) {
    addMemberForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      let projectId = new URLSearchParams(window.location.search).get("id") ||
                      (memberModal ? memberModal.dataset.projectId : null) ||
                      (modalProjectSelect ? modalProjectSelect.value : null) ||
                      window.currentProjectId;

      const authToken = localStorage.getItem("authToken");
      const usernameInput = document.getElementById("member-username");
      const username = usernameInput ? usernameInput.value.trim() : "";

      if (!username) {
        alert("Please enter a valid username.");
        return;
      }

      if (!projectId) {
        alert("Please select a project to add a member to.");
        return;
      }

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
          const errorMessage = typeof errorData === 'object' ? Object.values(errorData).flat().join("\n") : "Failed to add member";
          throw new Error(errorMessage);
        }

        addMemberForm.reset();
        loadModalMembers(projectId);

        if (typeof fetchProjectDetails === "function") {
          fetchProjectDetails();
        }
        if (typeof fetchAndDisplayProjectDetails === "function" && window.currentProjectId == projectId) {
          fetchAndDisplayProjectDetails(projectId);
        }
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

  // Update welcome username on dashboard load
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const usernameEl = document.getElementById("welcome-username");
      if (usernameEl && parsedUser.username) {
        usernameEl.textContent = parsedUser.username;
      }
    }
  } catch (e) {
    console.error("Error parsing user profile:", e);
  }

  // Dashboard live search filter for projects
  const searchInput = document.getElementById("dashboard-project-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll(".project-card");
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  function displayProjects(projects) {
    const projectList = document.getElementById("project-list");
    projectList.innerHTML = ""; // Clear the container first

    // Update count badge
    const countBadge = document.getElementById("project-count-badge");
    if (countBadge) {
      countBadge.textContent = `${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`;
    }

    if (projects.length === 0) {
      projectList.innerHTML =
        '<div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-3); background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--r-lg);"><p>No projects found. Create your first project to get started!</p></div>';
      return;
    }

    projects.forEach((project) => {
      const projectCard = document.createElement("div");
      projectCard.className = "project-card";
      projectCard.dataset.projectId = project.id;

      const initial = (project.name || "P").charAt(0).toUpperCase();
      const creatorInitial = (project.created_by || "A").charAt(0).toUpperCase();

      projectCard.innerHTML = `
        <div>
          <div class="project-card-header">
            <div class="project-avatar-icon">${initial}</div>
            <span class="project-card-type">${project.project_type || 'General'}</span>
          </div>
          <h3>${project.name}</h3>
          <p>${project.project_type || 'Project Workspace'}</p>
          <div class="avatar-stack" title="Team members">
            <div class="avatar-stack-item">${creatorInitial}</div>
            <div class="avatar-stack-item" style="background:linear-gradient(135deg, #06b6d4, #3b82f6)">+</div>
          </div>
        </div>
        <div class="card-footer">
          <span>Created by: <strong>${project.created_by || 'Admin'}</strong></span>
          <a href="project.html?id=${project.id}" class="btn-details" onclick="event.stopPropagation();">Details →</a>
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
          submitButton.style.background = "linear-gradient(135deg, #059669 0%, #10b981 100%)";
          submitButton.style.borderColor = "#34d399";
          submitButton.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
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
      const submitBtn = document.getElementById("task-submit-btn");
      submitBtn.textContent = "Create Task";
      submitBtn.style.background = "linear-gradient(135deg, #059669 0%, #10b981 100%)";
      submitBtn.style.borderColor = "#34d399";
      submitBtn.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
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

// Function to load and display tasks with filter and search support
let currentProjectTasks = [];
let currentTaskFilter = "all";
let currentSearchQuery = "";

// Function to update metric cards and filter pill counters
function updateTaskMetricCounters() {
  const total = currentProjectTasks.length;
  const todo = currentProjectTasks.filter((t) => t.status === "To Do").length;
  const progress = currentProjectTasks.filter((t) => t.status === "In Progress").length;
  const done = currentProjectTasks.filter((t) => t.status === "Done").length;

  // Update Metric Cards
  const totalEl = document.getElementById("metric-total-count");
  const todoEl = document.getElementById("metric-todo-count");
  const progressEl = document.getElementById("metric-progress-count");
  const doneEl = document.getElementById("metric-done-count");
  const counterPill = document.getElementById("task-counter-pill");

  if (totalEl) totalEl.textContent = total;
  if (todoEl) todoEl.textContent = todo;
  if (progressEl) progressEl.textContent = progress;
  if (doneEl) doneEl.textContent = done;

  if (counterPill) {
    counterPill.textContent = `${total} ${total === 1 ? "Task" : "Tasks"}`;
  }

  // Update Pill Badges
  const pillAll = document.getElementById("pill-count-all");
  const pillTodo = document.getElementById("pill-count-todo");
  const pillProgress = document.getElementById("pill-count-progress");
  const pillDone = document.getElementById("pill-count-done");

  if (pillAll) pillAll.textContent = total;
  if (pillTodo) pillTodo.textContent = todo;
  if (pillProgress) pillProgress.textContent = progress;
  if (pillDone) pillDone.textContent = done;
}

// Function to load and display tasks with filter support
async function loadProjectTasks(projectId) {
  const authToken = localStorage.getItem("authToken");
  const tasksList = document.getElementById("tasks-list");

  if (!tasksList) return;

  try {
    tasksList.innerHTML =
      '<p class="text-[#a1a1aa] text-xs py-4 text-center">Loading workspace tasks...</p>';

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

    currentProjectTasks = await response.json();

    updateTaskMetricCounters();
    renderFilteredTasksList();
    setupTaskFilterListeners();
    setupTaskSearchListener();
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasksList.innerHTML =
      '<p class="text-[#f87171] text-xs py-4 text-center">Failed to load workspace tasks</p>';
  }
}

// Setup live search listener
function setupTaskSearchListener() {
  const searchInput = document.getElementById("task-search-input");
  if (!searchInput || searchInput.dataset.listenerAttached) return;

  searchInput.dataset.listenerAttached = "true";
  searchInput.addEventListener("input", (e) => {
    currentSearchQuery = (e.target.value || "").toLowerCase().trim();
    renderFilteredTasksList();
  });
}

function renderFilteredTasksList() {
  const tasksList = document.getElementById("tasks-list");
  if (!tasksList) return;

  const filteredTasks = currentProjectTasks.filter((task) => {
    // Status filter match
    const matchesFilter =
      currentTaskFilter === "all" || task.status === currentTaskFilter;

    // Search query match (title, description, or assignees)
    const assigneesStr = (task.assignees || []).join(" ").toLowerCase();
    const titleStr = (task.title || "").toLowerCase();
    const descStr = (task.description || "").toLowerCase();

    const matchesSearch =
      !currentSearchQuery ||
      titleStr.includes(currentSearchQuery) ||
      descStr.includes(currentSearchQuery) ||
      assigneesStr.includes(currentSearchQuery);

    return matchesFilter && matchesSearch;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `
      <div class="p-6 text-center border border-dashed border-[#27272a] rounded-xl bg-[#121215]/80">
        <svg class="mx-auto text-[#71717a] mb-2" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-xs text-[#a1a1aa] font-semibold">No ${
          currentTaskFilter === "all" ? "" : currentTaskFilter
        } tasks found${currentSearchQuery ? ` matching "${currentSearchQuery}"` : ""}.</p>
        <p class="text-[11px] text-[#71717a] mt-1">Use the composer below to create new tasks.</p>
      </div>`;
    return;
  }

  const statusClassMap = {
    "To Do": "status-todo",
    "In Progress": "status-progress",
    Done: "status-done",
  };

  const statusBadgeColorMap = {
    "To Do": "background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);",
    "In Progress": "background:rgba(245,158,11,0.12); color:#fbbf24; border:1px solid rgba(245,158,11,0.3);",
    Done: "background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.3);",
  };

  const priorityColorMap = {
    low: "background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);",
    medium: "background:rgba(245,158,11,0.1); color:#fbbf24; border:1px solid rgba(245,158,11,0.2);",
    high: "background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);",
  };

  tasksList.innerHTML = filteredTasks
    .map((task) => {
      const statusClass = statusClassMap[task.status] || "status-todo";
      const statusBadgeStyle = statusBadgeColorMap[task.status] || statusBadgeColorMap["To Do"];
      const priorityStyle = priorityColorMap[task.priority || "medium"] || priorityColorMap["medium"];

      return `
      <div class="task-card-item ${statusClass}">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span class="status-dot-pulse"></span>
            <h4 class="font-bold text-white text-sm tracking-tight truncate">${task.title}</h4>
            
            <span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1" style="${statusBadgeStyle}">
              ${task.status}
            </span>
            
            <span class="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider" style="${priorityStyle}">
              ${task.priority || "medium"}
            </span>
          </div>
          
          ${
            task.description
              ? `<p class="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-relaxed">${task.description}</p>`
              : ""
          }
          
          <div class="flex items-center gap-4 mt-2 text-xs text-[#71717a] flex-wrap">
            ${
              task.assignees && task.assignees.length > 0
                ? `<span class="inline-flex items-center gap-1 font-medium text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded border border-[#3f3f46]">👤 ${task.assignees.join(", ")}</span>`
                : `<span class="italic text-[#52525b]">Unassigned</span>`
            }
            ${
              task.due_date
                ? `<span class="inline-flex items-center gap-1 text-[#a1a1aa]">📅 ${task.due_date}</span>`
                : ""
            }
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button onclick="editTask(${task.id})" class="task-action-btn-edit" title="Edit task details">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Edit
          </button>
          <button onclick="deleteTask(${task.id}, '${task.title.replace(/'/g, "\\'")}')" class="task-action-btn-delete" title="Delete task">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete
          </button>
        </div>
      </div>`;
    })
    .join("");
}

function setupTaskFilterListeners() {
  const filterBtns = document.querySelectorAll(".task-filter-btn");
  filterBtns.forEach((btn) => {
    if (btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = "true";

    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTaskFilter = btn.dataset.filter || "all";
      renderFilteredTasksList();
    });
  });
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
    document.getElementById("form-title").textContent = "Edit Task Details";
    const submitBtn = document.getElementById("task-submit-btn");
    submitBtn.textContent = "Update Task";
    submitBtn.style.background = "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)";
    submitBtn.style.borderColor = "#60a5fa";
    submitBtn.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.35)";
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

    // Reload tasks list
    loadProjectTasks(projectId);
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task");
  }
}

