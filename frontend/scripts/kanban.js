document.addEventListener('DOMContentLoaded', function() {
    let sortableInitialized = false;

    // Tab switching functionality
    const tabs = {
        'tab-table': 'table-view',
        'tab-kanban': 'kanban-view',
        'tab-calendar': 'calendar-view'
    };

    Object.keys(tabs).forEach(tabId => {
        const tabBtn = document.getElementById(tabId);
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                // Remove active class from all tabs and hide all views
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('#table-view, #kanban-view, #calendar-view').forEach(view => {
                    view.classList.add('hidden');
                });

                // Add active class to clicked tab and show corresponding view
                tabBtn.classList.add('active');
                document.getElementById(tabs[tabId]).classList.remove('hidden');

                // If switching to kanban, populate it
                if (tabId === 'tab-kanban') {
                    populateKanbanBoard();
                    initializeSortable();
                }
            });
        }
    });

    // Initialize Sortable for drag and drop
    function initializeSortable() {
        if (sortableInitialized) return;

        const kanbanLists = document.querySelectorAll('.kanban-list');
        kanbanLists.forEach(list => {
            new Sortable(list, {
                group: 'shared',
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                handle: '.kanban-card',
                forceFallback: false,
                onStart: function(evt) {
                    document.body.style.cursor = 'grabbing';
                },
                onEnd: async function(evt) {
                    document.body.style.cursor = 'default';
                    if (evt.to === evt.from && evt.oldIndex === evt.newIndex) return;

                    const taskId = evt.item.dataset.taskId;
                    const newStatus = evt.to.dataset.status;

                    try {
                        await updateTaskStatus(taskId, newStatus);
                        // Update task in local data
                        const taskIndex = window.myTasksData.findIndex(t => t.id == taskId);
                        if (taskIndex !== -1) {
                            window.myTasksData[taskIndex].status = newStatus;
                            // Update the table view
                            updateTableView(taskId, newStatus);
                        }
                        updateColumnCounts();
                    } catch (error) {
                        console.error('Error updating task status:', error);
                        evt.from.appendChild(evt.item);
                        showNotification('Failed to update task status', 'error');
                    }
                }
            });
        });
        
        sortableInitialized = true;
    }

    // Function to update task status via API
    async function updateTaskStatus(taskId, newStatus) {
        const authToken = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    // Function to update the table view
    function updateTableView(taskId, newStatus) {
        const tableBody = document.getElementById('my-tasks-tbody');
        if (!tableBody) return;

        const rows = tableBody.getElementsByTagName('tr');
        for (let row of rows) {
            const cells = row.getElementsByTagName('td');
            if (cells.length >= 5) { // Make sure row has enough cells
                const taskCell = cells[0];
                const statusCell = cells[4];
                
                // Check if this is the row we want to update
                // You might need to adjust this depending on how you store the task ID in the table
                if (taskCell.textContent === window.myTasksData.find(t => t.id == taskId)?.title) {
                    // Update the status badge
                    const statusBadge = statusCell.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.className = `status-badge status-${newStatus.toLowerCase().replace(' ', '-')}`;
                        statusBadge.textContent = newStatus;
                    } else {
                        // Create new badge if it doesn't exist
                        const newBadge = document.createElement('span');
                        newBadge.className = `status-badge status-${newStatus.toLowerCase().replace(' ', '-')}`;
                        newBadge.textContent = newStatus;
                        statusCell.innerHTML = '';
                        statusCell.appendChild(newBadge);
                    }
                    break;
                }
            }
        }
    }

    // Populate the kanban board with tasks
    function populateKanbanBoard() {
        const tasks = window.myTasksData || [];
        const lists = {
            'To Do': document.getElementById('kanban-todo'),
            'In Progress': document.getElementById('kanban-inprogress'),
            'Done': document.getElementById('kanban-done')
        };

        // Clear existing tasks
        Object.values(lists).forEach(list => {
            if (list) list.innerHTML = '';
        });

        // Populate tasks
        tasks.forEach(task => {
            const list = lists[task.status];
            if (list) {
                const card = createTaskCard(task);
                list.appendChild(card);
            }
        });

        updateColumnCounts();
    }

    // Create a task card
    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'kanban-card bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all';
        card.dataset.taskId = task.id;

        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

        card.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">${escapeHTML(task.title)}</h4>
            <p class="text-xs text-gray-500 mb-2">
                <span class="inline-flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
                        </path>
                    </svg>
                    ${escapeHTML(task.project_name)}
                </span>
            </p>
            ${task.description ? `<p class="text-sm text-gray-600 mb-3">${escapeHTML(task.description)}</p>` : ''}
            <div class="flex items-center justify-between text-xs">
                <span class="${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">
                    <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">
                        </path>
                    </svg>
                    ${dueDate}
                </span>
                ${task.assignees ? renderAssignees(task.assignees) : ''}
            </div>
        `;

        return card;
    }

    function renderAssignees(assignees) {
        if (!assignees.length) return '';
        
        return `
            <div class="flex -space-x-2 overflow-hidden">
                ${assignees.slice(0, 3).map(assignee => `
                    <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white" 
                         title="${escapeHTML(assignee)}">
                        ${assignee.charAt(0).toUpperCase()}
                    </div>
                `).join('')}
                ${assignees.length > 3 ? `
                    <div class="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white">
                        +${assignees.length - 3}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function updateColumnCounts() {
        const columns = ['todo', 'inprogress', 'done'];
        columns.forEach(column => {
            const list = document.getElementById(`kanban-${column}`);
            const count = list ? list.children.length : 0;
            const counter = document.getElementById(`${column}-count`);
            if (counter) {
                counter.textContent = `(${count})`;
            }
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Initialize kanban if we're on the kanban view initially
    if (!document.getElementById('kanban-view').classList.contains('hidden')) {
        populateKanbanBoard();
        initializeSortable();
    }
});