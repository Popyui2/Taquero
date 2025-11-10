// Caravan Events Management
const Events = {
    // Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxBnI6OWDKzXW2oN_Q3aMH789h5ZnvdB7fzhCwL8xYTtNKgvv2YCHP0RDMPc3he7N4t_w/exec',

    events: [],
    currentEvent: null,
    initialized: false,

    // Initialize events system
    init() {
        if (!this.initialized) {
            this.setupEventListeners();
            this.initialized = true;
        }
        this.loadEvents();
    },

    // Setup all event listeners
    setupEventListeners() {
        // Add event button
        const addBtn = document.querySelector('.btn-add-event');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showModal());
        }

        // Modal close buttons
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.querySelector('.modal-cancel');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Delete button
        const deleteBtn = document.getElementById('btn-delete-event');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteEvent());
        }

        // Archive toggle
        const archiveToggle = document.getElementById('show-archived');
        if (archiveToggle) {
            archiveToggle.addEventListener('change', () => this.displayEvents());
        }

        // Event form submission
        const form = document.getElementById('event-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEvent();
            });
        }

        // Close modal on background click
        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    },

    // Load events from Google Sheets
    async loadEvents() {
        try {
            showLoading(true, 'Fetching Data from Database...');

            // Fetch from Google Apps Script
            const response = await fetch(this.SCRIPT_URL);
            const data = await response.json();

            if (data.status === 'success') {
                this.events = data.events;
                this.displayEvents();
                this.updateStats();
            } else {
                throw new Error('Failed to load events');
            }

            showLoading(false);
        } catch (error) {
            console.error('Error loading events:', error);
            showLoading(false);

            // Load from localStorage as fallback
            this.loadFromLocalStorage();
            showToast('Loading from local storage (offline mode)', 'warning');
        }
    },

    // Load events from localStorage (fallback)
    loadFromLocalStorage() {
        const stored = localStorage.getItem('caravan_events');
        if (stored) {
            this.events = JSON.parse(stored);
            this.displayEvents();
            this.updateStats();
        } else {
            // Show empty state
            this.events = [];
            this.displayEvents();
        }
    },

    // Save events to localStorage (backup)
    saveToLocalStorage() {
        localStorage.setItem('caravan_events', JSON.stringify(this.events));
    },

    // Display events in Kanban board
    displayEvents() {
        // Clear all columns
        const columns = ['solicitado', 'confirmado', 'pagado', 'finalizado'];
        columns.forEach(status => {
            const column = document.getElementById(`column-${status}`);
            if (column) {
                column.innerHTML = '';
            }
        });

        // Check if showing archived events
        const showArchived = document.getElementById('show-archived');
        const includeArchived = showArchived ? showArchived.checked : false;

        // Filter events based on archive toggle
        let filteredEvents = [...this.events];
        if (!includeArchived) {
            filteredEvents = filteredEvents.filter(e =>
                !e.status.toLowerCase().includes('archived')
            );
        }

        // Place events in appropriate columns
        filteredEvents.forEach(event => {
            const card = this.createEventCard(event);
            const status = this.normalizeStatus(event.status);
            const column = document.getElementById(`column-${status}`);

            if (column) {
                column.appendChild(card);
            }
        });

        // Update column counts
        this.updateColumnCounts();
    },

    // Normalize status to column name
    normalizeStatus(status) {
        const normalized = status.toLowerCase();

        if (normalized.includes('solicitado')) return 'solicitado';
        if (normalized.includes('confirmado') && !normalized.includes('pagado')) return 'confirmado';
        if (normalized.includes('pagado')) return 'pagado';
        if (normalized.includes('finalizado')) return 'finalizado';

        return 'solicitado'; // Default
    },

    // Create event card HTML
    createEventCard(event) {
        const card = document.createElement('div');
        card.className = `event-card ${this.normalizeStatus(event.status)}`;
        card.dataset.rowIndex = event.rowIndex;

        let html = `
            <div class="event-name">${event.nombre}</div>
            <div class="event-date">${event.fecha}</div>
        `;

        // Add revenue if exists
        if (event.ganancias) {
            html += `<div class="event-revenue">${event.ganancias}</div>`;
        }

        // Add notes if exists
        if (event.notas) {
            html += `<div class="event-notes">${event.notas}</div>`;
        }

        card.innerHTML = html;

        // Click to edit
        card.addEventListener('click', () => this.editEvent(event));

        return card;
    },

    // Update column counts
    updateColumnCounts() {
        const columns = ['solicitado', 'confirmado', 'pagado', 'finalizado'];

        columns.forEach(status => {
            const column = document.getElementById(`column-${status}`);
            const count = column ? column.children.length : 0;
            const badge = document.getElementById(`count-${status}`);

            if (badge) {
                badge.textContent = count;
            }
        });
    },

    // Update stats bar
    updateStats() {
        const totalEvents = this.events.length;
        const confirmed = this.events.filter(e =>
            e.status.toLowerCase().includes('confirmado') ||
            e.status.toLowerCase().includes('pagado')
        ).length;
        const upcoming = this.events.filter(e =>
            !e.status.toLowerCase().includes('finalizado') &&
            !e.status.toLowerCase().includes('cancelado')
        ).length;

        // Calculate total revenue
        let totalRevenue = 0;
        this.events.forEach(e => {
            if (e.ganancias) {
                // Extract numbers from revenue string
                const matches = e.ganancias.match(/\d+[,.]?\d*/g);
                if (matches) {
                    matches.forEach(match => {
                        const num = parseFloat(match.replace(',', ''));
                        if (!isNaN(num)) {
                            totalRevenue += num;
                        }
                    });
                }
            }
        });

        // Update DOM
        document.getElementById('total-events').textContent = totalEvents;
        document.getElementById('upcoming-events').textContent = upcoming;
        document.getElementById('confirmed-events').textContent = confirmed;
        document.getElementById('total-revenue').textContent =
            totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '$0';
    },

    // Show modal for adding/editing
    showModal(event = null) {
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');
        const title = document.getElementById('modal-title');
        const deleteBtn = document.getElementById('btn-delete-event');

        if (event) {
            // Edit mode
            title.textContent = 'Edit Event';
            this.currentEvent = event;

            // Show delete button
            if (deleteBtn) {
                deleteBtn.style.display = 'block';
            }

            // Fill form
            document.getElementById('event-row-index').value = event.rowIndex;
            document.getElementById('event-nombre').value = event.nombre;
            document.getElementById('event-fecha').value = event.fecha;
            document.getElementById('event-status').value = this.capitalizeStatus(this.normalizeStatus(event.status));
            document.getElementById('event-notas').value = event.notas || '';
            document.getElementById('event-ganancias').value = event.ganancias || '';
            document.getElementById('event-inventario').value = event.inventario || '';
        } else {
            // Add mode
            title.textContent = 'Add New Event';
            this.currentEvent = null;

            // Hide delete button
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }

            form.reset();
            document.getElementById('event-row-index').value = '';
        }

        modal.classList.add('active');
    },

    // Capitalize status for display
    capitalizeStatus(status) {
        const map = {
            'solicitado': 'Solicitado',
            'confirmado': 'Confirmado',
            'pagado': 'Pagado',
            'finalizado': 'Finalizado'
        };
        return map[status] || 'Solicitado';
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('event-modal');
        modal.classList.remove('active');
        this.currentEvent = null;
    },

    // Edit event
    editEvent(event) {
        this.showModal(event);
    },

    // Save event (create or update)
    async saveEvent() {
        const rowIndex = document.getElementById('event-row-index').value;
        const isUpdate = rowIndex !== '';

        const eventData = {
            action: isUpdate ? 'update' : 'create',
            rowIndex: isUpdate ? parseInt(rowIndex) : null,
            nombre: document.getElementById('event-nombre').value,
            fecha: document.getElementById('event-fecha').value,
            status: document.getElementById('event-status').value,
            notas: document.getElementById('event-notas').value,
            ganancias: document.getElementById('event-ganancias').value,
            inventario: document.getElementById('event-inventario').value
        };

        try {
            showLoading(true, 'Saving to Database...');

            // Send to Google Sheets
            const response = await fetch(this.SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            // Update local data
            if (isUpdate) {
                const index = this.events.findIndex(e => e.rowIndex === parseInt(rowIndex));
                if (index !== -1) {
                    this.events[index] = { ...this.events[index], ...eventData };
                }
            } else {
                this.events.push({
                    rowIndex: this.events.length + 2, // Approximate
                    ...eventData
                });
            }

            // Save to localStorage
            this.saveToLocalStorage();

            // Refresh display
            this.displayEvents();
            this.updateStats();

            showLoading(false);
            showToast(isUpdate ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            this.closeModal();

            // Reload from server after a delay
            setTimeout(() => this.loadEvents(), 2000);

        } catch (error) {
            showLoading(false);
            showToast('Error saving event: ' + error.message, 'error');
            console.error('Error:', error);
        }
    },

    // Delete event
    async deleteEvent() {
        if (!this.currentEvent) return;

        const confirmDelete = confirm(
            `Are you sure you want to delete "${this.currentEvent.nombre}"?\n\n` +
            `This will permanently remove it from Google Sheets.`
        );

        if (!confirmDelete) return;

        const deletedRowIndex = this.currentEvent.rowIndex;

        try {
            showLoading(true, 'Deleting from Database...');

            // Send delete request to Google Sheets
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    rowIndex: deletedRowIndex
                })
            });

            // Remove from local array
            this.events = this.events.filter(e => e.rowIndex !== deletedRowIndex);

            // Save to localStorage
            this.saveToLocalStorage();

            // Close modal first
            this.closeModal();

            // Refresh display
            this.displayEvents();
            this.updateStats();

            showLoading(false);
            showToast('Event deleted successfully!', 'success');

            // Reload from server after a delay to get updated row indices
            setTimeout(() => {
                this.loadEvents().catch(err => {
                    console.log('Background reload failed, using cached data');
                });
            }, 2000);

        } catch (error) {
            showLoading(false);
            showToast('Error deleting event: ' + error.message, 'error');
            console.error('Error:', error);
        }
    }
};

// Initialize when events view is shown
document.addEventListener('DOMContentLoaded', () => {
    // Listen for when events view becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'events-view' &&
                mutation.target.classList.contains('active')) {
                Events.init();
            }
        });
    });

    const eventsView = document.getElementById('events-view');
    if (eventsView) {
        observer.observe(eventsView, { attributes: true, attributeFilter: ['class'] });
    }
});
