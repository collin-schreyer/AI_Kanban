const Database = require('better-sqlite3');
const db = new Database('kanban.db');

// Update DHA Proposal project
const projectUpdate = {
  name: 'DHA Proposal',
  description: 'Defense Health Agency AI modernization proposal - 7-minute video presentation and comprehensive package demonstrating legacy system modernization capabilities',
  status: 'review'
};

const subtasks = [
  {"name": "DHA requirements analysis","description": "Analyzed DHA legacy system pain points and modernization opportunities","status": "done","assignee": "Collin","dueDate": "2024-11-01"},
  {"name": "Solution architecture design","description": "Designed AI-powered modernization approach for DHA legacy systems","status": "done","assignee": "Collin","dueDate": "2024-11-05"},
  {"name": "Capability demonstration planning","description": "Outlined key capabilities to showcase in proposal video","status": "done","assignee": "Collin","dueDate": "2024-11-08"},
  {"name": "Video script development","description": "Wrote 7-minute video script covering modernization approach and benefits","status": "done","assignee": "Collin","dueDate": "2024-11-12"},
  {"name": "Video recording","description": "Recorded 7-minute presentation explaining legacy system modernization capabilities","status": "done","assignee": "Collin","dueDate": "2024-11-15"},
  {"name": "Canva video editing","description": "Edited and polished video in Canva with graphics, transitions, and branding","status": "done","assignee": "Collin","dueDate": "2024-11-18"},
  {"name": "Proposal document compilation","description": "Compiled comprehensive proposal package with technical approach and past performance","status": "done","assignee": "Collin","dueDate": "2024-11-20"},
  {"name": "Final review and QA","description": "Conducted final review of all proposal materials for accuracy and completeness","status": "done","assignee": "Collin","dueDate": "2024-11-22"},
  {"name": "Proposal package submission","description": "Submitted complete proposal package including video and documentation to DHA","status": "done","assignee": "Collin","dueDate": "2024-11-25"}
];

console.log('Seeding DHA Proposal data...\n');

// Update project
console.log('Updating project...');
const updateResult = db.prepare('UPDATE projects SET description = ?, status = ? WHERE name = ?')
  .run(projectUpdate.description, projectUpdate.status, projectUpdate.name);

if (updateResult.changes > 0) {
  console.log(`  ✓ Updated "${projectUpdate.name}" → status: review`);
} else {
  console.log(`  ⚠ Project "${projectUpdate.name}" not found`);
}

// Get project ID
const project = db.prepare('SELECT id FROM projects WHERE name = ?').get(projectUpdate.name);
if (!project) {
  console.log('Error: Project not found');
  process.exit(1);
}

// Delete existing subtasks for this project
db.prepare('DELETE FROM subtasks WHERE project_id = ?').run(project.id);
console.log('  ✓ Cleared existing subtasks');

// Insert subtasks
console.log('\nInserting subtasks...');
const insertSubtask = db.prepare(`
  INSERT INTO subtasks (project_id, name, description, status, assignee, due_date, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertHistory = db.prepare(`
  INSERT INTO history (project_id, user, action, details, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

for (const subtask of subtasks) {
  const createdAt = new Date(subtask.dueDate);
  createdAt.setDate(createdAt.getDate() - 3);
  
  const completedAt = subtask.status === 'done' ? subtask.dueDate : null;
  
  insertSubtask.run(
    project.id,
    subtask.name,
    subtask.description,
    subtask.status,
    subtask.assignee,
    subtask.dueDate,
    createdAt.toISOString(),
    completedAt
  );
  
  insertHistory.run(project.id, 'Collin', 'subtask_completed', `Completed: ${subtask.name}`, subtask.dueDate + 'T17:00:00.000Z');
  
  console.log(`  ✅ ${subtask.name}`);
}

console.log(`\n✅ DHA Proposal seeded!`);
console.log(`   - ${subtasks.length} subtasks (all done)`);
console.log(`   - Project moved to REVIEW column`);

db.close();
