// Chat System for Project Pages
class ChatSystem {
  constructor(projectId) {
    this.projectId = projectId;
    this.messages = [];
    this.currentUser = this.getCurrentUser();
    this.apiUrl = `http://localhost:8000/api/projects/${projectId}/chat/`;
    this.pollInterval = null;
    this.initializeChat();
  }

  getCurrentUser() {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      console.error("No user logged in");
      return null;
    }
    return user;
  }

  async initializeChat() {
    if (!this.currentUser) {
      console.error("Cannot initialize chat without logged in user");
      return;
    }

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");

    if (!chatForm || !chatInput) {
      console.error("Chat form elements not found");
      return;
    }

    // Load existing messages
    await this.loadMessages();

    // Handle form submission
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const message = chatInput.value.trim();

      if (message) {
        await this.sendMessage(message);
        chatInput.value = "";
      }
      return false;
    });

    // Poll for new messages every 3 seconds
    this.pollInterval = setInterval(() => this.loadMessages(), 3000);

    // Update online count (members count)
    this.updateOnlineCount();
  }

  async loadMessages() {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(this.apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.messages = data;
        this.renderMessages();
        this.scrollToBottom();
      } else {
        console.error("Failed to load messages:", response.status);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  async sendMessage(messageText) {
    try {
      const token = localStorage.getItem("authToken");

      const payload = {
        message: messageText,
        project: parseInt(this.projectId),
      };

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Reload messages to show the new one
        await this.loadMessages();
      } else {
        const error = await response.json();
        console.error("Failed to send message:", error);
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please check your connection.");
    }
  }

  renderMessages() {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    if (this.messages.length === 0) {
      chatMessages.innerHTML = `
                <div class="text-center text-gray-500 text-sm py-8">
                    <p>No messages yet.</p>
                    <p class="text-xs mt-1">Start the conversation!</p>
                </div>
            `;
      return;
    }

    chatMessages.innerHTML = this.messages
      .map((msg) => this.createMessageHTML(msg))
      .join("");
  }

  createMessageHTML(message) {
    const isCurrentUser = message.user_id === this.currentUser.id;
    const timeAgo = this.getTimeAgo(new Date(message.created_at));
    const avatar = this.getAvatarUrl(message.username);

    return `
            <div class="flex ${
              isCurrentUser ? "justify-end" : "justify-start"
            } items-start gap-2">
                ${
                  !isCurrentUser
                    ? `<img src="${avatar}" alt="${message.username}" class="w-8 h-8 rounded-full flex-shrink-0">`
                    : ""
                }
                <div class="max-w-xs ${isCurrentUser ? "order-first" : ""}">
                    <div class="${
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    } rounded-lg px-3 py-2">
                        ${
                          !isCurrentUser
                            ? `<div class="text-xs font-medium ${
                                isCurrentUser
                                  ? "text-blue-200"
                                  : "text-gray-600"
                              } mb-1">${this.escapeHTML(
                                message.username
                              )}</div>`
                            : ""
                        }
                        <div class="text-sm">${this.escapeHTML(
                          message.message
                        )}</div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1 ${
                      isCurrentUser ? "text-right" : "text-left"
                    }">${timeAgo}</div>
                </div>
                ${
                  isCurrentUser
                    ? `<img src="${avatar}" alt="${message.username}" class="w-8 h-8 rounded-full flex-shrink-0">`
                    : ""
                }
            </div>
        `;
  }

  getAvatarUrl(username) {
    // Generate avatar URL based on username
    const colors = ["3b82f6", "10b981", "f59e0b", "ef4444", "8b5cf6", "ec4899"];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=${color}&color=white`;
  }

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  scrollToBottom() {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  async updateOnlineCount() {
    // Get member count from the project
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8000/api/projects/${this.projectId}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const project = await response.json();
        const onlineCount = document.getElementById("online-count");
        if (onlineCount && project.members) {
          onlineCount.textContent = `${project.members.length} members`;
        }
      }
    } catch (error) {
      console.error("Error getting member count:", error);
    }
  }

  destroy() {
    // Clean up polling when leaving page
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

// Initialize chat system when DOM is loaded
let chatSystemInstance = null;

function initializeChatForProject(projectId) {
  // Clean up existing instance if any
  if (chatSystemInstance) {
    chatSystemInstance.destroy();
  }

  // Ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      chatSystemInstance = new ChatSystem(projectId);
    });
  } else {
    // DOM already loaded
    chatSystemInstance = new ChatSystem(projectId);
  }
}

// Export for use in project-details.js
if (typeof window !== "undefined") {
  window.initializeChatForProject = initializeChatForProject;
}
