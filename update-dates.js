const Database = require('better-sqlite3');
const db = new Database('kanban.db');

console.log('Updating all 2024 dates to 2025...\n');

// Update subtasks due_date
const subtaskDates = db.prepare("UPDATE subtasks SET due_date = REPLACE(due_date, '2024', '2025') WHERE due_date LIKE '%2024%'").run();
console.log(`  ✓ Updated ${subtaskDates.changes} subtask due dates`);

// Update subtasks created_at
const subtaskCreated = db.prepare("UPDATE subtasks SET created_at = REPLACE(created_at, '2024', '2025') WHERE created_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${subtaskCreated.changes} subtask created_at dates`);

// Update subtasks completed_at
const subtaskCompleted = db.prepare("UPDATE subtasks SET completed_at = REPLACE(completed_at, '2024', '2025') WHERE completed_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${subtaskCompleted.changes} subtask completed_at dates`);

// Update projects created_at
const projectCreated = db.prepare("UPDATE projects SET created_at = REPLACE(created_at, '2024', '2025') WHERE created_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${projectCreated.changes} project created_at dates`);

// Update projects updated_at
const projectUpdated = db.prepare("UPDATE projects SET updated_at = REPLACE(updated_at, '2024', '2025') WHERE updated_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${projectUpdated.changes} project updated_at dates`);

// Update projects due_date
const projectDue = db.prepare("UPDATE projects SET due_date = REPLACE(due_date, '2024', '2025') WHERE due_date LIKE '%2024%'").run();
console.log(`  ✓ Updated ${projectDue.changes} project due dates`);

// Update history created_at
const historyDates = db.prepare("UPDATE history SET created_at = REPLACE(created_at, '2024', '2025') WHERE created_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${historyDates.changes} history dates`);

// Update activity_log created_at
const activityDates = db.prepare("UPDATE activity_log SET created_at = REPLACE(created_at, '2024', '2025') WHERE created_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${activityDates.changes} activity log dates`);

// Update comments created_at
const commentDates = db.prepare("UPDATE comments SET created_at = REPLACE(created_at, '2024', '2025') WHERE created_at LIKE '%2024%'").run();
console.log(`  ✓ Updated ${commentDates.changes} comment dates`);

console.log('\n✅ All dates updated to 2025!');

db.close();
