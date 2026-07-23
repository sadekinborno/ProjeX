// stats.js - Dashboard Statistics Management

/**
 * Fetches and displays real-time statistics for the dashboard
 */
async function fetchAndDisplayStats() {
  const authToken = localStorage.getItem("authToken");
  const selectedProjectId = localStorage.getItem("selectedProjectId");

  if (!authToken) {
    console.error("No auth token found");
    return;
  }

  try {
    // If a project is selected, fetch project-specific stats
    if (selectedProjectId) {
      await fetchProjectStats(selectedProjectId, authToken);
    } else {
      // Fetch overall stats for all user projects
      await fetchOverallStats(authToken);
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    // Keep default values on error
  }
}

/**
 * Fetches statistics for a specific project
 */
async function fetchProjectStats(projectId, authToken) {
  try {
    // First, fetch all projects to get the total count
    const projectsResponse = await fetch(
      "http://127.0.0.1:8000/api/projects/",
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    if (!projectsResponse.ok) {
      throw new Error("Failed to fetch projects");
    }

    const projects = await projectsResponse.json();
    const totalProjects = projects.length;

    // Fetch tasks for this specific project
    const tasksResponse = await fetch(
      `http://127.0.0.1:8000/api/mytasks/?project_id=${projectId}`,
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    if (!tasksResponse.ok) {
      throw new Error("Failed to fetch project tasks");
    }

    const tasks = await tasksResponse.json();

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "Done"
    ).length;
    const overdueTasks = calculateOverdueTasks(tasks);

    // Update the DOM - now with actual total projects count
    updateStatsDisplay(totalProjects, totalTasks, completedTasks, overdueTasks);
  } catch (error) {
    console.error("Error fetching project stats:", error);
  }
}

/**
 * Fetches overall statistics across all user projects
 */
async function fetchOverallStats(authToken) {
  try {
    // Fetch all user projects
    const projectsResponse = await fetch(
      "http://127.0.0.1:8000/api/projects/",
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      }
    );

    if (!projectsResponse.ok) {
      throw new Error("Failed to fetch projects");
    }

    const projects = await projectsResponse.json();
    const totalProjects = projects.length;

    // Fetch all user tasks
    const tasksResponse = await fetch("http://127.0.0.1:8000/api/mytasks/", {
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    if (!tasksResponse.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const tasks = await tasksResponse.json();

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "Done"
    ).length;
    const overdueTasks = calculateOverdueTasks(tasks);

    // Update the DOM
    updateStatsDisplay(totalProjects, totalTasks, completedTasks, overdueTasks);
  } catch (error) {
    console.error("Error fetching overall stats:", error);
  }
}

/**
 * Calculates the number of overdue tasks
 */
function calculateOverdueTasks(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  return tasks.filter((task) => {
    if (!task.due_date || task.status === "Done") {
      return false;
    }

    const dueDate = new Date(task.due_date);
    return dueDate < today;
  }).length;
}

/**
 * Updates the stats display in the DOM
 */
function updateStatsDisplay(
  totalProjects,
  totalTasks,
  completedTasks,
  overdueTasks
) {
  // Helper to find an element by new ID first, then fall back to old Tailwind selector
  function getStatEl(newId, nthChild) {
    return (
      document.getElementById(newId) ||
      document.querySelector(`.stat-card:nth-child(${nthChild}) p`) ||
      document.querySelector(`.stat-card:nth-child(${nthChild}) .text-2xl`)
    );
  }

  const totalProjectsElement = getStatEl('stat-total-projects', 1);
  if (totalProjectsElement) animateNumber(totalProjectsElement, totalProjects);

  const totalTasksElement = getStatEl('stat-total-tasks', 2);
  if (totalTasksElement) animateNumber(totalTasksElement, totalTasks);

  const completedTasksElement = getStatEl('stat-completed-tasks', 3);
  if (completedTasksElement) animateNumber(completedTasksElement, completedTasks);

  const overdueTasksElement = getStatEl('stat-overdue-tasks', 4);
  if (overdueTasksElement) animateNumber(overdueTasksElement, overdueTasks);
}

/**
 * Animates the number counting up
 */
function animateNumber(element, targetNumber) {
  const duration = 500; // Animation duration in milliseconds
  const startNumber = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOutQuad = progress * (2 - progress);
    const currentNumber = Math.floor(
      startNumber + (targetNumber - startNumber) * easeOutQuad
    );

    element.textContent = currentNumber;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetNumber; // Ensure we end at the exact number
    }
  }

  requestAnimationFrame(update);
}

/**
 * Refreshes stats when called
 */
function refreshStats() {
  fetchAndDisplayStats();
}

// Initialize stats when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fetchAndDisplayStats);
} else {
  // DOM already loaded
  fetchAndDisplayStats();
}

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.refreshStats = refreshStats;
}
