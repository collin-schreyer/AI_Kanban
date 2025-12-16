const Database = require('better-sqlite3');
const db = new Database('kanban.db');

// Update AI-Call Center project
const projectUpdate = {
  oldName: "AI-Call Center",
  newName: "USCIS AI Call Center",
  description: "Complete AI-powered call center platform for USCIS handling 14.1M calls/year - RAG pipeline, voice interaction (Whisper/ElevenLabs), Agent Assist with 15+ workflow agents, GovCloud deployment on EKS",
  owner: "Carl"
};

const subtasks = [
  {"name": "Requirements gathering & stakeholder interviews","description": "Conducted interviews with USCIS stakeholders to understand call center pain points, volume metrics (14.1M calls/year), and automation opportunities","status": "done","assignee": "Collin","dueDate": "2024-09-15"},
  {"name": "Data assessment - Call center metrics analysis","description": "Analyzed USCIS call center data including 80/20 rule (80% routine queries), cost per call ($0.68), and identified automation candidates","status": "done","assignee": "Collin","dueDate": "2024-09-20"},
  {"name": "Architecture design - Core system","description": "Designed modular Flask architecture with RAG pipeline, intent classification, speech processing, and conversation management","status": "done","assignee": "Collin","dueDate": "2024-09-25"},
  {"name": "Knowledge base creation","description": "Created policy documents for I-485, case status FAQ, password reset policies, and indexed with ChromaDB embeddings","status": "done","assignee": "Collin","dueDate": "2024-09-30"},
  {"name": "RAG pipeline implementation","description": "Built retrieval-augmented generation system with document chunking, OpenAI embeddings, semantic search, and citation generation","status": "done","assignee": "Collin","dueDate": "2024-10-05"},
  {"name": "Intent classification system","description": "Implemented OpenAI function calling for intent detection (case status, password reset, address update, policy questions)","status": "done","assignee": "Collin","dueDate": "2024-10-08"},
  {"name": "Voice interaction - Speech-to-Text","description": "Integrated OpenAI Whisper API for voice transcription with multi-language support","status": "done","assignee": "Collin","dueDate": "2024-10-12"},
  {"name": "Voice interaction - Text-to-Speech","description": "Integrated ElevenLabs API for natural voice synthesis with WebSocket streaming and 1.2x playback speed","status": "done","assignee": "Collin","dueDate": "2024-10-15"},
  {"name": "Identity verification system","description": "Built 3-step verification flow (name, birthday, case number) with attempt logging and security lockout","status": "done","assignee": "Collin","dueDate": "2024-10-18"},
  {"name": "Quick response library","description": "Created 150+ pre-built responses for common queries achieving 0.1-0.3s response times (10-50x faster)","status": "done","assignee": "Collin","dueDate": "2024-10-22"},
  {"name": "Conversational flow improvements","description": "Implemented progressive detail system, end-call detection, confirmation flows, and comprehensive summaries","status": "done","assignee": "Collin","dueDate": "2024-10-25"},
  {"name": "Analytics dashboard - Call history","description": "Built searchable call records with filtering by date, status, intent, and individual call detail views","status": "done","assignee": "Collin","dueDate": "2024-10-28"},
  {"name": "Analytics dashboard - Live monitoring","description": "Created real-time call monitoring with active call statistics and system health metrics","status": "done","assignee": "Collin","dueDate": "2024-10-30"},
  {"name": "Analytics dashboard - Cost analysis","description": "Built cost tracking dashboard showing $0.51/call, ROI vs enterprise platforms, and optimization recommendations","status": "done","assignee": "Collin","dueDate": "2024-11-02"},
  {"name": "Human-in-the-loop training system","description": "Implemented AI improvement system with review queue, feedback submission, and accuracy tracking (78% → 92%)","status": "done","assignee": "Collin","dueDate": "2024-11-05"},
  {"name": "HITL interactive tutorial","description": "Created 7-slide educational experience explaining human-in-the-loop training with Chart.js visualizations","status": "done","assignee": "Collin","dueDate": "2024-11-08"},
  {"name": "Agent Assist - Data models","description": "Created Suggestion, TranscriptSegment, CallSession, CallerProfile models with confidence scoring","status": "done","assignee": "Collin","dueDate": "2024-11-10"},
  {"name": "Agent Assist - Caller profile service","description": "Built CallerProfileService with profile loading, active cases, interaction history, and predicted intent","status": "done","assignee": "Collin","dueDate": "2024-11-12"},
  {"name": "Agent Assist - MCP tools extension","description": "Extended MCP server with deadline, appointment, payment, and document status tools","status": "done","assignee": "Collin","dueDate": "2024-11-14"},
  {"name": "Agent Assist - Workflow agents","description": "Implemented 15+ workflow agents (case status, policy, sentiment, deadline, escalation, compliance)","status": "done","assignee": "Collin","dueDate": "2024-11-16"},
  {"name": "Agent Assist - Historical transcript search","description": "Built vector database for historical transcripts with semantic search and similarity scoring","status": "done","assignee": "Collin","dueDate": "2024-11-18"},
  {"name": "Agent Assist - Real-time analysis engine","description": "Created RealTimeAnalysisEngine with context change detection, parallel workflow execution, and WebSocket updates","status": "done","assignee": "Collin","dueDate": "2024-11-20"},
  {"name": "Agent Assist - Frontend interface","description": "Built agent assist panel with confidence color coding, real-time suggestion updates, and card animations","status": "done","assignee": "Collin","dueDate": "2024-11-22"},
  {"name": "Agent Assist - Demo scenarios","description": "Created 3 demo scenarios for Collin Schreyer (case status, policy question, complex issue with frustration)","status": "done","assignee": "Collin","dueDate": "2024-11-24"},
  {"name": "Phase 3 - Supervisor live monitoring","description": "Built supervisor dashboard with live call monitoring, dynamic scenarios, and intervention capabilities","status": "done","assignee": "Collin","dueDate": "2024-11-26"},
  {"name": "Phase 3 - Voice intervention system","description": "Implemented voice-enabled supervisor intervention with de-escalation scripts and real-time coaching","status": "done","assignee": "Collin","dueDate": "2024-11-28"},
  {"name": "Phase 4 - AI Playground","description": "Created interactive AI playground for testing USCIS queries with voice input and FAQ caching","status": "done","assignee": "Collin","dueDate": "2024-12-01"},
  {"name": "FAQ caching system","description": "Built FAQ matcher with pre-generated audio responses achieving sub-second response times","status": "done","assignee": "Collin","dueDate": "2024-12-03"},
  {"name": "Interactive mode - Caller mode","description": "Implemented caller mode with 5 scenarios, autonomous AI responses, and real-time sentiment analysis","status": "done","assignee": "Collin","dueDate": "2024-12-05"},
  {"name": "Interactive mode - Agent mode","description": "Built agent mode with AI caller personalities, suggested responses, and success criteria tracking","status": "done","assignee": "Collin","dueDate": "2024-12-07"},
  {"name": "USCIS Demo Dashboard","description": "Created comprehensive demo dashboard with omni-channel data, time period filters, and Excel export","status": "done","assignee": "Collin","dueDate": "2024-12-09"},
  {"name": "GovCloud Phase 1 - Account setup","description": "Configured AWS GovCloud account with MFA, organizational units, and billing alerts","status": "done","assignee": "Collin","dueDate": "2024-11-10"},
  {"name": "GovCloud Phase 1 - VPC deployment","description": "Deployed multi-AZ VPC with public/private subnets, NAT gateways, and route tables","status": "done","assignee": "Collin","dueDate": "2024-11-12"},
  {"name": "GovCloud Phase 1 - Security services","description": "Enabled CloudTrail, GuardDuty, security groups, and Secrets Manager with encryption","status": "done","assignee": "Collin","dueDate": "2024-11-14"},
  {"name": "GovCloud Phase 1 - Data services","description": "Deployed RDS PostgreSQL and ElastiCache Redis with Multi-AZ and encryption","status": "done","assignee": "Collin","dueDate": "2024-11-16"},
  {"name": "Phase 2 - Application refactoring","description": "Refactored monolithic Flask app into modular structure with shared libraries (1,200 lines)","status": "done","assignee": "Collin","dueDate": "2024-11-18"},
  {"name": "Phase 2 - Cloud adapters","description": "Created PostgreSQL, OpenSearch, and Redis adapters replacing local dependencies (1,000 lines)","status": "done","assignee": "Collin","dueDate": "2024-11-19"},
  {"name": "Phase 2 - Docker containerization","description": "Created multi-stage Dockerfiles with 75% size reduction and security hardening","status": "done","assignee": "Collin","dueDate": "2024-11-20"},
  {"name": "Phase 2 - EKS cluster deployment","description": "Deployed EKS 1.28 cluster with 3 nodes across 3 AZs, Cluster Autoscaler, and HPA","status": "done","assignee": "Collin","dueDate": "2024-11-21"},
  {"name": "Phase 2 - Kubernetes manifests","description": "Created production-grade K8s resources with security contexts, PDB, and rolling updates","status": "done","assignee": "Collin","dueDate": "2024-11-22"},
  {"name": "Phase 2 - Database migration","description": "Migrated SQLite to PostgreSQL with 12 tables, 25+ indexes, and monthly partitioning","status": "done","assignee": "Collin","dueDate": "2024-11-23"},
  {"name": "Phase 2 - OpenSearch deployment","description": "Deployed OpenSearch cluster with k-NN vector search, 3 data nodes, and 1.5TB storage","status": "done","assignee": "Collin","dueDate": "2024-11-24"},
  {"name": "Phase 2 - Knowledge base migration","description": "Migrated 200+ documents from ChromaDB to OpenSearch with Titan embeddings","status": "done","assignee": "Collin","dueDate": "2024-11-24"},
  {"name": "Phase 2 - EKS application deployment","description": "Deployed application to EKS with 93% validation pass rate and full connectivity verification","status": "done","assignee": "Collin","dueDate": "2024-11-24"},
  {"name": "Parallel voice generation","description": "Implemented parallel TTS generation for faster response times with audio caching","status": "done","assignee": "Collin","dueDate": "2024-12-10"},
  {"name": "CloudFront HTTPS deployment","description": "Configured CloudFront distribution with HTTPS proxy for secure microphone access","status": "done","assignee": "Collin","dueDate": "2024-12-12"},
  {"name": "Phase 3 - AWS Bedrock integration","description": "Replace OpenAI with Bedrock Claude, Whisper with Transcribe, ElevenLabs with Polly","status": "todo","assignee": "Collin","dueDate": "2025-01-15"},
  {"name": "Phase 4 - Lambda functions","description": "Implement event-driven processing with transcript handler, AI orchestrator, RAG handler","status": "todo","assignee": "Collin","dueDate": "2025-01-30"},
  {"name": "Phase 5 - CI/CD pipeline","description": "Set up CodePipeline with automated testing, ECR scanning, and approval gates","status": "todo","assignee": "Collin","dueDate": "2025-02-15"},
  {"name": "Phase 6 - Observability setup","description": "Configure CloudWatch dashboards, X-Ray tracing, and SNS alerting","status": "todo","assignee": "Collin","dueDate": "2025-02-28"},
  {"name": "Phase 7 - Security hardening","description": "Enable WAF, Shield Advanced, AWS Config rules, and penetration testing","status": "todo","assignee": "Collin","dueDate": "2025-03-15"},
  {"name": "Phase 8 - Disaster recovery","description": "Set up DR region with cross-region replication and automated failover (RTO < 15 min)","status": "todo","assignee": "Collin","dueDate": "2025-03-30"},
  {"name": "Phase 9 - FedRAMP compliance documentation","description": "Prepare System Security Plan, document all NIST 800-53 controls, and audit evidence","status": "todo","assignee": "Collin","dueDate": "2025-04-15"},
  {"name": "Phase 10 - Production launch","description": "Final security review, load testing at 50K users, DNS cutover, and go-live monitoring","status": "todo","assignee": "Collin","dueDate": "2025-04-30"},
  {"name": "Agent Assist - Load testing","description": "Load test with 50 concurrent calls, measure analysis cycle latency, optimize performance","status": "todo","assignee": "Collin","dueDate": "2025-01-10"},
  {"name": "Agent Assist - API documentation","description": "Write API documentation for MCP tools, agent workflow creation, and deployment guide","status": "todo","assignee": "Collin","dueDate": "2025-01-12"}
];

console.log('Seeding USCIS AI Call Center data...\n');

// Update project
console.log('Updating project...');
const updateResult = db.prepare('UPDATE projects SET name = ?, description = ? WHERE name = ?')
  .run(projectUpdate.newName, projectUpdate.description, projectUpdate.oldName);

if (updateResult.changes > 0) {
  console.log(`  ✓ Updated "${projectUpdate.oldName}" → "${projectUpdate.newName}"`);
} else {
  console.log(`  ⚠ Project "${projectUpdate.oldName}" not found`);
}

// Get project ID
const project = db.prepare('SELECT id FROM projects WHERE name = ?').get(projectUpdate.newName);
if (!project) {
  console.log('Error: Project not found after update');
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

let doneCount = 0;
let todoCount = 0;

for (const subtask of subtasks) {
  const createdAt = new Date(subtask.dueDate);
  createdAt.setDate(createdAt.getDate() - 7);
  
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
  
  if (subtask.status === 'done') {
    doneCount++;
    insertHistory.run(project.id, 'Collin', 'subtask_completed', `Completed: ${subtask.name}`, subtask.dueDate + 'T17:00:00.000Z');
  } else {
    todoCount++;
  }
  
  const icon = subtask.status === 'done' ? '✅' : '📋';
  console.log(`  ${icon} ${subtask.name}`);
}

// Update project status to inprogress (has todo items)
db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('inprogress', project.id);

console.log(`\n✅ USCIS AI Call Center seeded!`);
console.log(`   - ${doneCount} completed subtasks`);
console.log(`   - ${todoCount} todo subtasks`);
console.log(`   - ${subtasks.length} total subtasks`);

db.close();
