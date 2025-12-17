const Database = require('better-sqlite3');
const db = new Database('kanban.db');

const projectData = {
  "projectName": "State Department Compliance Search System",
  "owner": "Ann",
  "description": "RAG-based regulation search system for State Dept - replacing ChatGPT with FedRAMP-compliant solution for ITAR, EAR, and policy document search with semantic understanding and citation extraction",
  "subtasks": [
    {"name": "Requirements gathering with Ann","description": "Initial meeting to understand State Dept contact's needs for regulation search and ChatGPT replacement","status": "done","assignee": "Collin","dueDate": null},
    {"name": "Sample regulations collection","description": "Create sample ITAR, EAR, and State Dept policy documents for prototype testing","status": "done","assignee": "Collin","dueDate": null},
    {"name": "GovCloud architecture design","description": "Design RAG system architecture with Bedrock, OpenSearch, Lambda, and S3 for FedRAMP compliance","status": "done","assignee": "Collin","dueDate": null},
    {"name": "Local prototype development","description": "Build working prototype with ChromaDB, OpenAI, and FastAPI for demo purposes","status": "done","assignee": "Collin","dueDate": null},
    {"name": "Document ingestion pipeline","description": "Implement chunking, embedding generation, and vector storage for regulation documents","status": "done","assignee": "Collin","dueDate": null},
    {"name": "RAG query system","description": "Build semantic search and LLM answer generation with citation extraction","status": "done","assignee": "Collin","dueDate": null},
    {"name": "Demo UI integration","description": "Connect prototype API to existing index.html demo interface","status": "inprogress","assignee": "Collin","dueDate": "2025-12-20"},
    {"name": "Stakeholder demo with State Dept","description": "Present working prototype to Ann's State Dept contact for feedback","status": "todo","assignee": "Collin","dueDate": "2025-12-23"},
    {"name": "Terraform GovCloud deployment","description": "Deploy infrastructure to AWS GovCloud using prepared Terraform templates","status": "todo","assignee": "Collin","dueDate": "2026-01-10"},
    {"name": "Security review & FedRAMP documentation","description": "Complete security assessment and compliance documentation for GovCloud deployment","status": "todo","assignee": "Collin","dueDate": "2026-01-17"}
  ]
};

console.log('Adding State Department Compliance Search System...\n');

// Insert the project
const insertProject = db.prepare(`
  INSERT INTO projects (name, description, owner, status, priority, tags, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const result = insertProject.run(
  projectData.projectName,
  projectData.description,
  projectData.owner,
  'inprogress',
  'high',
  JSON.stringify(['govcloud', 'fedramp', 'rag', 'state-dept']),
  new Date().toISOString()
);

const projectId = result.lastInsertRowid;
console.log(`✓ Created project: ${projectData.projectName} (ID: ${projectId})`);

// Insert subtasks
const insertSubtask = db.prepare(`
  INSERT INTO subtasks (project_id, name, description, status, assignee, due_date, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('\nAdding subtasks:');
projectData.subtasks.forEach(subtask => {
  const createdAt = new Date();
  createdAt.setMonth(createdAt.getMonth() - 1);
  
  const completedAt = subtask.status === 'done' ? new Date().toISOString() : null;
  
  insertSubtask.run(
    projectId,
    subtask.name,
    subtask.description,
    subtask.status,
    subtask.assignee,
    subtask.dueDate,
    createdAt.toISOString(),
    completedAt
  );
  
  const statusIcon = subtask.status === 'done' ? '✅' : subtask.status === 'inprogress' ? '🔄' : '📋';
  console.log(`  ${statusIcon} ${subtask.name}`);
});

// Add history entry
db.prepare(`
  INSERT INTO history (project_id, user, action, details, created_at)
  VALUES (?, ?, ?, ?, ?)
`).run(projectId, 'Collin', 'created', 'Project initialized', new Date().toISOString());

// Add activity log
db.prepare(`
  INSERT INTO activity_log (user, message, created_at)
  VALUES (?, ?, ?)
`).run('Collin', `Created project "${projectData.projectName}"`, new Date().toISOString());

console.log(`\n✅ Done! Added ${projectData.subtasks.length} subtasks to ${projectData.projectName}`);
console.log('   Owner: Ann');
console.log('   Builder: Collin');

db.close();
