const API_URL = window.location.origin + '/api';

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
        populateProjectFilter();
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
let allSubtasks = [];

async function renderAllCards() {
    // Load subtasks
    try {
        const res = await fetch(`${API_URL}/subtasks`);
        allSubtasks = await res.json();
    } catch (err) {
        console.error('Failed to load subtasks:', err);
        allSubtasks = [];
    }
    
    ['todo', 'inprogress', 'review', 'done'].forEach(status => {
        renderColumn(status);
    });
    updateCounts();
}

const CARDS_PER_COLUMN = 10;
const expandedColumns = { todo: false, inprogress: false, review: false, done: false };

function renderColumn(status) {
    const container = document.getElementById(status);
    const statusProjects = projects.filter(p => p.status === status);
    const statusSubtasks = allSubtasks.filter(s => s.status === status);
    
    // Combine all cards
    const allCards = [
        ...statusProjects.map(p => ({ type: 'project', data: p })),
        ...statusSubtasks.map(s => ({ type: 'subtask', data: s }))
    ];
    
    const totalCount = allCards.length;
    const isExpanded = expandedColumns[status];
    const visibleCards = isExpanded ? allCards : allCards.slice(0, CARDS_PER_COLUMN);
    const hiddenCount = totalCount - CARDS_PER_COLUMN;
    
    // Render visible cards
    let html = visibleCards.map(card => {
        if (card.type === 'project') {
            return createCardHTML(card.data);
        } else {
            return createSubtaskCardHTML(card.data);
        }
    }).join('');
    
    // Add expand/collapse button if needed
    if (totalCount > CARDS_PER_COLUMN) {
        if (isExpanded) {
            html += `<button class="expand-btn" onclick="toggleColumnExpand('${status}')">Show Less ▲</button>`;
        } else {
            html += `<button class="expand-btn" onclick="toggleColumnExpand('${status}')">Show ${hiddenCount} More ▼</button>`;
        }
    }
    
    container.innerHTML = html;
    
    // Add drag events to project cards
    container.querySelectorAll('.kanban-card:not(.subtask-card)').forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });
    
    // Add drag events to subtask cards
    container.querySelectorAll('.subtask-card').forEach(card => {
        card.addEventListener('dragstart', dragStartSubtask);
        card.addEventListener('dragend', dragEnd);
    });
}

function toggleColumnExpand(status) {
    expandedColumns[status] = !expandedColumns[status];
    renderColumn(status);
}

function createCardHTML(project) {
    const isOverdue = project.due_date && new Date(project.due_date) < new Date();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const projectSubtasks = allSubtasks.filter(s => s.project_id === project.id);
    const completedSubtasks = projectSubtasks.filter(s => s.status === 'done').length;
    
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
                ${projectSubtasks.length > 0 ? `<span class="card-subtask-count">📝 ${completedSubtasks}/${projectSubtasks.length}</span>` : ''}
            </div>
            ${tags.length > 0 ? `<div class="card-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

function createSubtaskCardHTML(subtask) {
    const parentProject = projects.find(p => p.id === subtask.project_id);
    const isOverdue = subtask.due_date && new Date(subtask.due_date) < new Date();
    
    return `
        <div class="kanban-card subtask-card" draggable="true" data-subtask-id="${subtask.id}" data-project-id="${subtask.project_id}" onclick="openSubtaskDetail(${subtask.id}, ${subtask.project_id})">
            <div class="subtask-parent-label owner-${parentProject?.owner || 'default'}">
                ${parentProject?.name || 'Unknown Project'}
            </div>
            <div class="card-header">
                <span class="card-title">${subtask.name}</span>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button onclick="editSubtask(${subtask.id}, ${subtask.project_id})" title="Edit">✏️</button>
                    <button onclick="deleteSubtask(${subtask.id}, ${subtask.project_id})" title="Delete">🗑️</button>
                </div>
            </div>
            ${subtask.description ? `<p class="card-description">${subtask.description}</p>` : ''}
            <div class="card-meta">
                ${subtask.assignee ? `<span class="card-owner owner-${subtask.assignee}">${subtask.assignee}</span>` : '<span class="card-owner" style="background: #4a5568;">Unassigned</span>'}
                ${subtask.due_date ? `<span class="card-due ${isOverdue ? 'overdue' : ''}">📅 ${subtask.due_date}</span>` : ''}
            </div>
        </div>
    `;
}

function updateCounts() {
    ['todo', 'inprogress', 'review', 'done'].forEach(status => {
        const projectCount = projects.filter(p => p.status === status).length;
        const subtaskCount = allSubtasks.filter(s => s.status === status).length;
        const totalCount = projectCount + subtaskCount;
        document.getElementById(`${status}-count`).textContent = totalCount;
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
let isSubtaskDrag = false;

function dragStart(e) {
    isSubtaskDrag = false;
    draggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function dragStartSubtask(e) {
    isSubtaskDrag = true;
    draggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.subtaskId);
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
    
    if (isSubtaskDrag) {
        // Handle subtask drop
        const subtask = allSubtasks.find(s => s.id === cardId);
        if (subtask && subtask.status !== newStatus) {
            await updateSubtaskStatus(subtask, newStatus);
        }
    } else {
        // Handle project drop
        const project = projects.find(p => p.id === cardId);
        if (project && project.status !== newStatus) {
            await updateProjectStatus(project, newStatus);
        }
    }
    isSubtaskDrag = false;
}

async function updateSubtaskStatus(subtask, newStatus) {
    try {
        await fetch(`${API_URL}/subtasks/${subtask.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...subtask,
                status: newStatus,
                dueDate: subtask.due_date,
                user: currentUser
            })
        });
        
        await renderAllCards();
        await loadActivity();
        showToast(`Moved subtask to ${formatStatus(newStatus)}`);
    } catch (err) {
        console.error('Failed to update subtask:', err);
        showToast('Failed to update subtask', 'error');
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
    
    // Fetch comments, history, and subtasks
    const [commentsRes, historyRes, subtasksRes] = await Promise.all([
        fetch(`${API_URL}/projects/${id}/comments`),
        fetch(`${API_URL}/projects/${id}/history`),
        fetch(`${API_URL}/projects/${id}/subtasks`)
    ]);
    
    const comments = await commentsRes.json();
    const history = await historyRes.json();
    const subtasks = await subtasksRes.json();
    
    const isOverdue = project.due_date && new Date(project.due_date) < new Date();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    
    const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
    const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    
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
        
        <div class="detail-section subtasks-section">
            <div class="subtasks-header">
                <h3>📝 Sub-Tasks (${completedSubtasks}/${subtasks.length})</h3>
                <button class="btn btn-secondary" onclick="openAddSubtaskModal(${id})">+ Add Sub-Task</button>
            </div>
            ${subtasks.length > 0 ? `
                <div class="subtask-progress">
                    <div class="subtask-progress-bar">
                        <div class="subtask-progress-fill" style="width: ${subtaskProgress}%"></div>
                    </div>
                    <div class="subtask-progress-text">${subtaskProgress}% complete</div>
                </div>
            ` : ''}
            <div class="subtask-list" id="subtaskList-${id}">
                ${renderSubtasks(subtasks, id)}
            </div>
        </div>
        
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

// Subtasks
function renderSubtasks(subtasks, projectId) {
    if (!subtasks || subtasks.length === 0) {
        return '<p style="color: rgba(255,255,255,0.5);">No sub-tasks yet. Add one to break down this project.</p>';
    }
    
    return subtasks.map(s => `
        <div class="subtask-item">
            <input type="checkbox" class="subtask-checkbox" 
                ${s.status === 'done' ? 'checked' : ''} 
                onchange="toggleSubtask(${s.id}, ${projectId}, this.checked)">
            <div class="subtask-content">
                <div class="subtask-name ${s.status === 'done' ? 'completed' : ''}">${s.name}</div>
                <div class="subtask-meta">
                    ${s.assignee ? `<span class="owner-${s.assignee}" style="padding: 2px 8px; border-radius: 10px;">${s.assignee}</span>` : ''}
                    ${s.due_date ? `<span>📅 ${s.due_date}</span>` : ''}
                </div>
            </div>
            <div class="subtask-actions">
                <button onclick="editSubtask(${s.id}, ${projectId})" title="Edit">✏️</button>
                <button onclick="deleteSubtask(${s.id}, ${projectId})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openAddSubtaskModal(projectId) {
    document.getElementById('subtaskModalTitle').textContent = 'Add Sub-Task';
    document.getElementById('subtaskForm').reset();
    document.getElementById('subtaskId').value = '';
    document.getElementById('subtaskProjectId').value = projectId;
    document.getElementById('subtaskModal').style.display = 'block';
}

async function saveSubtask(e) {
    e.preventDefault();
    
    const subtaskId = document.getElementById('subtaskId').value;
    const projectId = document.getElementById('subtaskProjectId').value;
    const data = {
        name: document.getElementById('subtaskName').value,
        description: document.getElementById('subtaskDescription').value,
        assignee: document.getElementById('subtaskAssignee').value,
        dueDate: document.getElementById('subtaskDueDate').value,
        user: currentUser
    };
    
    try {
        if (subtaskId) {
            await fetch(`${API_URL}/subtasks/${subtaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, status: 'todo' })
            });
            showToast('Sub-task updated');
        } else {
            await fetch(`${API_URL}/projects/${projectId}/subtasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast('Sub-task added');
        }
        
        closeModal('subtaskModal');
        await openCardDetail(parseInt(projectId));
        await loadActivity();
    } catch (err) {
        console.error('Failed to save subtask:', err);
        showToast('Failed to save sub-task', 'error');
    }
}

async function toggleSubtask(subtaskId, projectId, completed) {
    try {
        const res = await fetch(`${API_URL}/projects/${projectId}/subtasks`);
        const subtasks = await res.json();
        const subtask = subtasks.find(s => s.id === subtaskId);
        
        if (subtask) {
            await fetch(`${API_URL}/subtasks/${subtaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...subtask,
                    status: completed ? 'done' : 'todo',
                    user: currentUser
                })
            });
            
            await openCardDetail(projectId);
            await loadActivity();
        }
    } catch (err) {
        console.error('Failed to toggle subtask:', err);
    }
}

async function editSubtask(subtaskId, projectId) {
    try {
        const res = await fetch(`${API_URL}/projects/${projectId}/subtasks`);
        const subtasks = await res.json();
        const subtask = subtasks.find(s => s.id === subtaskId);
        
        if (subtask) {
            document.getElementById('subtaskModalTitle').textContent = 'Edit Sub-Task';
            document.getElementById('subtaskId').value = subtask.id;
            document.getElementById('subtaskProjectId').value = projectId;
            document.getElementById('subtaskName').value = subtask.name;
            document.getElementById('subtaskDescription').value = subtask.description || '';
            document.getElementById('subtaskAssignee').value = subtask.assignee || '';
            document.getElementById('subtaskDueDate').value = subtask.due_date || '';
            document.getElementById('subtaskModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Failed to load subtask:', err);
    }
}

async function deleteSubtask(subtaskId, projectId) {
    if (!confirm('Delete this sub-task?')) return;
    
    try {
        await fetch(`${API_URL}/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser })
        });
        
        showToast('Sub-task deleted');
        await renderAllCards();
        await loadActivity();
    } catch (err) {
        console.error('Failed to delete subtask:', err);
        showToast('Failed to delete sub-task', 'error');
    }
}

async function openSubtaskDetail(subtaskId, projectId) {
    const subtask = allSubtasks.find(s => s.id === subtaskId);
    const parentProject = projects.find(p => p.id === projectId);
    
    if (!subtask || !parentProject) return;
    
    const isOverdue = subtask.due_date && new Date(subtask.due_date) < new Date();
    
    const html = `
        <div class="detail-header">
            <div class="subtask-parent-label owner-${parentProject.owner}" style="margin-bottom: 10px; display: inline-block;">
                📁 ${parentProject.name}
            </div>
            <h2>${subtask.name}</h2>
            <div class="detail-meta">
                ${subtask.assignee ? `<span class="card-owner owner-${subtask.assignee}">${subtask.assignee}</span>` : '<span class="card-owner" style="background: #4a5568;">Unassigned</span>'}
                ${subtask.due_date ? `<span class="card-due ${isOverdue ? 'overdue' : ''}">📅 ${subtask.due_date}</span>` : ''}
                <span>Status: ${formatStatus(subtask.status)}</span>
            </div>
        </div>
        
        <div class="detail-description">
            <strong>📄 Sub-Task Description:</strong><br><br>
            ${subtask.description || 'No description provided.'}
        </div>
        
        <div class="detail-section">
            <h3>📁 Parent Project</h3>
            <div class="parent-project-info" onclick="openCardDetail(${parentProject.id}); closeModal('cardDetailModal');" style="cursor: pointer; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-top: 10px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${parentProject.name}</div>
                <div class="card-meta">
                    <span class="card-owner owner-${parentProject.owner}">${parentProject.owner}</span>
                    <span class="card-priority priority-${parentProject.priority}">${parentProject.priority}</span>
                    <span>${formatStatus(parentProject.status)}</span>
                </div>
                <p style="margin-top: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">${parentProject.description || ''}</p>
                <p style="margin-top: 10px; color: #667eea; font-size: 0.85rem;">Click to view parent project →</p>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>⚡ Quick Actions</h3>
            <div class="quick-actions">
                <button class="btn btn-secondary" onclick="updateSubtaskStatusFromDetail(${subtask.id}, 'todo')">→ To Do</button>
                <button class="btn btn-secondary" onclick="updateSubtaskStatusFromDetail(${subtask.id}, 'inprogress')">→ In Progress</button>
                <button class="btn btn-secondary" onclick="updateSubtaskStatusFromDetail(${subtask.id}, 'review')">→ Review</button>
                <button class="btn btn-secondary" onclick="updateSubtaskStatusFromDetail(${subtask.id}, 'done')">→ Done</button>
            </div>
        </div>
        
        <div class="detail-section" style="margin-top: 20px;">
            <button class="btn btn-secondary" onclick="editSubtask(${subtask.id}, ${projectId})" style="margin-right: 10px;">✏️ Edit Sub-Task</button>
            <button class="btn btn-danger" onclick="deleteSubtask(${subtask.id}, ${projectId}); closeModal('cardDetailModal');">🗑️ Delete Sub-Task</button>
        </div>
    `;
    
    document.getElementById('cardDetailContent').innerHTML = html;
    document.getElementById('cardDetailModal').style.display = 'block';
}

async function updateSubtaskStatusFromDetail(subtaskId, newStatus) {
    const subtask = allSubtasks.find(s => s.id === subtaskId);
    if (subtask && subtask.status !== newStatus) {
        await updateSubtaskStatus(subtask, newStatus);
        closeModal('cardDetailModal');
    }
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
    const projectFilter = document.getElementById('projectFilter').value;
    const ownerFilter = document.getElementById('ownerFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    document.querySelectorAll('.kanban-card:not(.subtask-card)').forEach(card => {
        const id = parseInt(card.dataset.id);
        const project = projects.find(p => p.id === id);
        
        if (!project) return;
        
        const matchesProject = !projectFilter || project.id === parseInt(projectFilter);
        const matchesOwner = !ownerFilter || project.owner === ownerFilter;
        const matchesPriority = !priorityFilter || project.priority === priorityFilter;
        
        card.classList.toggle('hidden', !(matchesProject && matchesOwner && matchesPriority));
    });
    
    // Filter subtask cards
    document.querySelectorAll('.subtask-card').forEach(card => {
        const projectId = parseInt(card.dataset.projectId);
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return;
        
        const matchesProject = !projectFilter || projectId === parseInt(projectFilter);
        const matchesOwner = !ownerFilter || project.owner === ownerFilter;
        const matchesPriority = !priorityFilter || project.priority === priorityFilter;
        
        card.classList.toggle('hidden', !(matchesProject && matchesOwner && matchesPriority));
    });
}

function populateProjectFilter() {
    const select = document.getElementById('projectFilter');
    select.innerHTML = '<option value="">All Projects</option>';
    
    projects.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
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
    
    // Load dashboard if switching to dashboard tab
    if (tabName === 'dashboard') {
        loadDashboard();
    }
}

// Dashboard
async function loadDashboard() {
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">Loading dashboard<span class="loading-dots"></span></div>
        </div>
    `;
    
    try {
        const [projectsRes, subtasksRes] = await Promise.all([
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/subtasks`)
        ]);
        
        const allProjects = await projectsRes.json();
        const allSubtasks = await subtasksRes.json();
        
        grid.innerHTML = allProjects.map(project => {
            const projectSubtasks = allSubtasks.filter(s => s.project_id === project.id);
            const completedSubtasks = projectSubtasks.filter(s => s.status === 'done').length;
            const progress = projectSubtasks.length > 0 ? Math.round((completedSubtasks / projectSubtasks.length) * 100) : 0;
            
            return `
                <div class="dashboard-card" onclick="openTimelineModal(${project.id})">
                    <div class="dashboard-card-header">
                        <span class="dashboard-card-title">${project.name}</span>
                        <span class="dashboard-card-status">${formatStatus(project.status)}</span>
                    </div>
                    <div class="dashboard-card-owner">
                        <span class="card-owner owner-${project.owner}">${project.owner}</span>
                        <span class="card-priority priority-${project.priority}">${project.priority}</span>
                    </div>
                    <div class="dashboard-card-progress">
                        <div class="subtask-progress-bar">
                            <div class="subtask-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="subtask-progress-text">${progress}% complete</div>
                    </div>
                    <div class="dashboard-card-stats">
                        <span>📝 ${projectSubtasks.length} sub-tasks</span>
                        <span>✅ ${completedSubtasks} done</span>
                    </div>
                    <div class="dashboard-card-action">
                        <span style="color: #667eea; font-size: 0.9rem;">Click for AI Timeline Analysis →</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        grid.innerHTML = '<div class="dashboard-loading">Failed to load dashboard</div>';
    }
}

async function openTimelineModal(projectId) {
    const content = document.getElementById('timelineContent');
    content.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">🤖 Analyzing project journey<span class="loading-dots"></span></div>
        </div>
    `;
    document.getElementById('timelineModal').style.display = 'block';
    
    try {
        const res = await fetch(`${API_URL}/dashboard/timeline/${projectId}`);
        const data = await res.json();
        
        if (data.error) {
            content.innerHTML = '<div class="dashboard-loading">Failed to generate timeline. Please try again.</div>';
            return;
        }
        
        const { timeline, project, subtasks } = data;
        const progress = timeline.progressPercentage || 0;
        
        content.innerHTML = `
            <div class="timeline-header">
                <h2>📊 ${project.name} - Project Journey</h2>
                <div class="detail-meta">
                    <span class="card-owner owner-${project.owner}">${project.owner}</span>
                    <span class="card-priority priority-${project.priority}">${project.priority}</span>
                    <span>${formatStatus(project.status)}</span>
                </div>
            </div>
            
            <div class="timeline-summary">
                <h4>🤖 AI Journey Summary</h4>
                <p>${timeline.journeySummary || 'No summary available.'}</p>
            </div>
            
            <div class="timeline-progress">
                <div class="timeline-progress-circle" style="--progress: ${progress}">
                    <span>${progress}%</span>
                </div>
                <div class="timeline-progress-info">
                    <h4>Current Phase</h4>
                    <p>${timeline.currentPhase || 'In progress'}</p>
                    ${timeline.estimatedCompletion ? `<p style="color: rgba(255,255,255,0.6);">Est. completion: ${timeline.estimatedCompletion}</p>` : ''}
                </div>
            </div>
            
            ${timeline.keyMilestones && timeline.keyMilestones.length > 0 ? `
            <div class="timeline-milestones">
                <h3>🏆 Key Milestones</h3>
                ${timeline.keyMilestones.map(m => `
                    <div class="milestone-item">
                        <div class="milestone-date">${m.date || 'N/A'}</div>
                        <div class="milestone-content">
                            <div class="milestone-event">${m.event}</div>
                            <div class="milestone-significance">${m.significance || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="timeline-insights">
                ${timeline.insights && timeline.insights.length > 0 ? `
                <div class="timeline-insights-section">
                    <h4>💡 Insights</h4>
                    <ul>
                        ${timeline.insights.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${timeline.risks && timeline.risks.length > 0 ? `
                <div class="timeline-insights-section">
                    <h4>⚠️ Risks</h4>
                    <ul>
                        ${timeline.risks.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${timeline.recommendations && timeline.recommendations.length > 0 ? `
                <div class="timeline-insights-section" style="grid-column: 1 / -1;">
                    <h4>📋 Recommendations</h4>
                    <ul>
                        ${timeline.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    } catch (err) {
        console.error('Failed to load timeline:', err);
        content.innerHTML = '<div class="dashboard-loading">Failed to connect. Is the server running?</div>';
    }
}

// Collin's Schedule
async function refreshSchedule() {
    const content = document.getElementById('scheduleContent');
    content.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">🤖 AI is analyzing projects<span class="loading-dots"></span></div>
            <p style="margin-top: 10px; font-size: 0.9rem;">Generating Collin's optimized schedule</p>
        </div>
    `;
    
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

// Executive Overview for Carl
let currentExecOverview = null;

async function generateExecOverview() {
    const content = document.getElementById('execContent');
    content.innerHTML = `
        <div class="exec-loading">
            <div class="exec-loading-spinner"></div>
            <h3>Generating Executive Briefing</h3>
            <p>AI is analyzing all projects and preparing Carl's update for Jonathan...</p>
            <div class="exec-loading-steps">
                <div class="loading-step active">📊 Analyzing portfolio metrics</div>
                <div class="loading-step">📁 Reviewing project status</div>
                <div class="loading-step">✍️ Writing executive summary</div>
                <div class="loading-step">📋 Formatting report</div>
            </div>
        </div>
    `;
    document.getElementById('execModal').style.display = 'block';
    
    // Animate loading steps
    const steps = document.querySelectorAll('.loading-step');
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
            steps[stepIndex].classList.add('active');
            stepIndex++;
        }
    }, 800);
    
    try {
        const res = await fetch(`${API_URL}/exec-overview`);
        const data = await res.json();
        clearInterval(stepInterval);
        
        if (data.error) {
            content.innerHTML = '<div class="dashboard-loading">Failed to generate overview. Please try again.</div>';
            return;
        }
        
        currentExecOverview = data.overview;
        renderExecOverview(data.overview);
    } catch (err) {
        clearInterval(stepInterval);
        console.error('Failed to generate exec overview:', err);
        content.innerHTML = '<div class="dashboard-loading">Failed to connect. Is the server running?</div>';
    }
}

function renderExecOverview(overview) {
    const content = document.getElementById('execContent');
    const stats = overview.stats || {};
    
    content.innerHTML = `
        <div class="exec-header">
            <h1>📊 ${overview.title || 'AI Initiatives Portfolio Update'}</h1>
            <div class="exec-date">${overview.date || new Date().toLocaleDateString()}</div>
            <div class="exec-subtitle">Prepared for Jonathan & Executive Leadership</div>
        </div>
        
        <div class="exec-summary">
            <h2>Executive Summary</h2>
            <p>${overview.executiveSummary || 'Overview generated successfully.'}</p>
            ${overview.portfolioHealth ? `<p style="margin-top: 15px; font-style: italic; color: #48bb78;"><strong>Portfolio Health:</strong> ${overview.portfolioHealth}</p>` : ''}
        </div>
        
        <div class="exec-stats">
            <div class="exec-stat">
                <div class="exec-stat-value">${stats.totalProjects || 0}</div>
                <div class="exec-stat-label">Active Projects</div>
            </div>
            <div class="exec-stat">
                <div class="exec-stat-value">${stats.overallProgress || 0}%</div>
                <div class="exec-stat-label">Overall Progress</div>
            </div>
            <div class="exec-stat">
                <div class="exec-stat-value">${stats.completedSubtasks || 0}</div>
                <div class="exec-stat-label">Tasks Completed</div>
            </div>
            <div class="exec-stat">
                <div class="exec-stat-value">${stats.inProgressSubtasks || 0}</div>
                <div class="exec-stat-label">In Progress</div>
            </div>
        </div>
        
        ${overview.keyWins && overview.keyWins.length > 0 ? `
        <div class="exec-summary" style="border-left-color: #48bb78;">
            <h2 style="color: #48bb78;">🏆 Key Wins</h2>
            <ul style="padding-left: 20px; margin: 0;">
                ${overview.keyWins.map(win => `<li style="margin-bottom: 8px; line-height: 1.6;">${win}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div class="exec-projects">
            <h2>📁 All Projects Status (${(overview.projects || []).length} Active Missions)</h2>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">Sorted by priority, then owner (Carl → Tom → Ann)</p>
            ${(overview.projects || []).map(project => `
                <div class="exec-project" style="border-left-color: ${project.priority === 'high' ? '#fc8181' : project.priority === 'medium' ? '#f6e05e' : '#68d391'}">
                    <div class="exec-project-header">
                        <span class="exec-project-title">${project.name}</span>
                        <div class="exec-project-meta">
                            <span class="card-owner owner-${project.owner}">${project.owner}</span>
                            <span class="card-priority priority-${project.priority}">${project.priority}</span>
                        </div>
                    </div>
                    <p class="exec-project-description">${project.description || ''}</p>
                    <div class="exec-project-progress">
                        <div class="exec-project-progress-bar">
                            <div class="exec-project-progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                        <div class="exec-project-status">
                            <strong>${project.progress}% complete</strong> • Status: ${formatStatus(project.status)}
                        </div>
                    </div>
                    
                    <div class="exec-project-details">
                        ${project.currentWork ? `
                            <div class="exec-detail-row">
                                <span class="exec-detail-label">🔄 Currently Working On:</span>
                                <span class="exec-detail-value">${project.currentWork}</span>
                            </div>
                        ` : ''}
                        ${project.recentWins ? `
                            <div class="exec-detail-row">
                                <span class="exec-detail-label">✅ Recent Wins:</span>
                                <span class="exec-detail-value">${project.recentWins}</span>
                            </div>
                        ` : ''}
                        ${project.nextUp ? `
                            <div class="exec-detail-row">
                                <span class="exec-detail-label">📅 Up Next:</span>
                                <span class="exec-detail-value">${project.nextUp}</span>
                            </div>
                        ` : ''}
                        ${project.businessImpact ? `
                            <div class="exec-detail-row">
                                <span class="exec-detail-label">💼 Business Impact:</span>
                                <span class="exec-detail-value" style="color: #a78bfa;">${project.businessImpact}</span>
                            </div>
                        ` : ''}
                        ${project.blockers ? `
                            <div class="exec-detail-row blocker">
                                <span class="exec-detail-label">🚧 Blocker:</span>
                                <span class="exec-detail-value">${project.blockers}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${overview.strategicRecommendations && overview.strategicRecommendations.length > 0 ? `
        <div class="exec-recommendations">
            <h2>💡 Strategic Recommendations</h2>
            <ul>
                ${overview.strategicRecommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${overview.resourceNeeds && overview.resourceNeeds.length > 0 ? `
        <div class="exec-summary" style="border-left-color: #fc8181;">
            <h2 style="color: #fc8181;">🚨 Resource Needs</h2>
            <ul style="padding-left: 20px; margin: 0;">
                ${overview.resourceNeeds.map(need => `<li style="margin-bottom: 8px;">${need}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${overview.nextSteps ? `
        <div class="exec-summary" style="border-left-color: #667eea;">
            <h2 style="color: #667eea;">➡️ Next Steps</h2>
            <p>${overview.nextSteps}</p>
        </div>
        ` : ''}
        
        <div class="exec-footer">
            <p>Generated by AI Kanban • ${new Date().toLocaleString()}</p>
            <p>Prepared by Carl for Jonathan & Executive Leadership</p>
        </div>
        
        <div id="execText" style="display:none;"></div>
    `;
    
    // Generate plain text version
    document.getElementById('execText').textContent = generateExecPlainText(overview);
}

function generateExecPlainText(overview) {
    const stats = overview.stats || {};
    let text = '';
    
    text += `${'='.repeat(60)}\n`;
    text += `${overview.title || 'AI INITIATIVES PORTFOLIO UPDATE'}\n`;
    text += `${overview.date || new Date().toLocaleDateString()}\n`;
    text += `Prepared for Jonathan & Executive Leadership\n`;
    text += `${'='.repeat(60)}\n\n`;
    
    text += `EXECUTIVE SUMMARY\n${'-'.repeat(40)}\n`;
    text += `${overview.executiveSummary || ''}\n\n`;
    
    if (overview.portfolioHealth) {
        text += `Portfolio Health: ${overview.portfolioHealth}\n\n`;
    }
    
    text += `PORTFOLIO METRICS\n${'-'.repeat(40)}\n`;
    text += `• Active Projects: ${stats.totalProjects || 0}\n`;
    text += `• Overall Progress: ${stats.overallProgress || 0}%\n`;
    text += `• Tasks Completed: ${stats.completedSubtasks || 0}\n`;
    text += `• Tasks In Progress: ${stats.inProgressSubtasks || 0}\n\n`;
    
    if (overview.keyWins && overview.keyWins.length > 0) {
        text += `KEY WINS\n${'-'.repeat(40)}\n`;
        overview.keyWins.forEach(win => {
            text += `• ${win}\n`;
        });
        text += '\n';
    }
    
    text += `ALL PROJECTS STATUS\n${'-'.repeat(40)}\n`;
    text += `(Sorted by priority, then owner: Carl → Tom → Ann)\n`;
    (overview.projects || []).forEach((project, index) => {
        text += `\n${index + 1}. ${project.name}\n`;
        text += `   Owner: ${project.owner} | Priority: ${project.priority}\n`;
        text += `   Progress: ${project.progress}% | Status: ${project.status}\n`;
        text += `   ${project.description || ''}\n`;
        if (project.currentWork) {
            text += `   🔄 Currently Working On: ${project.currentWork}\n`;
        }
        if (project.recentWins) {
            text += `   ✅ Recent Wins: ${project.recentWins}\n`;
        }
        if (project.nextUp) {
            text += `   📅 Up Next: ${project.nextUp}\n`;
        }
        if (project.businessImpact) {
            text += `   💼 Business Impact: ${project.businessImpact}\n`;
        }
        if (project.blockers) {
            text += `   🚧 BLOCKER: ${project.blockers}\n`;
        }
    });
    
    if (overview.strategicRecommendations && overview.strategicRecommendations.length > 0) {
        text += `\nSTRATEGIC RECOMMENDATIONS\n${'-'.repeat(40)}\n`;
        overview.strategicRecommendations.forEach(rec => {
            text += `• ${rec}\n`;
        });
    }
    
    if (overview.resourceNeeds && overview.resourceNeeds.length > 0) {
        text += `\nRESOURCE NEEDS\n${'-'.repeat(40)}\n`;
        overview.resourceNeeds.forEach(need => {
            text += `• ${need}\n`;
        });
    }
    
    if (overview.nextSteps) {
        text += `\nNEXT STEPS\n${'-'.repeat(40)}\n`;
        text += `${overview.nextSteps}\n`;
    }
    
    text += `\n${'='.repeat(60)}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    return text;
}

function copyExecReport() {
    const text = document.getElementById('execText')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showToast('Executive briefing copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function downloadExecReport() {
    const text = document.getElementById('execText')?.textContent || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Portfolio-Update-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Executive briefing downloaded!');
}

function emailExecReport() {
    const text = document.getElementById('execText')?.textContent || '';
    const subject = encodeURIComponent(`AI Initiatives Portfolio Update - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    showToast('Opening email client...');
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
