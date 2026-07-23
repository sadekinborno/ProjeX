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
}

async function fetchProjectDetails() {
  // Get the project ID from the URL query string
  const projectId = new URLSearchParams(window.location.search).get("id");
  if (!projectId) {
    window.location.href = "index.html"; // Redirect if no ID is found
    return;
  }

  const authToken = localStorage.getItem("authToken");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/projects/${projectId}/`,
      {
        headers: { Authorization: `Token ${authToken}` },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch project details.");

    const project = await response.json();
    displayProjectDetails(project);

    // Store project globally for filtering
    window.currentProject = project;

    // Initialize chat system for this project
    if (typeof window.initializeChatForProject === "function") {
      window.initializeChatForProject(projectId);
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function displayProjectDetails(project) {
  // Update the main header on the page
  document.getElementById("project-name-header").textContent = project.name;

  // Update the sidebar with the same project name
  document.getElementById("selected-project-name").textContent = project.name;

  // Store members for later use in task creation
  window.currentProjectMembers = project.members;

  // Update Project Overview Stats
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(
    (task) => task.status === "Done" // Fixed: Database uses "Done" not "Completed"
  ).length;
  const totalMembers = project.members.length;

  // Animate numbers
  animateNumber("total-tasks", 0, totalTasks);
  animateNumber("completed-tasks", 0, completedTasks);
  animateNumber("total-members", 0, totalMembers);

  // Display members and tasks with modern UI
  displayTeamMembers(project.members);
  displayTasks(project.tasks);
}

function displayTeamMembers(members) {
  const memberList = document.getElementById("member-list");
  memberList.innerHTML = ""; // Clear list

  if (members.length === 0) {
    memberList.innerHTML = `
      <div class="col-span-2 text-center py-12 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        <p class="font-medium">No team members yet</p>
        <p class="text-sm mt-1">Add members to start collaborating</p>
      </div>
    `;
    return;
  }

  members.forEach((member, index) => {
    const memberCard = document.createElement("div");
    memberCard.className =
      "member-card group relative bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer";

    const roleColors = {
      Admin: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-300",
      },
      Member: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-300",
      },
      Viewer: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
      },
    };

    const roleConfig = roleColors[member.role] || roleColors["Member"];

    // Generate avatar with first letter of username
    const firstLetter = member.username.charAt(0).toUpperCase();
    const avatarColors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
    ];
    const avatarGradient = avatarColors[index % avatarColors.length];

    memberCard.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="bg-gradient-to-br ${avatarGradient} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform duration-200 group-hover:scale-105">
            ${firstLetter}
          </div>
          <!-- Online status indicator -->
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
            ${member.username}
          </h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              roleConfig.bg
            } ${roleConfig.text} ${roleConfig.border}">
              ${getRoleIcon(member.role)} ${member.role}
            </span>
          </div>
        </div>
        
        <!-- Hover arrow -->
        <svg class="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    `;

    memberList.appendChild(memberCard);
  });
}

function displayTasks(tasks, filter = "all") {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = ""; // Clear list

  // Filter tasks based on selected filter
  let filteredTasks = tasks;
  if (filter !== "all") {
    const filterMap = {
      pending: "To Do", // Fixed: Database uses "To Do"
      "in-progress": "In Progress",
      completed: "Done", // Fixed: Database uses "Done"
    };
    filteredTasks = tasks.filter((task) => task.status === filterMap[filter]);
  }

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <li class="text-center py-12 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p class="font-medium">${
          filter === "all"
            ? "No tasks in this project yet"
            : "No " + filter + " tasks"
        }</p>
        <p class="text-sm mt-1">Create a new task to get started</p>
      </li>
    `;
    return;
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className =
      "task-card relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all duration-200 cursor-pointer";

    const statusConfig = {
      "To Do": {
        // Fixed: Match database status
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-300",
        icon: "⏳",
      },
      "In Progress": {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-300",
        icon: "🔄",
      },
      Done: {
        // Fixed: Match database status
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-300",
        icon: "✓",
      },
      Blocked: {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-300",
        icon: "🚫",
      },
    };

    const status = statusConfig[task.status] || statusConfig["To Do"]; // Fixed: Default to "To Do"

    // Format due date
    const dueDate = task.due_date
      ? new Date(task.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No due date";

    const isOverdue =
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "Done"; // Fixed: Database uses "Done"

    // Get priority badge if exists
    const priorityConfig = {
      high: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "🔴",
        label: "High",
      }, // Fixed: Database uses lowercase
      medium: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        icon: "🟡",
        label: "Medium",
      },
      low: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "🟢",
        label: "Low",
      },
    };
    const priority = task.priority ? priorityConfig[task.priority] : null;

    li.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <h3 class="font-semibold text-gray-900 text-base">
              ${task.title}
            </h3>
            ${
              priority
                ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}">
                ${priority.icon} ${priority.label}
              </span>
            `
                : ""
            }
          </div>
          ${
            task.description
              ? `
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">
              ${task.description}
            </p>
          `
              : ""
          }
        </div>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          status.bg
        } ${status.text} ${status.border}">
          <span>${status.icon}</span>
          ${task.status}
        </span>
      </div>
      
      <div class="flex items-center gap-6 text-sm text-gray-600">
        <div class="flex items-center gap-2 ${
          isOverdue ? "text-red-600 font-medium" : ""
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span class="text-xs">${dueDate}${
      isOverdue ? " (Overdue!)" : ""
    }</span>
        </div>
        
        ${
          task.assignees && task.assignees.length > 0
            ? `
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="text-xs font-medium">${task.assignees.length} assigned</span>
          </div>
        `
            : ""
        }
      </div>
    `;

    taskList.appendChild(li);
  });
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => {
        btn.classList.remove("active", "bg-blue-600", "text-white");
        btn.classList.add("bg-gray-100", "text-gray-600");
      });

      // Add active class to clicked button
      button.classList.remove("bg-gray-100", "text-gray-600");
      button.classList.add("active", "bg-blue-600", "text-white");

      // Filter tasks
      const filter = button.getAttribute("data-filter");
      if (window.currentProject) {
        displayTasks(window.currentProject.tasks, filter);
      }
    });
  });
}

function getRoleIcon(role) {
  const icons = {
    Admin: "👑",
    Member: "👤",
    Viewer: "👁️",
  };
  return icons[role] || "👤";
}

// Helper function to animate numbers
function animateNumber(elementId, start, end, duration = 1000) {
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
