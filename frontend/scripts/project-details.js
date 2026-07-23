// Project Details Page Functionality
// Handles displaying project information, members, and tasks with modern UI

document.addEventListener("DOMContentLoaded", () => {
  // Check if we are on the project detail page
  if (document.getElementById("project-name-header")) {
    initializeProjectPage();
  }
});

function initializeProjectPage() {
  fetchProjectDetails();
  setupFilterButtons();
  setupSearchInput();
}

async function fetchProjectDetails() {
  // Get project ID from URL query string or localStorage
  let projectId = new URLSearchParams(window.location.search).get("id");
  if (!projectId) {
    projectId = localStorage.getItem("selectedProjectId");
  }

  const authToken = localStorage.getItem("authToken");

  if (projectId && authToken) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/projects/${projectId}/`,
        {
          headers: { Authorization: `Token ${authToken}` },
        }
      );

      if (response.ok) {
        const project = await response.json();
        displayProjectDetails(project);
        window.currentProject = project;

        // Initialize chat system for this project
        if (typeof window.initializeChatForProject === "function") {
          window.initializeChatForProject(projectId);
        }
        return;
      }
    } catch (error) {
      console.warn("Failed to fetch project details via API ID:", error);
    }
  }

  // Fallback: If no specific project ID or fetch failed, try loading user's project list
  if (authToken) {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/projects/", {
        headers: { Authorization: `Token ${authToken}` },
      });

      if (response.ok) {
        const projects = await response.json();
        if (projects && projects.length > 0) {
          const firstProject = projects[0];
          localStorage.setItem("selectedProjectId", firstProject.id);
          localStorage.setItem("selectedProjectName", firstProject.name);

          // Fetch complete details for the first project
          const detailResp = await fetch(
            `http://127.0.0.1:8000/api/projects/${firstProject.id}/`,
            {
              headers: { Authorization: `Token ${authToken}` },
            }
          );

          if (detailResp.ok) {
            const projectDetail = await detailResp.json();
            displayProjectDetails(projectDetail);
            window.currentProject = projectDetail;
            if (typeof window.initializeChatForProject === "function") {
              window.initializeChatForProject(firstProject.id);
            }
            return;
          } else {
            displayProjectDetails(firstProject);
            window.currentProject = firstProject;
            return;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch projects list fallback:", error);
    }
  }

  // Final graceful fallback if unauthenticated or offline
  const cachedName = localStorage.getItem("selectedProjectName") || "ProjeX";
  displayProjectDetails({
    name: cachedName,
    members: [],
    tasks: [],
  });
}

function displayProjectDetails(project) {
  // Update the main header on the page
  document.getElementById("project-name-header").textContent = project.name;

  // Update the sidebar with the same project name
  document.getElementById("selected-project-name").textContent = project.name;

  // Store members for later use in task creation
  window.currentProjectMembers = project.members;

  // Calculate Project Overview Stats
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(
    (task) => task.status === "Done"
  ).length;
  const inProgressTasks = project.tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const totalMembers = project.members.length;

  // Completion Progress Bar
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pctEl = document.getElementById("project-progress-pct");
  const fillEl = document.getElementById("project-progress-fill");
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;

  // Animate numbers
  animateNumber("total-tasks", 0, totalTasks);
  animateNumber("inprogress-tasks", 0, inProgressTasks);
  animateNumber("completed-tasks", 0, completedTasks);
  animateNumber("total-members", 0, totalMembers);

  // Display members and tasks with modern dark UI
  displayTeamMembers(project.members);
  displayTasks(project.tasks);
}

function displayTeamMembers(members) {
  const memberList = document.getElementById("member-list");
  if (!memberList) return;
  memberList.innerHTML = ""; // Clear list

  if (members.length === 0) {
    memberList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: #a1a1aa;">
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" style="margin: 0 auto 0.5rem auto; display: block; color: #71717a;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p style="font-weight:600;font-size:0.875rem;color:#fafafa;">No team members yet</p>
        <p style="font-size:0.75rem;color:#71717a;margin-top:2px;">Click "Add Member" above to invite teammates.</p>
      </div>
    `;
    return;
  }

  const avatarGradients = [
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "linear-gradient(135deg, #10b981, #047857)",
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #f59e0b, #b45309)",
  ];

  members.forEach((member, index) => {
    const memberCard = document.createElement("div");
    memberCard.className = "pdetail-member-card";

    const roleClass = (member.role || "member").toLowerCase();
    const firstLetter = member.username ? member.username.charAt(0).toUpperCase() : "?";
    const gradient = avatarGradients[index % avatarGradients.length];

    memberCard.innerHTML = `
      <div class="member-avatar-circle" style="background: ${gradient};">
        ${firstLetter}
        <div class="member-online-dot"></div>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 0.875rem; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${member.username}
        </div>
        <div style="margin-top: 0.25rem;">
          <span class="member-role-badge ${roleClass}">
            ${getRoleIcon(member.role)} ${member.role || 'Member'}
          </span>
        </div>
      </div>
    `;

    memberList.appendChild(memberCard);
  });
}

function displayTasks(tasks, filter = "all", searchQuery = "") {
  const taskList = document.getElementById("task-list");
  if (!taskList) return;
  taskList.innerHTML = ""; // Clear list

  // Filter tasks based on selected filter tab
  let filteredTasks = tasks;
  if (filter !== "all") {
    const filterMap = {
      pending: "To Do",
      "in-progress": "In Progress",
      completed: "Done",
    };
    const targetStatus = filterMap[filter] || filter;
    filteredTasks = tasks.filter((task) => task.status === targetStatus);
  }

  // Filter tasks by search query if present
  if (searchQuery && searchQuery.trim() !== "") {
    const query = searchQuery.trim().toLowerCase();
    filteredTasks = filteredTasks.filter((task) => {
      const matchTitle = task.title && task.title.toLowerCase().includes(query);
      const matchDesc = task.description && task.description.toLowerCase().includes(query);
      const matchAssignee = task.assignees && task.assignees.some(a => (a.username || a).toLowerCase().includes(query));
      return matchTitle || matchDesc || matchAssignee;
    });
  }

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <li style="text-align:center;padding:2.5rem 1rem;color:#a1a1aa;background:rgba(24,24,27,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:var(--r-md);">
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" style="margin: 0 auto 0.5rem auto; display: block; color: #71717a;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p style="font-weight:600;font-size:0.9rem;color:#fafafa;">${
          filter === "all" && !searchQuery
            ? "No tasks in this project yet"
            : "No matching tasks found"
        }</p>
        <p style="font-size:0.75rem;color:#71717a;margin-top:4px;">Click "New Task" to create a task for your team.</p>
      </li>
    `;
    return;
  }

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");

    let statusClass = "status-todo";
    let statusPillStyle = "background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);";
    let statusIcon = `<span style="width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>`;

    if (task.status === "In Progress") {
      statusClass = "status-progress";
      statusPillStyle = "background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);";
      statusIcon = `<span style="width:6px;height:6px;border-radius:50%;background:#fbbf24;box-shadow:0 0 6px #fbbf24;"></span>`;
    } else if (task.status === "Done") {
      statusClass = "status-done";
      statusPillStyle = "background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);";
      statusIcon = `<span style="width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d399;"></span>`;
    }

    li.className = `pdetail-task-card ${statusClass}`;

    // Format due date
    const dueDateFormatted = task.due_date
      ? new Date(task.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No due date";

    const isOverdue =
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "Done";

    // Priority configuration
    const priorityConfig = {
      high: {
        style: "background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.3);",
        label: "High Priority",
      },
      medium: {
        style: "background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);",
        label: "Medium Priority",
      },
      low: {
        style: "background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);",
        label: "Low Priority",
      },
    };
    const priority = task.priority ? priorityConfig[task.priority.toLowerCase()] : null;

    // Assignee names
    const assigneeCount = task.assignees ? task.assignees.length : 0;

    li.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-space-between;gap:1rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
            <h3 style="font-weight:700;font-size:0.95rem;color:#ffffff;line-height:1.3;">
              ${task.title}
            </h3>
            ${
              priority
                ? `<span style="display:inline-flex;align-items:center;padding:0.15rem 0.5rem;border-radius:99px;font-size:0.68rem;font-weight:700;${priority.style}">${priority.label}</span>`
                : ""
            }
          </div>
          ${
            task.description
              ? `<p style="font-size:0.8rem;color:#a1a1aa;margin:0 0 0.5rem 0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${task.description}</p>`
              : ""
          }
        </div>
        <span style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.25rem 0.65rem;border-radius:99px;font-size:0.72rem;font-weight:700;letter-spacing:0.02em;white-space:nowrap;${statusPillStyle}">
          ${statusIcon}
          ${task.status}
        </span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.05);font-size:0.75rem;color:#a1a1aa;">
        <div style="display:flex;align-items:center;gap:0.35rem; ${isOverdue ? 'color:#f87171;font-weight:600;' : ''}">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${dueDateFormatted}${isOverdue ? " (Overdue)" : ""}</span>
        </div>

        ${
          assigneeCount > 0
            ? `<div style="display:flex;align-items:center;gap:0.35rem;color:#38bdf8;">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span style="font-weight:600;">${assigneeCount} ${assigneeCount === 1 ? 'assignee' : 'assignees'}</span>
              </div>`
            : `<span style="color:#71717a;">Unassigned</span>`
        }
      </div>
    `;

    taskList.appendChild(li);
  });
}

let projectDetailsActiveFilter = "all";
let projectDetailsSearchQuery = "";

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Filter tasks
      projectDetailsActiveFilter = button.getAttribute("data-filter") || "all";
      if (window.currentProject) {
        displayTasks(window.currentProject.tasks, projectDetailsActiveFilter, projectDetailsSearchQuery);
      }
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById("task-search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    projectDetailsSearchQuery = e.target.value;
    if (window.currentProject) {
      displayTasks(window.currentProject.tasks, projectDetailsActiveFilter, projectDetailsSearchQuery);
    }
  });
}

function getRoleIcon(role) {
  const icons = {
    Admin: "👑",
    Member: "👤",
    Designer: "🎨",
    Viewer: "👁️",
  };
  return icons[role] || "👤";
}

// Helper function to animate numbers
function animateNumber(elementId, start, end, duration = 800) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (
      (increment > 0 && current >= end) ||
      (increment < 0 && current <= end)
    ) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

