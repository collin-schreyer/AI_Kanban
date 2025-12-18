require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize SQLite database - use persistent disk on Render, local file otherwise
const dbPath = process.env.RENDER ? '/data/kanban.db' : 'kanban.db';
const db = new Database(dbPath);
console.log(`Database path: ${dbPath}`);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    tags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    assignee TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS research (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    category TEXT DEFAULT 'other',
    status TEXT DEFAULT 'idea',
    loom_url TEXT,
    demo_url TEXT,
    github_url TEXT,
    tags TEXT,
    author TEXT DEFAULT 'Collin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial users if not exist
const seedUsers = [
  { username: 'carl', password: 'carl2024!', display_name: 'Carl' },
  { username: 'ann', password: 'ann2024!', display_name: 'Ann' },
  { username: 'tom', password: 'tom2024!', display_name: 'Tom' },
  { username: 'collin', password: 'collin2024!', display_name: 'Collin' }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, display_name) VALUES (?, ?, ?)');
seedUsers.forEach(u => insertUser.run(u.username, u.password, u.display_name));

// Seed all projects and subtasks if empty
const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
if (projectCount.count === 0) {
  console.log('Seeding database with all projects and subtasks...');
  const { allProjectsData } = require('./seed-all.js');
  
  const insertProject = db.prepare(`
    INSERT INTO projects (name, description, owner, status, priority, tags, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertSubtask = db.prepare(`
    INSERT INTO subtasks (project_id, name, description, status, assignee, due_date, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertHistory = db.prepare(`
    INSERT INTO history (project_id, user, action, details, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  allProjectsData.forEach(project => {
    const result = insertProject.run(
      project.name,
      project.description,
      project.owner,
      project.status || 'inprogress',
      project.priority || 'medium',
      JSON.stringify(project.tags || []),
      project.dueDate || null,
      new Date().toISOString()
    );
    
    const projectId = result.lastInsertRowid;
    console.log(`  ✓ ${project.name} (${project.subtasks.length} subtasks)`);
    
    project.subtasks.forEach(subtask => {
      const completedAt = subtask.status === 'done' ? new Date().toISOString() : null;
      insertSubtask.run(
        projectId,
        subtask.name,
        subtask.description || '',
        subtask.status,
        subtask.assignee,
        subtask.dueDate || null,
        new Date().toISOString(),
        completedAt
      );
    });
    
    insertHistory.run(projectId, 'Collin', 'created', 'Project initialized', new Date().toISOString());
  });
  
  console.log(`✅ Seeded ${allProjectsData.length} projects with subtasks\n`);
  
  // Seed initial comments
  const insertComment = db.prepare('INSERT INTO comments (project_id, author, text, created_at) VALUES (?, ?, ?, ?)');
  const uscisProject = db.prepare("SELECT id FROM projects WHERE name LIKE '%USCIS%'").get();
  if (uscisProject) {
    insertComment.run(uscisProject.id, 'Carl', 'Ready to present to the next level at USCIS - Round #2 🎯', new Date().toISOString());
    console.log('  ✓ Added USCIS comment');
  }
}

// Seed research concepts if empty
const researchCount = db.prepare('SELECT COUNT(*) as count FROM research').get();
if (researchCount.count === 0) {
  console.log('Seeding research concepts...');
  const insertResearch = db.prepare(`
    INSERT INTO research (title, summary, description, category, status, loom_url, demo_url, github_url, tags, author)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const researchData = [
    {
      title: 'EEOC Intelligent Intake: Explainable RAG for Legal Compliance',
      summary: 'An AI-powered intake assistant that analyzes workplace discrimination complaints in real-time, retrieving official EEOC enforcement guidance and providing explainable, legally grounded recommendations for counselors.',
      description: `**The Problem**
EEOC intake counselors must rapidly evaluate complex narratives against thousands of pages of evolving legal guidance (ADA, Title VII) to determine jurisdiction and next steps, often leading to bottlenecks or inconsistent application of policy.

**Tech Stack**
• Frontend: Next.js 15 (React), TailwindCSS, Lucide Icons
• Backend: Node.js and Python Hybrid Microservices
• Vector Database: ChromaDB (running locally/persistently)
• ML/AI: sentence-transformers (all-MiniLM-L6-v2) for local embedding; OpenAI GPT-4o for reasoning

**Architecture**
Hybrid architecture where Next.js handles user interaction and API orchestration, while a dedicated Python microservice manages the vector lifecycle (ingestion and semantic retrieval).

**Technical Challenges Solved**
• Explainability: Architected an AI Reasoning layer that forces the LLM to generate specific 1-sentence explanations connecting complaint details to retrieved statutes
• Hybrid Interop: Seamlessly integrating Python vector service with Node.js frontend

**Key Features**
• Sub-3-Second Analysis: Instant sentiment scoring and policy retrieval
• Grounded RAG Pipeline: Ingests and cites real April 2024 EEOC Enforcement Guidance
• Interactive Explainable Cards: Policy cards expand to reveal AI logic for matches
• Scenario Simulation: One-click demo functionality for complex legal scenarios

**Business Value**
• Efficiency: Drastically reduces counselor time searching for policy nuances
• Consistency: Ensures every assessment uses current official guidance
• Training: Acts as co-pilot for new counselors learning why laws apply`,
      category: 'rag',
      status: 'demo',
      loomUrl: null,
      demoUrl: null,
      githubUrl: null,
      tags: ['rag', 'legal-tech', 'chromadb', 'nextjs', 'hybrid-ai', 'va', 'eeoc']
    },
    {
      title: '4D UAS Defense Simulator',
      summary: 'A browser-based, high-fidelity 3D simulation engine that trains air defense commanders by visualizing specific decision windows in a drone swarm attack, featuring AI-assisted Command and Control (C2) and timeline manipulation.',
      description: `**The Problem**
Addresses the gap in current training systems which are either too abstract (2D maps) or too complex/heavy (full flight sims). Focuses specifically on The Commanders Loop - training operators to make high-speed decisions under pressure using AI recommendations.

**Tech Stack**
• Frontend: React + Vite (speed and component architecture)
• 3D Engine: Three.js / React-Three-Fiber (R3F) for lightweight, browser-based rendering
• State/Logic: Zustand (simulation loop and timeline state management)
• Aesthetics: TailwindCSS + Framer Motion (premium Glassmorphism UI)
• Audio: Web Audio API (procedural sound generation for alerts/explosions)

**Architecture**
A client-side Digital Twin engine that procedurally generates scenario data. Uses a custom game loop decoupled from the React render cycle for performance, with a 4D store allowing the user to scrub backward and forward through simulation time.

**Technical Challenges Solved**
• 4D Time Control: Implementing robust Rewind/Replay system for After-Action Reviews (AAR)
• Procedural Swarms: Generating unique, non-deterministic drone attack patterns on the fly
• Kinetic Visualization: Simulating interceptor ballistics and shockwave cleanup logic in web context

**Key Features**
• True 4D Battlespace: Full 3D terrain visualization with time-scrubbing (Pause, Rewind, Replay)
• AI-Assisted C2: Decision Support System overlay classifying threats and proposing ROE-compliant solutions
• Procedural Threat Generation: Infinite variations of drone swarms; no two scenarios identical
• Kinetic Engagement: Visual interceptor launches, missile trails, physics-based destruction
• Immersive Audio: Procedurally generated alerts, launch whooshes, and explosion effects

**Business Value**
Target Audience: Senior Defense Executives and Procurement Officers
Impact: Serves as a Digital Twin for Doctrine, allowing rapid iteration on Rules of Engagement (ROE) and defense tactics without expensive field exercises. Shifts training focus from button pushing to decision speed.`,
      category: 'agents',
      status: 'prototype',
      loomUrl: 'https://www.loom.com/share/1e83596b194f474eb987c981f790d009',
      demoUrl: null,
      githubUrl: null,
      tags: ['sim-tech', 'react-three-fiber', 'ai-c2', 'defense', 'digital-twin', 'uas', '3d']
    }
  ];
  
  researchData.forEach(r => {
    insertResearch.run(r.title, r.summary, r.description, r.category, r.status, r.loomUrl, r.demoUrl, r.githubUrl, JSON.stringify(r.tags), 'Collin');
    console.log(`  ✓ ${r.title}`);
  });
  console.log(`✅ Seeded ${researchData.length} research concepts\n`);
}




// AUTH ROUTES
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username.toLowerCase(), password);
  
  if (user) {
    const lastLogin = user.last_login;
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);
    res.json({ success: true, user: { displayName: user.display_name, lastLogin } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// PROJECT ROUTES
app.get('/api/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  projects.forEach(p => p.tags = JSON.parse(p.tags || '[]'));
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description, owner, priority, dueDate, tags, user } = req.body;
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner, priority, due_date, tags) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description, owner, priority || 'medium', dueDate || null, JSON.stringify(tags || []));
  
  db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
    result.lastInsertRowid, user, 'created', `Project "${name}" created`
  );
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Created project "${name}"`);
  
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, owner, status, priority, dueDate, tags, user } = req.body;
  
  const oldProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  
  db.prepare(
    'UPDATE projects SET name=?, description=?, owner=?, status=?, priority=?, due_date=?, tags=?, updated_at=? WHERE id=?'
  ).run(name, description, owner, status, priority, dueDate || null, JSON.stringify(tags || []), new Date().toISOString(), id);
  
  // Track status changes
  if (oldProject && oldProject.status !== status) {
    db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
      id, user, 'status_change', `Moved from "${oldProject.status}" to "${status}"`
    );
    db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(
      user, `Moved "${name}" from ${oldProject.status} to ${status}`
    );
  } else {
    db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
      id, user, 'updated', `Project updated`
    );
  }
  
  res.json({ success: true });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(id);
  
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Deleted project "${project?.name}"`);
  
  res.json({ success: true });
});

// COMMENTS ROUTES
app.get('/api/projects/:id/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(comments);
});

app.post('/api/projects/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, text } = req.body;
  
  const result = db.prepare('INSERT INTO comments (project_id, author, text) VALUES (?, ?, ?)').run(id, author, text);
  
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(id);
  db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
    id, author, 'comment', `Added comment`
  );
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(author, `Commented on "${project?.name}"`);
  
  res.json({ success: true, id: result.lastInsertRowid });
});

// HISTORY ROUTES
app.get('/api/projects/:id/history', (req, res) => {
  const history = db.prepare('SELECT * FROM history WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(history);
});

// ACTIVITY LOG
app.get('/api/activity', (req, res) => {
  const activity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50').all();
  res.json(activity);
});

app.post('/api/activity', (req, res) => {
  const { user, message } = req.body;
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, message);
  res.json({ success: true });
});

// SUBTASKS ROUTES
app.get('/api/projects/:id/subtasks', (req, res) => {
  const subtasks = db.prepare('SELECT * FROM subtasks WHERE project_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(subtasks);
});

app.post('/api/projects/:id/subtasks', (req, res) => {
  const { id } = req.params;
  const { name, description, assignee, dueDate, user } = req.body;
  
  const result = db.prepare(
    'INSERT INTO subtasks (project_id, name, description, assignee, due_date) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, description || '', assignee || null, dueDate || null);
  
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(id);
  db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
    id, user, 'subtask_added', `Added subtask "${name}"`
  );
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Added subtask "${name}" to ${project?.name}`);
  
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/subtasks/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status, assignee, dueDate, user } = req.body;
  
  const oldSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
  const completedAt = status === 'done' && oldSubtask?.status !== 'done' ? new Date().toISOString() : oldSubtask?.completed_at;
  
  db.prepare(
    'UPDATE subtasks SET name=?, description=?, status=?, assignee=?, due_date=?, completed_at=? WHERE id=?'
  ).run(name, description, status, assignee, dueDate || null, completedAt, id);
  
  if (oldSubtask) {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(oldSubtask.project_id);
    if (oldSubtask.status !== status) {
      db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
        oldSubtask.project_id, user, 'subtask_status', `Subtask "${name}" moved to ${status}`
      );
      db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(
        user, `Updated subtask "${name}" to ${status} on ${project?.name}`
      );
    }
  }
  
  res.json({ success: true });
});

app.delete('/api/subtasks/:id', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  
  const subtask = db.prepare('SELECT s.*, p.name as project_name FROM subtasks s JOIN projects p ON s.project_id = p.id WHERE s.id = ?').get(id);
  
  if (subtask) {
    db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
    db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(
      subtask.project_id, user, 'subtask_deleted', `Deleted subtask "${subtask.name}"`
    );
    db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Deleted subtask "${subtask.name}" from ${subtask.project_name}`);
  }
  
  res.json({ success: true });
});

// Get all subtasks (for dashboard)
app.get('/api/subtasks', (req, res) => {
  const subtasks = db.prepare(`
    SELECT s.*, p.name as project_name, p.owner as project_owner 
    FROM subtasks s 
    JOIN projects p ON s.project_id = p.id 
    ORDER BY s.created_at DESC
  `).all();
  res.json(subtasks);
});

// RESEARCH ROUTES
app.get('/api/research', (req, res) => {
  const research = db.prepare('SELECT * FROM research ORDER BY created_at DESC').all();
  research.forEach(r => r.tags = JSON.parse(r.tags || '[]'));
  res.json(research);
});

app.get('/api/research/:id', (req, res) => {
  const research = db.prepare('SELECT * FROM research WHERE id = ?').get(req.params.id);
  if (research) research.tags = JSON.parse(research.tags || '[]');
  res.json(research);
});

app.post('/api/research', (req, res) => {
  const { title, summary, description, category, status, loomUrl, demoUrl, githubUrl, tags, user } = req.body;
  const result = db.prepare(`
    INSERT INTO research (title, summary, description, category, status, loom_url, demo_url, github_url, tags, author)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, summary, description, category, status, loomUrl, demoUrl, githubUrl, JSON.stringify(tags || []), user || 'Collin');
  
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user || 'Collin', `Created research concept: ${title}`);
  res.json({ id: result.lastInsertRowid, success: true });
});

app.put('/api/research/:id', (req, res) => {
  const { title, summary, description, category, status, loomUrl, demoUrl, githubUrl, tags, user } = req.body;
  db.prepare(`
    UPDATE research SET title = ?, summary = ?, description = ?, category = ?, status = ?, 
    loom_url = ?, demo_url = ?, github_url = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title, summary, description, category, status, loomUrl, demoUrl, githubUrl, JSON.stringify(tags || []), req.params.id);
  
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user || 'Collin', `Updated research concept: ${title}`);
  res.json({ success: true });
});

app.delete('/api/research/:id', (req, res) => {
  const research = db.prepare('SELECT title FROM research WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM research WHERE id = ?').run(req.params.id);
  
  const { user } = req.body;
  db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user || 'Collin', `Deleted research concept: ${research?.title}`);
  res.json({ success: true });
});

// DASHBOARD - AI Timeline Generation
app.get('/api/dashboard/timeline/:projectId', async (req, res) => {
  const { projectId } = req.params;
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  const history = db.prepare('SELECT * FROM history WHERE project_id = ? ORDER BY created_at ASC').all(projectId);
  const subtasks = db.prepare('SELECT * FROM subtasks WHERE project_id = ? ORDER BY created_at ASC').all(projectId);
  const comments = db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY created_at ASC').all(projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const systemPrompt = `You are analyzing the journey of a project and generating an insightful timeline narrative.

Project: ${project.name}
Owner: ${project.owner}
Current Status: ${project.status}
Description: ${project.description}
Created: ${project.created_at}

History Events:
${history.map(h => `- ${h.created_at}: ${h.user} - ${h.action}: ${h.details}`).join('\n')}

Subtasks:
${subtasks.map(s => `- ${s.name} (${s.status}) - Created: ${s.created_at}${s.completed_at ? ', Completed: ' + s.completed_at : ''}`).join('\n')}

Comments:
${comments.map(c => `- ${c.created_at}: ${c.author}: "${c.text.substring(0, 100)}"`).join('\n')}

Generate a JSON timeline analysis. Return ONLY valid JSON:
{
  "projectName": "${project.name}",
  "journeySummary": "2-3 sentence narrative of the project's journey so far",
  "keyMilestones": [
    { "date": "date", "event": "what happened", "significance": "why it matters" }
  ],
  "currentPhase": "description of where the project is now",
  "progressPercentage": estimated_percentage_complete,
  "estimatedCompletion": "estimate based on velocity",
  "insights": ["observations about the project's progress"],
  "risks": ["potential issues or delays identified"],
  "recommendations": ["suggestions for moving forward"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the timeline analysis as JSON' }
      ],
      max_tokens: 1000
    });
    
    const content = completion.choices[0].message.content;
    let timeline;
    try {
      timeline = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      timeline = { journeySummary: "Unable to generate timeline. Please try again.", keyMilestones: [] };
    }
    
    res.json({ timeline, project, history, subtasks, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// COLLIN'S SCHEDULE - AI Generated
app.get('/api/schedule', async (req, res) => {
  const projects = db.prepare("SELECT * FROM projects WHERE status != 'done'").all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 30').all();
  const allComments = db.prepare('SELECT c.*, p.name as project_name FROM comments c JOIN projects p ON c.project_id = p.id ORDER BY c.created_at DESC LIMIT 50').all();
  
  const systemPrompt = `You are an AI assistant helping prioritize work for Collin, who is the BUILDER/DEVELOPER for all AI projects on this Kanban board.

IMPORTANT CONTEXT:
- Collin builds and implements ALL the projects on this board
- Carl, Ann, and Tom are project OWNERS who request work and provide direction
- Collin needs to know what to work on and in what order
- Consider owner urgency, project priority, deadlines, and recent activity/comments

Current Projects (not done):
${projects.map(p => `- ${p.name} (Owner: ${p.owner}, Status: ${p.status}, Priority: ${p.priority}, Due: ${p.due_date || 'none'}): ${p.description}`).join('\n')}

Recent Activity:
${recentActivity.slice(0, 15).map(a => `- ${a.user}: ${a.message}`).join('\n')}

Recent Comments (may indicate urgency):
${allComments.slice(0, 10).map(c => `- ${c.author} on ${c.project_name}: "${c.text.substring(0, 100)}"`).join('\n')}

Generate a JSON response with Collin's prioritized schedule. Return ONLY valid JSON, no markdown:
{
  "summary": "Brief 2-3 sentence overview of what Collin should focus on today/this week",
  "urgent": [
    {
      "id": project_id,
      "name": "project name",
      "owner": "owner name", 
      "priority": "high/medium/low",
      "description": "brief description",
      "reason": "Why this is urgent - be specific about owner needs or deadlines"
    }
  ],
  "thisWeek": [same structure - things to tackle this week],
  "upcoming": [same structure - can wait but should be planned],
  "backlog": [same structure - lower priority items]
}

Be strategic. Consider:
1. High priority items from any owner
2. Items with approaching due dates
3. Items with recent comments (owners may be waiting)
4. Items that have been "in progress" too long
5. Balance work across different owners when possible`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate Collin\'s prioritized work schedule as JSON' }
      ],
      max_tokens: 1500
    });
    
    const content = completion.choices[0].message.content;
    // Try to parse JSON, handle potential markdown wrapping
    let schedule;
    try {
      schedule = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      schedule = { summary: "Unable to parse schedule. Please refresh.", urgent: [], thisWeek: [], upcoming: [], backlog: [] };
    }
    
    res.json({ schedule, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// AI ASSISTANT ROUTE - Full data access, concise answers
app.post('/api/ai/chat', async (req, res) => {
  const { message, user } = req.body;
  
  // Get ALL kanban data for complete context
  const projects = db.prepare('SELECT * FROM projects').all();
  const allSubtasks = db.prepare('SELECT * FROM subtasks').all();
  
  // Debug logging
  console.log(`\n=== AI CHAT REQUEST ===`);
  console.log(`User: ${user}`);
  console.log(`Question: ${message}`);
  console.log(`Projects in DB: ${projects.length}`);
  console.log(`Subtasks in DB: ${allSubtasks.length}`);
  console.log(`Project names: ${projects.map(p => p.name).join(', ')}`);
  const allComments = db.prepare(`
    SELECT c.*, p.name as project_name 
    FROM comments c 
    JOIN projects p ON c.project_id = p.id 
    ORDER BY c.created_at DESC LIMIT 50
  `).all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 30').all();
  
  // Build comprehensive project data
  const projectData = projects.map(p => {
    const subtasks = allSubtasks.filter(s => s.project_id === p.id);
    const comments = allComments.filter(c => c.project_id === p.id);
    const completed = subtasks.filter(s => s.status === 'done');
    const inProgress = subtasks.filter(s => s.status === 'inprogress');
    const todo = subtasks.filter(s => s.status === 'todo');
    const progress = subtasks.length > 0 ? Math.round((completed.length / subtasks.length) * 100) : 0;
    
    return {
      name: p.name,
      owner: p.owner,
      status: p.status,
      priority: p.priority,
      description: p.description,
      progress,
      totalSubtasks: subtasks.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      todoCount: todo.length,
      currentWork: inProgress.map(s => s.name),
      upNext: todo.slice(0, 3).map(s => s.name),
      recentlyCompleted: completed.slice(-3).map(s => s.name),
      recentComments: comments.slice(0, 3).map(c => ({ author: c.author, text: c.text.substring(0, 100) }))
    };
  });

  // Calculate totals
  const totalProjects = projects.length;
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter(s => s.status === 'done').length;
  const inProgressSubtasks = allSubtasks.filter(s => s.status === 'inprogress').length;
  const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const systemPrompt = `You are a helpful AI assistant for the AI Projects Kanban board. Answer questions using the data below.

TEAM:
- Collin = Principal AI Architect (builds ALL projects, does all the actual work)
- Carl = CTO (Managing Director, oversees AI initiatives)
- Tom = Managing Director
- Ann = Managing Director
- User asking: ${user}

PORTFOLIO: ${totalProjects} projects, ${totalSubtasks} tasks, ${completedSubtasks} done (${overallProgress}%), ${inProgressSubtasks} in progress

PROJECTS AND CURRENT WORK:
${projectData.map(p => `• ${p.name} (${p.owner}, ${p.priority} priority, ${p.progress}% done)
  - Working on: ${p.currentWork.length > 0 ? p.currentWork.join(', ') : 'None currently'}
  - Up next: ${p.upNext.length > 0 ? p.upNext.join(', ') : 'None'}
  - Recently done: ${p.recentlyCompleted.length > 0 ? p.recentlyCompleted.join(', ') : 'None'}`).join('\n')}

When asked "What is Collin working on?" - list all items from "Working on" fields above.
When asked about a specific project - give its details from above.
When asked about progress - use the percentages and counts above.

FORMAT YOUR RESPONSES WITH CLEAN HTML:
- Use <strong> for project names and emphasis
- Use <div class="ai-project-card"> for each project block
- Use <div class="ai-status working">🔄 Working on:</div> for current work
- Use <div class="ai-status next">📅 Up next:</div> for upcoming
- Use <div class="ai-status done">✅ Recently done:</div> for completed
- Use <ul><li> for lists within sections
- Keep answers organized and scannable
- Be concise but thorough`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 600
    });
    
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// AI Welcome message
app.post('/api/ai/welcome', async (req, res) => {
  const { user, lastLogin } = req.body;
  
  const projects = db.prepare('SELECT * FROM projects').all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').all();
  
  let activitySinceLastLogin = [];
  if (lastLogin) {
    activitySinceLastLogin = db.prepare('SELECT * FROM activity_log WHERE created_at > ? ORDER BY created_at DESC').all(lastLogin);
  }

  const systemPrompt = `You are a friendly AI assistant for the AI Projects Kanban board. Generate a brief, warm welcome message for ${user} who just logged in.

${lastLogin ? `Their last login was: ${lastLogin}` : 'This appears to be their first login.'}

${activitySinceLastLogin.length > 0 ? `
Changes since their last login:
${activitySinceLastLogin.map(a => `- ${a.user}: ${a.message}`).join('\n')}
` : ''}

Current project summary:
- Total projects: ${projects.length}
- To Do: ${projects.filter(p => p.status === 'todo').length}
- In Progress: ${projects.filter(p => p.status === 'inprogress').length}
- Review: ${projects.filter(p => p.status === 'review').length}
- Done: ${projects.filter(p => p.status === 'done').length}

Keep the message brief (2-3 sentences), friendly, and offer to help with any questions about the board.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a welcome message' }
      ],
      max_tokens: 150
    });
    
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.json({ response: `Welcome back, ${user}! Let me know if you need any help with the Kanban board.` });
  }
});

// DAILY/WEEKLY REPORT GENERATION
app.post('/api/report', async (req, res) => {
  const { type } = req.body; // 'daily' or 'weekly'
  
  const projects = db.prepare('SELECT * FROM projects').all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50').all();
  const allComments = db.prepare('SELECT c.*, p.name as project_name FROM comments c JOIN projects p ON c.project_id = p.id ORDER BY c.created_at DESC LIMIT 30').all();
  
  const today = new Date();
  const dateRange = type === 'daily' 
    ? `Today (${today.toLocaleDateString()})`
    : `Week of ${new Date(today - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${today.toLocaleDateString()}`;

  const systemPrompt = `You are generating a ${type} status report for management about Collin's work on AI projects.

CONTEXT:
- Collin is the builder/developer who implements ALL projects
- Carl, Ann, and Tom are project owners who need visibility into progress
- This report should be professional, clear, and actionable

Current Projects:
${projects.map(p => `- ${p.name} (Owner: ${p.owner}, Status: ${p.status}, Priority: ${p.priority}): ${p.description}`).join('\n')}

Recent Activity:
${recentActivity.slice(0, 25).map(a => `- ${a.created_at}: ${a.user} - ${a.message}`).join('\n')}

Recent Comments:
${allComments.slice(0, 15).map(c => `- ${c.author} on ${c.project_name}: "${c.text.substring(0, 80)}..."`).join('\n')}

Generate a JSON report. Return ONLY valid JSON:
{
  "title": "${type === 'daily' ? 'Daily' : 'Weekly'} Status Report",
  "date": "${dateRange}",
  "executiveSummary": "2-3 sentence high-level summary for management",
  "stats": {
    "totalProjects": number,
    "inProgress": number,
    "completed": number,
    "blocked": number
  },
  "accomplishments": [
    { "project": "name", "owner": "owner", "description": "what was done/progress made" }
  ],
  "inProgress": [
    { "project": "name", "owner": "owner", "description": "current work", "expectedCompletion": "estimate if possible" }
  ],
  "upcoming": [
    { "project": "name", "owner": "owner", "description": "what's planned next" }
  ],
  "blockers": [
    { "project": "name", "issue": "description of blocker", "needsFrom": "who can help" }
  ],
  "recommendations": ["actionable suggestions for management"],
  "nextSteps": "What Collin will focus on ${type === 'daily' ? 'tomorrow' : 'next week'}"
}

Be specific and actionable. If there are no blockers, return empty array. Focus on what matters to management.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate the ${type} report as JSON` }
      ],
      max_tokens: 1500
    });
    
    const content = completion.choices[0].message.content;
    let report;
    try {
      report = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      report = { title: "Report Generation Error", executiveSummary: "Unable to generate report. Please try again." };
    }
    
    res.json({ report, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// EXECUTIVE OVERVIEW FOR CARL
app.get('/api/exec-overview', async (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  const allSubtasks = db.prepare('SELECT * FROM subtasks').all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50').all();
  
  // Calculate stats per project
  const projectStats = projects.map(p => {
    const subtasks = allSubtasks.filter(s => s.project_id === p.id);
    const completed = subtasks.filter(s => s.status === 'done').length;
    const inProgress = subtasks.filter(s => s.status === 'inprogress').length;
    const todo = subtasks.filter(s => s.status === 'todo').length;
    const progress = subtasks.length > 0 ? Math.round((completed / subtasks.length) * 100) : 0;
    
    // Get current and next tasks
    const currentTasks = subtasks.filter(s => s.status === 'inprogress');
    const nextTasks = subtasks.filter(s => s.status === 'todo').slice(0, 2);
    const recentlyCompleted = subtasks.filter(s => s.status === 'done').slice(-3);
    
    return {
      ...p,
      subtasks,
      completed,
      inProgress,
      todo,
      totalSubtasks: subtasks.length,
      progress,
      currentTasks,
      nextTasks,
      recentlyCompleted
    };
  });

  // Sort by priority (high, medium, low) then by owner (Carl, Tom, Ann)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const ownerOrder = { Carl: 0, Tom: 1, Ann: 2, Collin: 3 };
  
  projectStats.sort((a, b) => {
    const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    if (priorityDiff !== 0) return priorityDiff;
    return (ownerOrder[a.owner] || 3) - (ownerOrder[b.owner] || 3);
  });

  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter(s => s.status === 'done').length;
  const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const systemPrompt = `You are generating an executive briefing document for Carl (CTO) to present to Jonathan and the executive team about the AI initiatives portfolio.

CONTEXT:
- This is a formal executive summary for leadership meetings
- Carl needs to communicate progress, wins, and strategic direction
- Collin is the technical lead building all these AI solutions
- The audience is non-technical executives who care about business impact

PORTFOLIO OVERVIEW:
Total Projects: ${projects.length}
Total Sub-tasks: ${totalSubtasks}
Completed Sub-tasks: ${completedSubtasks}
Overall Progress: ${overallProgress}%

PROJECT DETAILS (sorted by priority, then owner: Carl, Tom, Ann):
${projectStats.map(p => `
PROJECT: ${p.name}
Owner: ${p.owner}
Priority: ${p.priority}
Status: ${p.status}
Progress: ${p.progress}% (${p.completed}/${p.totalSubtasks} tasks complete)
Description: ${p.description}
Currently Working On: ${p.currentTasks.map(s => s.name).join(', ') || 'None active'}
Up Next: ${p.nextTasks.map(s => s.name).join(', ') || 'None planned'}
Recently Completed: ${p.recentlyCompleted.map(s => s.name).join(', ') || 'None yet'}
`).join('\n')}

Generate a JSON executive briefing with EVERY project. Return ONLY valid JSON:
{
  "title": "AI Initiatives Portfolio Update",
  "date": "${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}",
  "executiveSummary": "3-4 sentence high-level summary suitable for executives. Focus on business value and strategic progress.",
  "keyWins": ["List 3-4 major accomplishments to highlight"],
  "portfolioHealth": "One sentence assessment of overall portfolio health",
  "projects": [
    FOR EACH PROJECT provide:
    {
      "name": "project name",
      "owner": "owner",
      "priority": "high/medium/low",
      "progress": percentage,
      "status": "current status",
      "description": "1-2 sentence description",
      "currentWork": "what Collin is actively working on right now",
      "recentWins": "what was recently completed",
      "nextUp": "what's coming next",
      "businessImpact": "why this matters to the organization",
      "blockers": "any blockers or null if none"
    }
  ],
  "strategicRecommendations": ["2-3 recommendations for leadership consideration"],
  "resourceNeeds": ["any resource or support needs to flag"],
  "nextSteps": "What Carl will focus on in the coming weeks"
}

IMPORTANT: Include ALL ${projectStats.length} projects in the response, sorted by priority then owner (Carl, Tom, Ann).

Write in a professional, executive-friendly tone. Emphasize business value and outcomes over technical details.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the executive briefing as JSON' }
      ],
      max_tokens: 2500
    });
    
    const content = completion.choices[0].message.content;
    let overview;
    try {
      overview = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      overview = { title: "Executive Overview", executiveSummary: "Unable to generate overview. Please try again." };
    }
    
    // Add raw stats
    overview.stats = {
      totalProjects: projects.length,
      totalSubtasks,
      completedSubtasks,
      overallProgress,
      inProgressSubtasks: allSubtasks.filter(s => s.status === 'inprogress').length
    };
    
    res.json({ overview, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// BUILDER MODE - AI Analysis
app.post('/api/builder/analyze', async (req, res) => {
  const { projectId, taskId, update, quickAction } = req.body;
  
  const projects = db.prepare('SELECT * FROM projects').all();
  const allSubtasks = db.prepare('SELECT * FROM subtasks').all();
  
  let context = '';
  if (projectId) {
    const project = projects.find(p => p.id === parseInt(projectId));
    const projectSubtasks = allSubtasks.filter(s => s.project_id === parseInt(projectId));
    context = `Selected Project: ${project?.name} (Status: ${project?.status})\nSubtasks: ${projectSubtasks.map(s => `${s.name} [${s.status}]`).join(', ')}`;
  }
  if (taskId) {
    const task = allSubtasks.find(s => s.id === parseInt(taskId));
    context += `\nSelected Task: ${task?.name} (Status: ${task?.status})`;
  }

  const systemPrompt = `You are an AI assistant helping manage a Kanban board. Based on the user's update, suggest card movements AND new tasks to create.

CURRENT BOARD STATE:
Projects: ${projects.map(p => `${p.id}:${p.name}[${p.status}]`).join(', ')}
Subtasks: ${allSubtasks.slice(0, 50).map(s => `${s.id}:${s.name}[${s.status}](project:${s.project_id})`).join(', ')}

${context ? `CONTEXT:\n${context}` : ''}

USER UPDATE: "${update || quickAction}"
${quickAction ? `QUICK ACTION TYPE: ${quickAction}` : ''}

Analyze this update and return a JSON array of suggested changes:

FOR MOVING/COMPLETING EXISTING ITEMS:
- type: "move" or "complete"
- itemType: "project" or "subtask"
- itemId: number (the existing item's ID)
- itemName: string
- fromStatus: current status
- toStatus: new status
- reason: brief explanation

FOR CREATING NEW SUBTASKS (when user mentions new work or next steps):
- type: "create"
- itemType: "subtask"
- itemId: null
- itemName: descriptive name for the new task
- projectId: number (which project to add it to)
- toStatus: "todo" or "inprogress"
- description: brief description of the task
- reason: why this task should be created

Status options: todo, inprogress, review, done

IMPORTANT: 
- If user mentions completing something, suggest moving it to "done"
- If user mentions starting something new or next steps, suggest CREATING new subtasks
- If user mentions what they'll work on next, create those as new tasks
- Be proactive about suggesting new tasks based on implied next steps

Return ONLY valid JSON array.
Example: [
  {"type":"complete","itemType":"subtask","itemId":5,"itemName":"API Integration","fromStatus":"inprogress","toStatus":"done","reason":"User completed this"},
  {"type":"create","itemType":"subtask","itemId":null,"itemName":"Write API Documentation","projectId":3,"toStatus":"todo","description":"Document the new API endpoints","reason":"Natural next step after API completion"}
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze and suggest changes' }
      ],
      max_tokens: 800
    });
    
    let suggestions;
    try {
      const content = completion.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(content);
    } catch (e) {
      suggestions = [];
    }
    
    res.json({ suggestions });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.json({ suggestions: [], error: 'AI analysis failed' });
  }
});

// BUILDER MODE - Apply Changes
app.post('/api/builder/apply', async (req, res) => {
  const { changes, user } = req.body;
  const results = [];
  
  for (const change of changes) {
    try {
      if (change.type === 'move' || change.type === 'complete') {
        if (change.itemType === 'project') {
          db.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(change.toStatus, change.itemId);
          db.prepare('INSERT INTO history (project_id, user, action, details) VALUES (?, ?, ?, ?)').run(change.itemId, user, 'status_change', `Moved to ${change.toStatus} via Builder Mode`);
        } else {
          db.prepare('UPDATE subtasks SET status = ?, completed_at = ? WHERE id = ?').run(change.toStatus, change.toStatus === 'done' ? new Date().toISOString() : null, change.itemId);
        }
        db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Builder Mode: Moved "${change.itemName}" to ${change.toStatus}`);
        results.push({ success: true, change });
      } else if (change.type === 'create' && change.itemType === 'subtask') {
        // Create new subtask
        const result = db.prepare(`
          INSERT INTO subtasks (project_id, name, description, status, assignee, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(change.projectId, change.itemName, change.description || '', change.toStatus || 'todo', user, new Date().toISOString());
        
        db.prepare('INSERT INTO activity_log (user, message) VALUES (?, ?)').run(user, `Builder Mode: Created new task "${change.itemName}"`);
        results.push({ success: true, change, newId: result.lastInsertRowid });
      }
    } catch (err) {
      console.error('Error applying change:', err);
      results.push({ success: false, change, error: err.message });
    }
  }
  
  res.json({ results });
});

// ANALYTICS FOCUS AREAS - AI Generated
app.get('/api/analytics/focus-areas', async (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  const allSubtasks = db.prepare('SELECT * FROM subtasks').all();
  
  const today = new Date();
  const completedSubtasks = allSubtasks.filter(s => s.status === 'done').length;
  const totalSubtasks = allSubtasks.length;
  const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const overdueItems = allSubtasks.filter(s => s.due_date && new Date(s.due_date) < today && s.status !== 'done');
  const highPrioProjects = projects.filter(p => p.priority === 'high' && p.status !== 'done');
  const inProgressTasks = allSubtasks.filter(s => s.status === 'inprogress').length;
  
  const systemPrompt = `You are an executive advisor analyzing an AI project portfolio. Generate 3-4 actionable focus areas for leadership.

PORTFOLIO DATA:
- ${projects.length} active projects
- ${completedSubtasks}/${totalSubtasks} tasks completed (${overallProgress}%)
- ${overdueItems.length} overdue items
- ${highPrioProjects.length} high-priority projects pending: ${highPrioProjects.map(p => p.name).join(', ')}
- ${inProgressTasks} tasks currently in progress

Return JSON array of focus areas:
[{"icon": "emoji", "title": "Short action title", "description": "2-3 sentence recommendation"}]

Focus on: risk mitigation, resource optimization, deadline management, strategic priorities. Be specific and actionable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Generate focus areas' }],
      max_tokens: 400
    });
    
    let focusAreas;
    try {
      focusAreas = JSON.parse(completion.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      focusAreas = generateDefaultFocusAreas(overdueItems.length, highPrioProjects, inProgressTasks, overallProgress);
    }
    res.json({ focusAreas });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.json({ focusAreas: generateDefaultFocusAreas(overdueItems.length, highPrioProjects, inProgressTasks, overallProgress) });
  }
});

function generateDefaultFocusAreas(overdueCount, highPrioProjects, inProgressTasks, progress) {
  const areas = [];
  if (overdueCount > 0) areas.push({ icon: '⚠️', title: 'Clear Overdue Backlog', description: `${overdueCount} items are past due. Prioritize clearing these to improve portfolio health and team morale.` });
  if (highPrioProjects.length > 0) areas.push({ icon: '🔥', title: 'High Priority Focus', description: `${highPrioProjects.length} high-priority projects need attention. Consider resource reallocation to accelerate delivery.` });
  if (inProgressTasks > 10) areas.push({ icon: '🎯', title: 'Reduce Work in Progress', description: `${inProgressTasks} tasks in progress may indicate context switching. Focus on completing existing work.` });
  if (areas.length === 0) areas.push({ icon: '✨', title: 'Maintain Momentum', description: `Portfolio at ${progress}% completion. Continue current pace and identify optimization opportunities.` });
  return areas;
}

// AI INSIGHTS - Optimistic facts about projects
app.get('/api/insights', async (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  const allSubtasks = db.prepare('SELECT * FROM subtasks').all();
  const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20').all();
  
  const completedSubtasks = allSubtasks.filter(s => s.status === 'done').length;
  const totalSubtasks = allSubtasks.length;
  const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  
  // Get random project for spotlight
  const randomProject = projects[Math.floor(Math.random() * projects.length)];
  const projectSubtasks = allSubtasks.filter(s => s.project_id === randomProject?.id);
  const projectProgress = projectSubtasks.length > 0 
    ? Math.round((projectSubtasks.filter(s => s.status === 'done').length / projectSubtasks.length) * 100) 
    : 0;

  const systemPrompt = `Generate 3-4 SHORT, OPTIMISTIC insights about this AI project portfolio. Be enthusiastic and highlight wins.

DATA:
- ${projects.length} active AI projects
- ${completedSubtasks}/${totalSubtasks} tasks completed (${overallProgress}%)
- Spotlight project: ${randomProject?.name} (${projectProgress}% complete) - ${randomProject?.description}
- Recent activity: ${recentActivity.slice(0, 5).map(a => a.message).join(', ')}

Return JSON array of insight objects:
[
  {"icon": "emoji", "title": "Short title", "text": "One sentence insight", "type": "win|progress|momentum|spotlight"}
]

Be OPTIMISTIC and BRIEF. Celebrate progress. Max 15 words per insight.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate insights' }
      ],
      max_tokens: 300
    });
    
    let insights;
    try {
      insights = JSON.parse(completion.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      insights = [
        { icon: "🚀", title: "Making Progress", text: `${overallProgress}% of all tasks completed across ${projects.length} projects!`, type: "progress" }
      ];
    }
    
    res.json({ insights, stats: { projects: projects.length, completed: completedSubtasks, total: totalSubtasks, progress: overallProgress } });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.json({ 
      insights: [
        { icon: "📊", title: "Portfolio Active", text: `${projects.length} AI projects in motion`, type: "progress" }
      ],
      stats: { projects: projects.length, completed: completedSubtasks, total: totalSubtasks, progress: overallProgress }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
