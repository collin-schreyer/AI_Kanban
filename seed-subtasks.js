const Database = require('better-sqlite3');
const db = new Database('kanban.db');

// Map the new project names to existing projects or create new ones
const projectMapping = {
  "SRT Compliance Engine": "SRT",
  "EO Policy Tracker": "DOS AI Tools", 
  "OMB / FPI Gap Discovery": "FPI",
  "FAR Reasoning Engine": "GSA General AI Work",
  "Agency Insights (CBJ Analysis)": "NASA AI",
  "Anthropos-Inspired Platform": "HR Intelligence",
  "TSS (Tenant Satisfaction AI)": "VA AI",
  "Legal AI Assistant": "Legal AI"
};

// Update project descriptions to match the real work
const projectUpdates = [
  { name: "SRT", newName: "SRT Compliance Engine", description: "Section 508 & NIST compliance engine - AI-powered accessibility standards validation for federal solicitations with 15,847 standards indexed" },
  { name: "DOS AI Tools", newName: "EO Policy Tracker", description: "Executive Order monitoring and policy tracking system - Real-time Federal Register integration with 991+ policies vectorized for relevance scoring" },
  { name: "FPI", newName: "OMB / FPI Gap Discovery", description: "Federal Program Inventory gap analysis - 3-way validation engine matching contracts, CBJs, and FPI records. Discovered $1.17B Defense Fuel program gap" },
  { name: "GSA General AI Work", newName: "FAR Reasoning Engine", description: "Federal Acquisition Regulation AI assistant - Natural language query system for 3,893 FAR sections with 100% citation accuracy" },
  { name: "NASA AI", newName: "Agency Insights (CBJ Analysis)", description: "Congressional Budget Justification analysis platform - Mining 8,915 program documents across 24 agencies for collaboration opportunities" },
  { name: "HR Intelligence", newName: "Anthropos-Inspired Platform", description: "AI-powered candidate screening platform - Replicated $500K commercial product capabilities with bias detection and candidate ranking" },
  { name: "VA AI", newName: "TSS (Tenant Satisfaction AI)", description: "Tenant Satisfaction Survey AI - Sentiment analysis across 16,877 federal buildings with actionable facility improvement recommendations" },
  { name: "Legal AI", newName: "Legal AI Assistant", description: "Legal document analysis and compliance monitoring - Contract review, case law research RAG system, and predictive legal analytics" }
];

// Subtask data
const subtaskData = [
  {"projectName": "SRT Compliance Engine","subtasks": [{"name": "Section 508 Standards Ingestion","description": "Collect and parse all 15,847 Section 508 accessibility standards into structured format","status": "done","assignee": "Collin","dueDate": "2024-03-15"},{"name": "Vector Embedding Pipeline","description": "Build 384-dimensional embedding pipeline for semantic search across standards","status": "done","assignee": "Collin","dueDate": "2024-04-01"},{"name": "PDF Extraction Module","description": "Develop multi-stage PDF text extraction with metadata preservation","status": "done","assignee": "Collin","dueDate": "2024-04-20"},{"name": "ICT Detection NLP Model","description": "Train NLP model to identify ICT components in solicitation documents","status": "done","assignee": "Collin","dueDate": "2024-05-10"},{"name": "Compliance Scoring Dashboard","description": "Build real-time compliance scoring UI with violation highlighting","status": "done","assignee": "Collin","dueDate": "2024-06-01"},{"name": "False Positive Validation Layer","description": "Add AI validation stage to eliminate false positive matches","status": "done","assignee": "Collin","dueDate": "2024-07-15"},{"name": "NIST 800-53 Framework Integration","description": "Extend compliance engine to support NIST cybersecurity controls","status": "inprogress","assignee": "Collin","dueDate": "2025-02-01"},{"name": "Multi-Domain Compliance Hub","description": "Architect unified platform for checking multiple federal compliance frameworks","status": "todo","assignee": "Collin","dueDate": "2025-04-01"},{"name": "Agency Rollout Documentation","description": "Create deployment guides and training materials for government-wide adoption","status": "todo","assignee": "Collin","dueDate": "2025-05-15"}]},
  {"projectName": "EO Policy Tracker","subtasks": [{"name": "Federal Register API Integration","description": "Build direct API connection for real-time Executive Order monitoring","status": "done","assignee": "Collin","dueDate": "2024-02-01"},{"name": "Policy Knowledge Base","description": "Ingest and vectorize 991+ existing federal policies for cross-reference","status": "done","assignee": "Collin","dueDate": "2024-03-01"},{"name": "Semantic Relevance Engine","description": "Develop NLP model to score EO relevance against agency operations","status": "done","assignee": "Collin","dueDate": "2024-04-15"},{"name": "Automated Alert System","description": "Build notification pipeline for stakeholder alerts on relevant EOs","status": "done","assignee": "Collin","dueDate": "2024-05-01"},{"name": "Impact Report Generator","description": "Auto-generate compliance impact reports with action items","status": "done","assignee": "Collin","dueDate": "2024-06-15"},{"name": "Implementation Tracking Module","description": "Add workflow tracking for compliance implementation progress","status": "inprogress","assignee": "Collin","dueDate": "2025-01-15"},{"name": "Congressional Bill Tracking Expansion","description": "Extend monitoring to track House and Senate legislation","status": "todo","assignee": "Collin","dueDate": "2025-03-01"},{"name": "Passage Prediction Model","description": "Build AI model to forecast bill passage likelihood and timeline","status": "todo","assignee": "Collin","dueDate": "2025-05-01"}]},
  {"projectName": "OMB / FPI Gap Discovery","subtasks": [{"name": "Contract Data Pipeline","description": "Build ingestion pipeline for 10,000+ federal contract records","status": "done","assignee": "Collin","dueDate": "2024-01-15"},{"name": "CBJ Document Parser","description": "Develop PDF extraction for Congressional Budget Justification documents","status": "done","assignee": "Collin","dueDate": "2024-02-15"},{"name": "FPI Database Integration","description": "Connect to Federal Program Inventory for validation checks","status": "done","assignee": "Collin","dueDate": "2024-03-01"},{"name": "3-Way Validation Engine","description": "Build cross-reference system matching contracts, CBJs, and FPI records","status": "done","assignee": "Collin","dueDate": "2024-04-15"},{"name": "Gap Detection Algorithm","description": "Develop pattern recognition to identify missing/duplicate programs","status": "done","assignee": "Collin","dueDate": "2024-05-20"},{"name": "Defense Fuel Program Dashboard","description": "Build executive dashboard showcasing $1.17B program discovery","status": "done","assignee": "Collin","dueDate": "2024-07-01"},{"name": "Real-time Program Inventory","description": "Develop live tracking system for all federal programs","status": "inprogress","assignee": "Collin","dueDate": "2025-02-15"},{"name": "Automatic Deduplication Alerts","description": "Build system to flag potential duplicate program creation","status": "todo","assignee": "Collin","dueDate": "2025-04-01"},{"name": "Cross-Agency Collaboration Module","description": "Add shared service recommendation engine","status": "todo","assignee": "Collin","dueDate": "2025-06-01"}]},
  {"projectName": "FAR Reasoning Engine","subtasks": [{"name": "FAR Content Extraction","description": "Parse and structure all 3,893 FAR sections from source documents","status": "done","assignee": "Collin","dueDate": "2024-02-01"},{"name": "Vector Database Setup","description": "Build vector store with semantic embeddings for FAR sections","status": "done","assignee": "Collin","dueDate": "2024-02-05"},{"name": "GPT Integration Layer","description": "Connect LLM for natural language query understanding","status": "done","assignee": "Collin","dueDate": "2024-02-07"},{"name": "Citation Engine","description": "Build 100% accurate source reference system for all responses","status": "done","assignee": "Collin","dueDate": "2024-02-08"},{"name": "Chat Interface Prototype","description": "Develop conversational UI for FAR queries","status": "done","assignee": "Collin","dueDate": "2024-02-10"},{"name": "DFARS Integration","description": "Expand knowledge base to include Defense FAR Supplement","status": "inprogress","assignee": "Collin","dueDate": "2025-01-30"},{"name": "Agency Supplement Coverage","description": "Add 50+ agency-specific acquisition regulation supplements","status": "todo","assignee": "Collin","dueDate": "2025-03-15"},{"name": "Contract Clause Generator","description": "Build AI-powered compliant contract language drafting tool","status": "todo","assignee": "Collin","dueDate": "2025-05-01"},{"name": "Protest Risk Predictor","description": "Develop model to predict bid protest likelihood","status": "todo","assignee": "Collin","dueDate": "2025-07-01"}]},
  {"projectName": "Agency Insights (CBJ Analysis)","subtasks": [{"name": "CBJ Document Collection","description": "Gather Congressional Budget Justifications from 24 federal agencies","status": "done","assignee": "Collin","dueDate": "2024-01-20"},{"name": "PDF Mining Pipeline","description": "Build extraction system for 8,915 program documents","status": "done","assignee": "Collin","dueDate": "2024-02-28"},{"name": "Program Taxonomy Development","description": "Create classification schema for federal program categorization","status": "done","assignee": "Collin","dueDate": "2024-03-15"},{"name": "Semantic Similarity Engine","description": "Develop NLP model to find related programs across agencies","status": "done","assignee": "Collin","dueDate": "2024-04-30"},{"name": "Collaboration Opportunity Detector","description": "Build pattern recognition for shared service opportunities","status": "done","assignee": "Collin","dueDate": "2024-06-01"},{"name": "DOJ Executive Dashboard","description": "Create agency-specific visualization for DOJ leadership","status": "done","assignee": "Collin","dueDate": "2024-08-15"},{"name": "Real-time Budget Monitoring","description": "Build live analysis pipeline as new budgets are submitted","status": "inprogress","assignee": "Collin","dueDate": "2025-02-01"},{"name": "Proactive Consolidation Recommendations","description": "Add AI-driven suggestions for program consolidations","status": "todo","assignee": "Collin","dueDate": "2025-04-15"},{"name": "Shared Service Marketplace","description": "Build platform for inter-agency collaboration matching","status": "todo","assignee": "Collin","dueDate": "2025-06-30"}]},
  {"projectName": "Anthropos-Inspired Platform","subtasks": [{"name": "Commercial Product Analysis","description": "Reverse-engineer $500K Anthropos product capabilities","status": "done","assignee": "Collin","dueDate": "2024-03-01"},{"name": "Resume Parsing Engine","description": "Build AI-powered resume text extraction and structuring","status": "done","assignee": "Collin","dueDate": "2024-03-03"},{"name": "Candidate Ranking Model","description": "Develop ML model to score and rank candidates against requirements","status": "done","assignee": "Collin","dueDate": "2024-03-04"},{"name": "Screening Interface Prototype","description": "Build initial UI for HR team candidate review","status": "done","assignee": "Collin","dueDate": "2024-03-05"},{"name": "Bias Detection Module","description": "Add algorithmic fairness checks to ensure equitable evaluation","status": "done","assignee": "Collin","dueDate": "2024-05-15"},{"name": "HR Analytics Dashboard","description": "Build leadership dashboard for hiring insights and metrics","status": "inprogress","assignee": "Collin","dueDate": "2025-01-20"},{"name": "Predictive Hiring Model","description": "Develop AI to predict candidate success probability","status": "todo","assignee": "Collin","dueDate": "2025-03-15"},{"name": "Skills Gap Analysis Tool","description": "Build workforce development needs identification system","status": "todo","assignee": "Collin","dueDate": "2025-05-01"},{"name": "Retention Prediction Module","description": "Add AI forecasting for employee turnover risk","status": "todo","assignee": "Collin","dueDate": "2025-07-01"}]},
  {"projectName": "TSS (Tenant Satisfaction AI)","subtasks": [{"name": "Survey Data Integration","description": "Build pipeline to ingest tenant satisfaction survey responses","status": "done","assignee": "Collin","dueDate": "2024-02-15"},{"name": "Building Database Setup","description": "Create structured database for 16,877 federal buildings","status": "done","assignee": "Collin","dueDate": "2024-03-01"},{"name": "Sentiment Analysis Model","description": "Train NLP model to analyze open-ended survey comments","status": "done","assignee": "Collin","dueDate": "2024-04-15"},{"name": "Pattern Detection Algorithm","description": "Develop system to identify recurring issues across facilities","status": "done","assignee": "Collin","dueDate": "2024-05-20"},{"name": "Actionable Insights Generator","description": "Build recommendation engine for facility improvements","status": "done","assignee": "Collin","dueDate": "2024-06-30"},{"name": "Executive Dashboard","description": "Create visualization dashboard for facility management leadership","status": "done","assignee": "Collin","dueDate": "2024-08-01"},{"name": "Predictive Satisfaction Model","description": "Build AI to forecast satisfaction trends before surveys","status": "inprogress","assignee": "Collin","dueDate": "2025-02-15"},{"name": "Real-time Feedback System","description": "Develop continuous satisfaction monitoring infrastructure","status": "todo","assignee": "Collin","dueDate": "2025-04-01"},{"name": "Cross-Facility Benchmarking","description": "Add comparative analytics across all federal facilities","status": "todo","assignee": "Collin","dueDate": "2025-06-01"}]},
  {"projectName": "Legal AI Assistant","subtasks": [{"name": "Legal Use Case Discovery","description": "Interview stakeholders to identify high-value AI applications","status": "done","assignee": "Collin","dueDate": "2024-06-01"},{"name": "Document Corpus Assessment","description": "Evaluate available legal documents for AI training potential","status": "done","assignee": "Collin","dueDate": "2024-07-15"},{"name": "Contract Analysis Prototype","description": "Build initial AI model for legal document review","status": "done","assignee": "Collin","dueDate": "2024-09-01"},{"name": "Compliance Monitoring POC","description": "Develop proof of concept for automated regulation tracking","status": "inprogress","assignee": "Collin","dueDate": "2025-01-30"},{"name": "Legal Research RAG System","description": "Build intelligent case law search with semantic understanding","status": "inprogress","assignee": "Collin","dueDate": "2025-02-28"},{"name": "Security & Privacy Review","description": "Conduct security assessment for handling sensitive legal data","status": "todo","assignee": "Collin","dueDate": "2025-03-15"},{"name": "Predictive Legal Analytics","description": "Develop AI model to predict case outcomes","status": "todo","assignee": "Collin","dueDate": "2025-05-01"},{"name": "Brief Generation Module","description": "Build AI-assisted legal document drafting capability","status": "todo","assignee": "Collin","dueDate": "2025-07-01"},{"name": "Legal Knowledge Base","description": "Create AI-powered institutional memory for legal precedents","status": "todo","assignee": "Collin","dueDate": "2025-09-01"}]}
];

console.log('Starting database seed...\n');

// First, update project names and descriptions
console.log('Updating project names and descriptions...');
const updateProject = db.prepare('UPDATE projects SET name = ?, description = ? WHERE name = ?');

for (const update of projectUpdates) {
  const result = updateProject.run(update.newName, update.description, update.name);
  if (result.changes > 0) {
    console.log(`  ✓ Updated "${update.name}" → "${update.newName}"`);
  }
}

// Clear existing subtasks
console.log('\nClearing existing subtasks...');
db.prepare('DELETE FROM subtasks').run();
console.log('  ✓ Cleared subtasks table');

// Insert subtasks
console.log('\nInserting subtasks...');
const insertSubtask = db.prepare(`
  INSERT INTO subtasks (project_id, name, description, status, assignee, due_date, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalSubtasks = 0;

for (const project of subtaskData) {
  // Find the project ID
  const dbProject = db.prepare('SELECT id, name FROM projects WHERE name = ?').get(project.projectName);
  
  if (!dbProject) {
    console.log(`  ⚠ Project not found: ${project.projectName}`);
    continue;
  }
  
  console.log(`\n  ${dbProject.name}:`);
  
  for (const subtask of project.subtasks) {
    const createdAt = new Date(subtask.dueDate);
    createdAt.setMonth(createdAt.getMonth() - 1); // Created 1 month before due date
    
    const completedAt = subtask.status === 'done' ? subtask.dueDate : null;
    
    insertSubtask.run(
      dbProject.id,
      subtask.name,
      subtask.description,
      subtask.status,
      subtask.assignee,
      subtask.dueDate,
      createdAt.toISOString(),
      completedAt
    );
    
    const statusIcon = subtask.status === 'done' ? '✅' : subtask.status === 'inprogress' ? '🔄' : '📋';
    console.log(`    ${statusIcon} ${subtask.name}`);
    totalSubtasks++;
  }
}

// Add history entries for completed subtasks
console.log('\nAdding history entries...');
const insertHistory = db.prepare(`
  INSERT INTO history (project_id, user, action, details, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

for (const project of subtaskData) {
  const dbProject = db.prepare('SELECT id FROM projects WHERE name = ?').get(project.projectName);
  if (!dbProject) continue;
  
  // Add project creation history
  insertHistory.run(dbProject.id, 'Collin', 'created', `Project initialized`, '2024-01-01T00:00:00.000Z');
  
  // Add history for completed subtasks
  for (const subtask of project.subtasks) {
    if (subtask.status === 'done') {
      insertHistory.run(
        dbProject.id,
        'Collin',
        'subtask_completed',
        `Completed: ${subtask.name}`,
        subtask.dueDate + 'T17:00:00.000Z'
      );
    }
  }
}

// Update project statuses based on subtask progress
console.log('\nUpdating project statuses...');
const updateStatus = db.prepare('UPDATE projects SET status = ? WHERE id = ?');

for (const project of subtaskData) {
  const dbProject = db.prepare('SELECT id FROM projects WHERE name = ?').get(project.projectName);
  if (!dbProject) continue;
  
  const hasInProgress = project.subtasks.some(s => s.status === 'inprogress');
  const allDone = project.subtasks.every(s => s.status === 'done');
  
  let status = 'todo';
  if (allDone) status = 'done';
  else if (hasInProgress) status = 'inprogress';
  
  updateStatus.run(status, dbProject.id);
}

console.log(`\n✅ Seed complete!`);
console.log(`   - ${projectUpdates.length} projects updated`);
console.log(`   - ${totalSubtasks} subtasks created`);
console.log(`\nRefresh your browser to see the changes.`);

db.close();
