document.addEventListener('DOMContentLoaded', function() {
    let calendarInitialized = false;
    let calendar = null;

    // Tab switching for calendar initialization
    const tabCalendar = document.getElementById('tab-calendar');
    if (tabCalendar) {
        tabCalendar.addEventListener('click', () => {
            const calendarView = document.getElementById('calendar-view');
            if (calendarView) {
                calendarView.classList.remove('hidden');
                if (!calendarInitialized) {
                    initializeCalendar();
                } else {
                    calendar.render();
                }
            }
        });
    }

    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },
            height: '700px',
            events: getTaskEvents(),
            eventClick: handleEventClick,
            eventDidMount: function(info) {
                info.el.title = `${info.event.title}\nStatus: ${info.event.extendedProps.status}\nProject: ${info.event.extendedProps.project}`;
            },
            eventClassNames: function(arg) {
                const status = arg.event.extendedProps.status.toLowerCase();
                return [
                    'cursor-pointer',
                    status === 'to do' ? 'bg-gray-500' :
                    status === 'in progress' ? 'bg-blue-500' :
                    'bg-green-500'
                ];
            }
        });

        calendar.render();
        calendarInitialized = true;
    }

    function getTaskEvents() {
        const tasks = window.myTasksData || [];
        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            start: task.due_date,
            allDay: true,
            extendedProps: {
                status: task.status,
                project: task.project_name,
                description: task.description,
                assignees: task.assignees || []
            }
        }));
    }

    function handleEventClick(info) {
        const existingModal = document.getElementById('task-detail-modal');
        if (existingModal) existingModal.remove();

        const event = info.event;
        const task = event.extendedProps;
        
        const modalHTML = `
            <div id="task-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">${event.title}</h3>
                        <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('#task-detail-modal').remove()">×</button>
                    </div>
                    <div class="space-y-3">
                        <p><span class="font-medium">Project:</span> ${task.project}</p>
                        <p><span class="font-medium">Status:</span> 
                            <span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                        </p>
                        <p><span class="font-medium">Due Date:</span> ${event.start ? event.start.toLocaleDateString() : 'No due date'}</p>
                        <p><span class="font-medium">Assignees:</span> ${task.assignees.join(', ') || 'None'}</p>
                        ${task.description ? `<p><span class="font-medium">Description:</span> ${task.description}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Close modal when clicking outside
        document.getElementById('task-detail-modal').addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });
    }

    // Update calendar when tasks are updated
    window.updateCalendar = function() {
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getTaskEvents());
        }
    };

    // Initialize calendar if we're on the calendar view initially
    if (!document.getElementById('calendar-view').classList.contains('hidden')) {
        initializeCalendar();
    }
});