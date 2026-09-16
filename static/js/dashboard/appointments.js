// ── APPOINTMENT MANAGEMENT ──────────────────────────────────────────

import { 
    fetchAppointments, 
    fetchAllAppointments, 
    cancelAppointmentAPI,
    checkAvailability,
    bookAppointment
} from './services.js';
import { showToast, formatDuration, formatTime } from './utils.js';
import { showBookAppointmentModal } from './modals.js';

let allAppointments = [];
let currentAppointmentFilter = 'all';

// ── Load Appointments ──────────────────────────────────────────────
export async function loadAppointments() {
    const container = document.getElementById('myAppointmentsContainer');
    
    try {
        const data = await fetchAppointments();
        
        if (data.success && data.appointments && data.appointments.length > 0) {
            allAppointments = data.appointments;
            updateAppointmentCounts(allAppointments);
            filterAppointments(currentAppointmentFilter);
        } else {
            allAppointments = [];
            updateAppointmentCounts([]);
            updateOverviewStats({ all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
            
            const badge = document.getElementById('appointmentBadge');
            if (badge) badge.style.display = 'none';
            
            if (container) {
                container.innerHTML = `
                    <div class="no-appointments">
                        <div class="icon">📅</div>
                        <h3>No Appointments</h3>
                        <p>You haven't booked any appointments yet. Click "Book New Appointment" to get started!</p>
                        <button class="btn-book-appointment" onclick="window.showBookAppointmentModal()" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 15px; font-size: 16px;">📅 Book New Appointment</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (container) {
            container.innerHTML = `
                <div class="no-appointments" style="border-color: #ef4444;">
                    <div class="icon">⚠️</div>
                    <h3>Error Loading Appointments</h3>
                    <p style="color: #ef4444;">There was a problem loading your appointments. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

// ── Filter Appointments ─────────────────────────────────────────────
export function filterAppointments(status) {
    currentAppointmentFilter = status;
    
    // Update tabs - use classes instead of inline styles
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.classList.remove('active');
        // Remove any inline styles that might interfere
        tab.style.background = '';
        tab.style.color = '';
        if (tab.dataset.tab === status) {
            tab.classList.add('active');
        }
    });
    
    // Filter appointments
    const container = document.getElementById('myAppointmentsContainer');
    if (!container) return;
    
    let filtered = allAppointments;
    if (status !== 'all') {
        filtered = allAppointments.filter(app => app.status === status);
    }
    
    renderAppointments(filtered, container);
}

// ── Render Appointments ─────────────────────────────────────────────
export function renderAppointments(appointments, container) {
    if (!container) return;
    
    const statusLabels = {
        'all': 'appointments',
        'pending': 'pending appointments',
        'confirmed': 'confirmed appointments',
        'completed': 'completed appointments',
        'cancelled': 'cancelled appointments'
    };
    
    if (appointments.length === 0) {
        const label = statusLabels[currentAppointmentFilter] || 'appointments';
        container.innerHTML = `
            <div class="no-appointments">
                <div class="icon">📅</div>
                <h3>No ${label}</h3>
                <p>${currentAppointmentFilter === 'all' ? 'You haven\'t booked any appointments yet.' : `You have no ${label} at the moment.`}</p>
                ${currentAppointmentFilter === 'all' ? '<button class="btn-book-appointment" onclick="window.showBookAppointmentModal()" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 15px; font-size: 16px;">📅 Book New Appointment</button>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '';
    appointments.forEach(app => {
        const statusClass = `status-${app.status}`;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        const canCancel = app.status === 'pending' || app.status === 'confirmed';
        
        const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
        const totalPrice = app.total_price || 0;
        const totalDuration = app.total_duration || 0;
        const formattedDuration = formatDuration(totalDuration);
        
        const dateObj = new Date(app.appointment_date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const timeDisplay = formatTime(app.appointment_time);
        
        html += `
            <div class="appointment-card" data-status="${app.status}">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-pet">🐕 ${app.pet_name}</div>
                        <div class="appointment-service">✂️ ${serviceNames}</div>
                        ${totalPrice > 0 ? `<div class="appointment-price">💰 ₱${totalPrice.toFixed(2)} • ⏱️ ${formattedDuration}</div>` : ''}
                    </div>
                    <span class="appointment-status ${statusClass}">${statusLabel}</span>
                </div>
                <div class="appointment-details">
                    <span class="detail-item">📅 ${formattedDate}</span>
                    <span class="detail-item">⏰ ${timeDisplay}</span>
                    ${app.notes ? `<span class="detail-item">📝 ${app.notes}</span>` : ''}
                </div>
                <div class="appointment-actions">
                    ${canCancel ? `<button class="btn-cancel-appointment" onclick="window.cancelAppointment(${app.id})">❌ Cancel</button>` : ''}
                    <button class="btn-view-details" onclick="window.showAppointmentDetails(${app.id})">📋 View Details</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ── Update Appointment Counts ──────────────────────────────────────
export function updateAppointmentCounts(appointments) {
    const counts = {
        all: appointments.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    };
    
    appointments.forEach(app => {
        if (counts.hasOwnProperty(app.status)) {
            counts[app.status]++;
        }
    });
    
    // Update tab counts
    const allEl = document.getElementById('allCount');
    const pendingEl = document.getElementById('pendingCount');
    const confirmedEl = document.getElementById('confirmedCount');
    const completedEl = document.getElementById('completedCount');
    const cancelledEl = document.getElementById('cancelledCount');
    
    if (allEl) allEl.textContent = counts.all;
    if (pendingEl) pendingEl.textContent = counts.pending;
    if (confirmedEl) confirmedEl.textContent = counts.confirmed;
    if (completedEl) completedEl.textContent = counts.completed;
    if (cancelledEl) cancelledEl.textContent = counts.cancelled;
    
    updateOverviewStats(counts);
}

// ── Update Overview Stats ──────────────────────────────────────────
export function updateOverviewStats(counts) {
    const appointmentCountEl = document.getElementById('appointmentCount');
    if (appointmentCountEl) appointmentCountEl.textContent = counts.all;
    
    const pendingCountEl = document.getElementById('pendingCountOverview');
    if (pendingCountEl) pendingCountEl.textContent = counts.pending;
    
    const confirmedCountEl = document.getElementById('confirmedCountOverview');
    if (confirmedCountEl) confirmedCountEl.textContent = counts.confirmed;
    
    const completedCountEl = document.getElementById('completedCountOverview');
    if (completedCountEl) completedCountEl.textContent = counts.completed;
    
    const cancelledCountEl = document.getElementById('cancelledCountOverview');
    if (cancelledCountEl) cancelledCountEl.textContent = counts.cancelled;
    
    const upcomingCountEl = document.getElementById('upcomingCount');
    if (upcomingCountEl) {
        upcomingCountEl.textContent = counts.pending + counts.confirmed;
    }
    
    const badge = document.getElementById('appointmentBadge');
    if (badge) {
        const upcoming = counts.pending + counts.confirmed;
        if (upcoming > 0) {
            badge.textContent = upcoming;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ── Show Appointment Details ──────────────────────────────────────
export function showAppointmentDetails(appointmentId) {
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const totalPrice = app.total_price || 0;
    const totalDuration = app.total_duration || 0;
    const formattedDuration = formatDuration(totalDuration);
    
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeDisplay = formatTime(app.appointment_time);
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
    
    alert(
        `📋 Appointment Details\n\n` +
        `🐕 Pet: ${app.pet_name}\n` +
        `✂️ Services: ${serviceNames}\n` +
        `💰 Total: ₱${totalPrice.toFixed(2)}\n` +
        `⏱️ Duration: ${formattedDuration}\n` +
        `📅 Date: ${formattedDate}\n` +
        `⏰ Time: ${timeDisplay}\n` +
        `📌 Status: ${statusLabel}\n` +
        `${app.notes ? `📝 Notes: ${app.notes}` : ''}`
    );
}

// ── Cancel Appointment ─────────────────────────────────────────────
export async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
        const data = await cancelAppointmentAPI(appointmentId);
        if (data.success) {
            showToast('✅ Appointment cancelled successfully.', 'success');
            loadAppointments();
        } else {
            showToast('❌ ' + (data.message || 'Error cancelling appointment.'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Make functions globally available ──────────────────────────────
window.showAppointmentDetails = showAppointmentDetails;
window.cancelAppointment = cancelAppointment;
window.filterAppointments = filterAppointments;