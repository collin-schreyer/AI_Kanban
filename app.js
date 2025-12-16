const API_URL = 'http://localhost:3000/api';

// State
let projects = [];
let currentUser = null;
let lastLogin = null;
let draggedCard = null;

// Initialize
function init() {
    const savedUser = sessionStorage.getItem('kanbanUser');
    const savedLastLogin = sessionStorage.getItem('kanbanLastLogin');
    
    if (savedUser) {
        currentUser = savedUser;
        lastLogin = savedLastLogin;
        showApp();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
    }
}

// Auth
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.toLowerCase().trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user.displayName;
            lastLogin = data.user.lastLogin;
            sessionStorage.setItem('kanbanUser', currentUser);
            sessionStorage.setItem('kanbanLastLogin', lastLogin || '');
            showApp();
            
            // AI welcome after a short delay
            setTimeout(() => getAiWelcome(), 2000);
        } else {
            errorDiv.textContent = 'Invalid username or password';
        }
    } catch (err) {
        errorDiv.textContent = 'Connection error. Is the server running?';
    }
}

function handleLogout() {
    logActivity(`${currentUser} logged out`);
    sessionStorage.removeItem('kanbanUser');
    sessionStorage.removeItem('kanbanLastLogin');
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

async function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('currentUserDisplay').textContent = `Logged in as: ${currentUser}`;
    
    await loadProjects();
    await loadActivity();
}

// Data Loading
async function loadProjects() {
    try {
        const res = await fetch(`${API_URL}/projects`);
        projects = await res.json();
        renderAllCards();
    } catch (err) {
        console.error('Failed to load projects:', err);
        showToast('Failed to load projects', 'error');
    }
}

async function loadActivity() {
    try {
        const res = await fetch(`${API_URL}/activity`);
        const activity = await res.json();
        renderActivityLog(activity);
    } catch (err) {
        console.error('Failed to load activity:', err);
    }
}

async function logActivity(message) {
    try {
        await fetch(`${API_URL}/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser, message })
        });
        loadActivity();
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
}

// Rendering
function renderAllCards() {
    ['todo', 'inprogress', 'review', 'done'].forEach(status => {
        renderColumn(status);
    });
    updateCounts();
}

function renderColumn(status) {
    const container = document.getElementById(status);
    const statusProjects = projects.filter(p => p.status === status);
    
    container.innerHTML = statusProjects.map(project => createCardHTML(project)).join('');
    
    container.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });
}

function createCardHTML(project) {
    const isOverdue = project.due_date && new Date(project.due_date) < new Date();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    
    return `
        <div class="kanban-card" draggable="true" data-id="${project.id}" id="card-${project.id}" onclick="openCardDetail(${project.id})">
            <div class="card-header">
                <span class="card-title">${project.name}</span>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button onclick="editProject(${project.id})" title="Edit">✏️</button>
                    <button onclick="deleteProject(${project.id})" title="Delete">🗑️</button>
                </div>
            </div>
            ${project.description ? `<p class="card-description">${project.description}</p>` : ''}
            <div class="card-meta">
                <span class="card-owner owner-${project.owner}">${project.owner}</span>
                <span class="card-priority priority-${project.priority}">${project.priority}</span>
                ${project.due_date ? `<span class="card-due ${isOverdue ? 'overdue' : ''}">📅 ${project.due_date}</span>` : ''}
            </div>
            ${tags.length > 0 ? `<div class="card-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

function updateCounts() {
    ['todo', 'inprogress', 'review', 'done'].forEach(status => {
        const count = projects.filter(p => p.status === status).length;
        document.getElementById(`${status}-count`).textContent = count;
    });
}

function renderActivityLog(activity) {
    const container = document.getElementById('activityLog');
    container.innerHTML = activity.slice(0, 20).map(a => `
        <div class="activity-item">
            <span><strong>${a.user}:</strong> ${a.message}</span>
            <span class="activity-time">${formatDate(a.created_at)}</span>
        </div>
    `).join('');
}


// Drag and Drop
function dragStart(e) {
    draggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
    draggedCard = null;
}

function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

async function drop(e) {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('text/plain'));
    const newStatus = e.currentTarget.id;
    
    const project = projects.find(p => p.id === cardId);
    if (project && project.status !== newStatus) {
        await updateProjectStatus(project, newStatus);
    }
}

async function updateProjectStatus(project, newStatus) {
    try {
        await fetch(`${API_URL}/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...project,
                status: newStatus,
                dueDate: project.due_date,
                user: currentUser
            })
        });
        
        await loadProjects();
        await loadActivity();
        showToast(`Moved "${project.name}" to ${formatStatus(newStatus)}`);
    } catch (err) {
        console.error('Failed to update project:', err);
        showToast('Failed to update project', 'error');
    }
}

// Project CRUD
function openAddProjectModal() {
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectModal').style.display = 'block';
}

function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectOwner').value = project.owner;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectDueDate').value = project.due_date || '';
    document.getElementById('projectTags').value = (project.tags || []).join(', ');
    
    document.getElementById('projectModal').style.display = 'block';
}

async function saveProject(e) {
    e.preventDefault();
    
    const id = document.getElementById('projectId').value;
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        owner: document.getElementById('projectOwner').value,
        priority: document.getElementById('projectPriority').value,
        dueDate: document.getElementById('projectDueDate').value,
        tags: document.getElementById('projectTags').value.split(',').map(t => t.trim()).filter(t => t),
        user: currentUser
    };
    
    try {
        if (id) {
            const existing = projects.find(p => p.id === parseInt(id));
            await fetch(`${API_URL}/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...projectData, status: existing.status })
            });
            showToast(`Updated "${projectData.name}"`);
        } else {
            await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            showToast(`Created "${projectData.name}"`);
        }
        
        await loadProjects();
        await loadActivity();
        closeModal('projectModal');
    } catch (err) {
        console.error('Failed to save project:', err);
        showToast('Failed to save project', 'error');
    }
}

async function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (project && confirm(`Delete "${project.name}"?`)) {
        try {
            await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser })
            });
            
            await loadProjects();
            await loadActivity();
            showToast(`Deleted "${project.name}"`);
        } catch (err) {
            console.error('Failed to delete project:', err);
            showToast('Failed to delete project', 'error');
        }
    }
}

// Card Detail View
async function openCardDetail(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    // Fetch comments and history
    const [commentsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/projects/${id}/comments`),
        fetch(`${API_URL}/projects/${id}/history`)
    ]);
    
    const comments = await commentsRes.json();
    const history = await historyRes.json();
    
    const isOverdue = project.due_date && new Date(project.due_date) < new Date();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    
    const html = `
        <div class="detail-header">
            <h2>${project.name}</h2>
            <div class="detail-meta">
                <span class="card-owner owner-${project.owner}">${project.owner}</span>
                <span class="card-priority priority-${project.priority}">${project.priority}</span>
                ${project.due_date ? `<span class="card-due ${isOverdue ? 'overdue' : ''}">📅 ${project.due_date}</span>` : ''}
                <span>Status: ${formatStatus(project.status)}</span>
            </div>
        </div>
        
        <div class="detail-description">
            <strong>📄 About this project:</strong><br><br>
            ${project.description || 'No description provided.'}
        </div>
        
        ${tags.length > 0 ? `
            <div class="detail-section">
                <h3>🏷️ Tags</h3>
                <div class="card-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
        ` : ''}
        
        <div class="detail-section">
            <h3>📜 Timeline</h3>
            <div class="timeline">
                ${history.length > 0 ? history.map(h => `
                    <div class="timeline-item action-${h.action}">
                        <div class="timeline-header">
                            <span class="timeline-user">${h.user}</span>
                            <span class="timeline-date">${formatDate(h.created_at)}</span>
                        </div>
                        <div class="timeline-details">${h.details}</div>
                    </div>
                `).join('') : '<p style="color: rgba(255,255,255,0.5);">No history yet</p>'}
            </div>
        </div>
        
        <div class="detail-section">
            <h3>💬 Comments (${comments.length})</h3>
            <div class="comments-list" id="commentsList-${id}">
                ${renderComments(comments)}
            </div>
            <div class="comment-form">
                <textarea id="newComment-${id}" placeholder="Write a comment..." rows="2"></textarea>
                <button class="btn btn-primary" onclick="addComment(${id})">Post</button>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>⚡ Quick Actions</h3>
            <div class="quick-actions">
                <button class="btn btn-secondary" onclick="moveToStatus(${id}, 'todo')">→ To Do</button>
                <button class="btn btn-secondary" onclick="moveToStatus(${id}, 'inprogress')">→ In Progress</button>
                <button class="btn btn-secondary" onclick="moveToStatus(${id}, 'review')">→ Review</button>
                <button class="btn btn-secondary" onclick="moveToStatus(${id}, 'done')">→ Done</button>
            </div>
        </div>
    `;
    
    document.getElementById('cardDetailContent').innerHTML = html;
    document.getElementById('cardDetailModal').style.display = 'block';
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p style="color: rgba(255,255,255,0.5);">No comments yet. Be the first to comment!</p>';
    }
    
    return comments.map(c => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author owner-${c.author}">${c.author}</span>
                <span class="comment-date">${formatDate(c.created_at)}</span>
            </div>
            <p class="comment-text">${c.text}</p>
        </div>
    `).join('');
}

async function addComment(projectId) {
    const textarea = document.getElementById(`newComment-${projectId}`);
    const text = textarea.value.trim();
    
    if (!text) return;
    
    try {
        await fetch(`${API_URL}/projects/${projectId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: currentUser, text })
        });
        
        // Refresh the detail view
        await openCardDetail(projectId);
        await loadActivity();
        showToast('Comment added');
    } catch (err) {
        console.error('Failed to add comment:', err);
        showToast('Failed to add comment', 'error');
    }
}

async function moveToStatus(id, newStatus) {
    const project = projects.find(p => p.id === id);
    if (project && project.status !== newStatus) {
        await updateProjectStatus(project, newStatus);
        closeModal('cardDetailModal');
    }
}


// AI Assistant
let aiChatOpen = true;
let aiExpanded = false;

function toggleAiChat() {
    aiChatOpen = !aiChatOpen;
    document.getElementById('aiBody').classList.toggle('collapsed', !aiChatOpen);
    document.getElementById('aiToggle').textContent = aiChatOpen ? '▼' : '▲';
}

function toggleAiExpand() {
    aiExpanded = !aiExpanded;
    document.getElementById('aiAssistant').classList.toggle('expanded', aiExpanded);
    document.querySelector('.ai-expand-btn').textContent = aiExpanded ? '⛶' : '⛶';
    document.querySelector('.ai-expand-btn').title = aiExpanded ? 'Collapse' : 'Expand';
}

async function getAiWelcome() {
    const messagesDiv = document.getElementById('aiMessages');
    messagesDiv.innerHTML = '<div class="ai-message assistant typing">Thinking...</div>';
    
    try {
        const res = await fetch(`${API_URL}/ai/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser, lastLogin })
        });
        
        const data = await res.json();
        messagesDiv.innerHTML = `<div class="ai-message assistant">${data.response}</div>`;
    } catch (err) {
        messagesDiv.innerHTML = `<div class="ai-message assistant">Welcome back, ${currentUser}! How can I help you today?</div>`;
    }
}

function handleAiKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiMessage();
    }
}

async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesDiv = document.getElementById('aiMessages');
    
    // Add user message
    messagesDiv.innerHTML += `<div class="ai-message user">${message}</div>`;
    input.value = '';
    
    // Add typing indicator
    messagesDiv.innerHTML += '<div class="ai-message assistant typing" id="aiTyping">Thinking...</div>';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
        const res = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, user: currentUser })
        });
        
        const data = await res.json();
        
        // Remove typing indicator and add response
        document.getElementById('aiTyping')?.remove();
        messagesDiv.innerHTML += `<div class="ai-message assistant">${data.response}</div>`;
    } catch (err) {
        document.getElementById('aiTyping')?.remove();
        messagesDiv.innerHTML += `<div class="ai-message assistant">Sorry, I'm having trouble connecting. Please try again.</div>`;
    }
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Filtering
function filterCards() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const ownerFilter = document.getElementById('ownerFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    document.querySelectorAll('.kanban-card').forEach(card => {
        const id = parseInt(card.dataset.id);
        const project = projects.find(p => p.id === id);
        
        if (!project) return;
        
        const matchesSearch = project.name.toLowerCase().includes(searchTerm) || 
                             (project.description && project.description.toLowerCase().includes(searchTerm));
        const matchesOwner = !ownerFilter || project.owner === ownerFilter;
        const matchesPriority = !priorityFilter || project.priority === priorityFilter;
        
        card.classList.toggle('hidden', !(matchesSearch && matchesOwner && matchesPriority));
    });
}

// Export
function exportData() {
    const data = {
        projects,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
}

// Utilities
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function formatStatus(status) {
    const map = { 'todo': 'To Do', 'inprogress': 'In Progress', 'review': 'Review', 'done': 'Done' };
    return map[status] || status;
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'error' ? '#e53e3e' : '#48bb78';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Event Listeners
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
    if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        openAddProjectModal();
    }
});

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load schedule if switching to schedule tab
    if (tabName === 'schedule') {
        const content = document.getElementById('scheduleContent');
        if (content.querySelector('.schedule-loading')) {
            // Auto-load on first visit
        }
    }
}

// Collin's Schedule
async function refreshSchedule() {
    const content = document.getElementById('scheduleContent');
    content.innerHTML = '<div class="schedule-loading">🤖 AI is analyzing projects and generating Collin\'s optimized schedule...</div>';
    
    try {
        const res = await fetch(`${API_URL}/schedule`);
        const data = await res.json();
        
        if (data.error) {
            content.innerHTML = '<div class="schedule-loading">Failed to generate schedule. Please try again.</div>';
            return;
        }
        
        renderSchedule(data.schedule, data.generatedAt);
    } catch (err) {
        console.error('Failed to load schedule:', err);
        content.innerHTML = '<div class="schedule-loading">Failed to connect. Is the server running?</div>';
    }
}

function renderSchedule(schedule, generatedAt) {
    const content = document.getElementById('scheduleContent');
    
    const renderItems = (items, sectionClass) => {
        if (!items || items.length === 0) return '<p style="color: rgba(255,255,255,0.5); padding: 10px;">No items</p>';
        return items.map(item => `
            <div class="schedule-item priority-${item.priority || 'medium'}">
                <div class="schedule-item-header">
                    <span class="schedule-item-title">${item.name}</span>
                    <div class="schedule-item-meta">
                        <span class="schedule-item-owner owner-${item.owner}">${item.owner}</span>
                    </div>
                </div>
                <p class="schedule-item-description">${item.description || ''}</p>
                ${item.reason ? `<div class="schedule-item-reason">${item.reason}</div>` : ''}
            </div>
        `).join('');
    };
    
    content.innerHTML = `
        <div class="ai-summary">
            <h4>🤖 AI Analysis</h4>
            <p>${schedule.summary || 'Schedule generated successfully.'}</p>
        </div>
        
        ${schedule.urgent && schedule.urgent.length > 0 ? `
        <div class="schedule-section urgent">
            <h3>🔴 Urgent - Do Today</h3>
            ${renderItems(schedule.urgent)}
        </div>
        ` : ''}
        
        ${schedule.thisWeek && schedule.thisWeek.length > 0 ? `
        <div class="schedule-section thisweek">
            <h3>🟡 This Week</h3>
            ${renderItems(schedule.thisWeek)}
        </div>
        ` : ''}
        
        ${schedule.upcoming && schedule.upcoming.length > 0 ? `
        <div class="schedule-section upcoming">
            <h3>🟢 Upcoming</h3>
            ${renderItems(schedule.upcoming)}
        </div>
        ` : ''}
        
        ${schedule.backlog && schedule.backlog.length > 0 ? `
        <div class="schedule-section backlog">
            <h3>⚪ Backlog</h3>
            ${renderItems(schedule.backlog)}
        </div>
        ` : ''}
        
        <p class="schedule-updated">Last updated: ${new Date(generatedAt).toLocaleString()}</p>
    `;
}

// Report Generation
let currentReport = null;

async function generateReport(type) {
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');
    
    content.innerHTML = '<div class="schedule-loading">🤖 Generating ' + type + ' report for management...</div>';
    modal.style.display = 'block';
    
    try {
        const res = await fetch(`${API_URL}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        
        const data = await res.json();
        
        if (data.error) {
            content.innerHTML = '<div class="schedule-loading">Failed to generate report. Please try again.</div>';
            return;
        }
        
        currentReport = data.report;
        renderReport(data.report);
    } catch (err) {
        console.error('Failed to generate report:', err);
        content.innerHTML = '<div class="schedule-loading">Failed to connect. Is the server running?</div>';
    }
}

function renderReport(report) {
    const content = document.getElementById('reportContent');
    
    const renderReportItems = (items, className = '') => {
        if (!items || items.length === 0) return '<p style="color: rgba(255,255,255,0.5);">None</p>';
        return items.map(item => `
            <div class="report-item ${className}">
                <div class="report-item-header">
                    <span class="report-item-title">${item.project || item}</span>
                    ${item.owner ? `<span class="report-item-status owner-${item.owner}">${item.owner}</span>` : ''}
                </div>
                ${item.description ? `<p class="report-item-details">${item.description}</p>` : ''}
                ${item.expectedCompletion ? `<p class="report-item-details"><strong>Expected:</strong> ${item.expectedCompletion}</p>` : ''}
                ${item.issue ? `<p class="report-item-details"><strong>Issue:</strong> ${item.issue}</p>` : ''}
                ${item.needsFrom ? `<p class="report-item-details"><strong>Needs input from:</strong> ${item.needsFrom}</p>` : ''}
            </div>
        `).join('');
    };
    
    content.innerHTML = `
        <div class="report-header">
            <h2>📊 ${report.title || 'Status Report'}</h2>
            <p class="report-date">${report.date || new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="report-summary">
            <h3>Executive Summary</h3>
            <p>${report.executiveSummary || 'Report generated successfully.'}</p>
        </div>
        
        ${report.stats ? `
        <div class="report-stats">
            <div class="report-stat">
                <div class="report-stat-value">${report.stats.totalProjects || 0}</div>
                <div class="report-stat-label">Total Projects</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${report.stats.inProgress || 0}</div>
                <div class="report-stat-label">In Progress</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${report.stats.completed || 0}</div>
                <div class="report-stat-label">Completed</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value" style="color: ${report.stats.blocked > 0 ? '#fc8181' : '#68d391'}">${report.stats.blocked || 0}</div>
                <div class="report-stat-label">Blocked</div>
            </div>
        </div>
        ` : ''}
        
        <div class="report-section">
            <h3>✅ Accomplishments</h3>
            ${renderReportItems(report.accomplishments, 'completed')}
        </div>
        
        <div class="report-section">
            <h3>🔄 In Progress</h3>
            ${renderReportItems(report.inProgress, 'in-progress')}
        </div>
        
        <div class="report-section">
            <h3>📅 Upcoming</h3>
            ${renderReportItems(report.upcoming)}
        </div>
        
        ${report.blockers && report.blockers.length > 0 ? `
        <div class="report-section">
            <h3>🚧 Blockers</h3>
            ${renderReportItems(report.blockers, 'blocked')}
        </div>
        ` : ''}
        
        ${report.recommendations && report.recommendations.length > 0 ? `
        <div class="report-section">
            <h3>💡 Recommendations</h3>
            <ul style="padding-left: 20px;">
                ${report.recommendations.map(r => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${report.nextSteps ? `
        <div class="report-summary">
            <h3>➡️ Next Steps</h3>
            <p>${report.nextSteps}</p>
        </div>
        ` : ''}
        
        <div id="reportText" style="display:none;"></div>
    `;
    
    // Store plain text version for copying
    document.getElementById('reportText').textContent = generatePlainTextReport(report);
}

function generatePlainTextReport(report) {
    let text = `${report.title || 'Status Report'}\n`;
    text += `${report.date || new Date().toLocaleDateString()}\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    text += `EXECUTIVE SUMMARY\n${report.executiveSummary || ''}\n\n`;
    
    if (report.stats) {
        text += `STATS\n`;
        text += `- Total Projects: ${report.stats.totalProjects || 0}\n`;
        text += `- In Progress: ${report.stats.inProgress || 0}\n`;
        text += `- Completed: ${report.stats.completed || 0}\n`;
        text += `- Blocked: ${report.stats.blocked || 0}\n\n`;
    }
    
    if (report.accomplishments?.length) {
        text += `ACCOMPLISHMENTS\n`;
        report.accomplishments.forEach(a => {
            text += `- ${a.project} (${a.owner}): ${a.description}\n`;
        });
        text += '\n';
    }
    
    if (report.inProgress?.length) {
        text += `IN PROGRESS\n`;
        report.inProgress.forEach(a => {
            text += `- ${a.project} (${a.owner}): ${a.description}\n`;
        });
        text += '\n';
    }
    
    if (report.blockers?.length) {
        text += `BLOCKERS\n`;
        report.blockers.forEach(b => {
            text += `- ${b.project}: ${b.issue} (Needs: ${b.needsFrom})\n`;
        });
        text += '\n';
    }
    
    if (report.nextSteps) {
        text += `NEXT STEPS\n${report.nextSteps}\n`;
    }
    
    return text;
}

function copyReport() {
    const text = document.getElementById('reportText')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showToast('Report copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function downloadReport() {
    const text = document.getElementById('reportText')?.textContent || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collin-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded!');
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
