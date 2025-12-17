// Complete seed data for all projects and subtasks
const allProjectsData = [
  {
    name: "SRT Compliance Engine",
    description: "Section 508 & NIST compliance engine - AI-powered accessibility standards validation for federal solicitations with 15,847 standards indexed",
    owner: "Ann",
    status: "inprogress",
    priority: "high",
    tags: ["compliance", "508", "nist"],
    subtasks: [
      {name: "Section 508 Standards Ingestion", status: "done", assignee: "Collin"},
      {name: "Vector Embedding Pipeline", status: "done", assignee: "Collin"},
      {name: "PDF Extraction Module", status: "done", assignee: "Collin"},
      {name: "ICT Detection NLP Model", status: "done", assignee: "Collin"},
      {name: "Compliance Scoring Dashboard", status: "done", assignee: "Collin"},
      {name: "False Positive Validation Layer", status: "done", assignee: "Collin"},
      {name: "NIST 800-53 Framework Integration", status: "inprogress", assignee: "Collin"},
      {name: "Multi-Domain Compliance Hub", status: "todo", assignee: "Collin"},
      {name: "Agency Rollout Documentation", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "EO Policy Tracker",
    description: "Executive Order monitoring and policy tracking system - Real-time Federal Register integration with 991+ policies vectorized for relevance scoring",
    owner: "Ann",
    status: "inprogress",
    priority: "high",
    tags: ["policy", "eo", "federal-register"],
    subtasks: [
      {name: "Federal Register API Integration", status: "done", assignee: "Collin"},
      {name: "Policy Knowledge Base", status: "done", assignee: "Collin"},
      {name: "Semantic Relevance Engine", status: "done", assignee: "Collin"},
      {name: "Automated Alert System", status: "done", assignee: "Collin"},
      {name: "Impact Report Generator", status: "done", assignee: "Collin"},
      {name: "Implementation Tracking Module", status: "inprogress", assignee: "Collin"},
      {name: "Congressional Bill Tracking Expansion", status: "todo", assignee: "Collin"},
      {name: "Passage Prediction Model", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "OMB / FPI Gap Discovery",
    description: "Federal Program Inventory gap analysis - 3-way validation engine matching contracts, CBJs, and FPI records. Discovered $1.17B Defense Fuel program gap",
    owner: "Tom",
    status: "inprogress",
    priority: "high",
    tags: ["omb", "fpi", "gap-analysis"],
    subtasks: [
      {name: "Contract Data Pipeline", status: "done", assignee: "Collin"},
      {name: "CBJ Document Parser", status: "done", assignee: "Collin"},
      {name: "FPI Database Integration", status: "done", assignee: "Collin"},
      {name: "3-Way Validation Engine", status: "done", assignee: "Collin"},
      {name: "Gap Detection Algorithm", status: "done", assignee: "Collin"},
      {name: "Defense Fuel Program Dashboard", status: "done", assignee: "Collin"},
      {name: "Real-time Program Inventory", status: "inprogress", assignee: "Collin"},
      {name: "Automatic Deduplication Alerts", status: "todo", assignee: "Collin"},
      {name: "Cross-Agency Collaboration Module", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "FAR Reasoning Engine",
    description: "Federal Acquisition Regulation AI assistant - Natural language query system for 3,893 FAR sections with 100% citation accuracy",
    owner: "Tom",
    status: "inprogress",
    priority: "high",
    tags: ["far", "acquisition", "legal"],
    subtasks: [
      {name: "FAR Content Extraction", status: "done", assignee: "Collin"},
      {name: "Vector Database Setup", status: "done", assignee: "Collin"},
      {name: "GPT Integration Layer", status: "done", assignee: "Collin"},
      {name: "Citation Engine", status: "done", assignee: "Collin"},
      {name: "Chat Interface Prototype", status: "done", assignee: "Collin"},
      {name: "DFARS Integration", status: "inprogress", assignee: "Collin"},
      {name: "Agency Supplement Coverage", status: "todo", assignee: "Collin"},
      {name: "Contract Clause Generator", status: "todo", assignee: "Collin"},
      {name: "Protest Risk Predictor", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "Agency Insights (CBJ Analysis)",
    description: "Congressional Budget Justification analysis platform - Mining 8,915 program documents across 24 agencies for collaboration opportunities",
    owner: "Carl",
    status: "inprogress",
    priority: "medium",
    tags: ["cbj", "budget", "analysis"],
    subtasks: [
      {name: "CBJ Document Collection", status: "done", assignee: "Collin"},
      {name: "PDF Mining Pipeline", status: "done", assignee: "Collin"},
      {name: "Program Taxonomy Development", status: "done", assignee: "Collin"},
      {name: "Semantic Similarity Engine", status: "done", assignee: "Collin"},
      {name: "Collaboration Opportunity Detector", status: "done", assignee: "Collin"},
      {name: "DOJ Executive Dashboard", status: "done", assignee: "Collin"},
      {name: "Real-time Budget Monitoring", status: "inprogress", assignee: "Collin"},
      {name: "Proactive Consolidation Recommendations", status: "todo", assignee: "Collin"},
      {name: "Shared Service Marketplace", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "Anthropos-Inspired Platform",
    description: "AI-powered candidate screening platform - Replicated $500K commercial product capabilities with bias detection and candidate ranking",
    owner: "Carl",
    status: "inprogress",
    priority: "medium",
    tags: ["hr", "screening", "hiring"],
    subtasks: [
      {name: "Commercial Product Analysis", status: "done", assignee: "Collin"},
      {name: "Resume Parsing Engine", status: "done", assignee: "Collin"},
      {name: "Candidate Ranking Model", status: "done", assignee: "Collin"},
      {name: "Screening Interface Prototype", status: "done", assignee: "Collin"},
      {name: "Bias Detection Module", status: "done", assignee: "Collin"},
      {name: "HR Analytics Dashboard", status: "inprogress", assignee: "Collin"},
      {name: "Predictive Hiring Model", status: "todo", assignee: "Collin"},
      {name: "Skills Gap Analysis Tool", status: "todo", assignee: "Collin"},
      {name: "Retention Prediction Module", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "TSS (Tenant Satisfaction AI)",
    description: "Tenant Satisfaction Survey AI - Sentiment analysis across 16,877 federal buildings with actionable facility improvement recommendations",
    owner: "Carl",
    status: "inprogress",
    priority: "medium",
    tags: ["gsa", "facilities", "sentiment"],
    subtasks: [
      {name: "Survey Data Integration", status: "done", assignee: "Collin"},
      {name: "Building Database Setup", status: "done", assignee: "Collin"},
      {name: "Sentiment Analysis Model", status: "done", assignee: "Collin"},
      {name: "Pattern Detection Algorithm", status: "done", assignee: "Collin"},
      {name: "Actionable Insights Generator", status: "done", assignee: "Collin"},
      {name: "Executive Dashboard", status: "done", assignee: "Collin"},
      {name: "Predictive Satisfaction Model", status: "inprogress", assignee: "Collin"},
      {name: "Real-time Feedback System", status: "todo", assignee: "Collin"},
      {name: "Cross-Facility Benchmarking", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "Legal AI Assistant",
    description: "Legal document analysis and compliance monitoring - Contract review, case law research RAG system, and predictive legal analytics",
    owner: "Carl",
    status: "inprogress",
    priority: "medium",
    tags: ["legal", "contracts", "compliance"],
    subtasks: [
      {name: "Legal Use Case Discovery", status: "done", assignee: "Collin"},
      {name: "Document Corpus Assessment", status: "done", assignee: "Collin"},
      {name: "Contract Analysis Prototype", status: "done", assignee: "Collin"},
      {name: "Compliance Monitoring POC", status: "inprogress", assignee: "Collin"},
      {name: "Legal Research RAG System", status: "inprogress", assignee: "Collin"},
      {name: "Security & Privacy Review", status: "todo", assignee: "Collin"},
      {name: "Predictive Legal Analytics", status: "todo", assignee: "Collin"},
      {name: "Brief Generation Module", status: "todo", assignee: "Collin"},
      {name: "Legal Knowledge Base", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "USCIS AI Call Center",
    description: "AI-powered call center for USCIS - Intelligent call routing, automated responses, and case status lookup with AWS Bedrock integration",
    owner: "Carl",
    status: "inprogress",
    priority: "high",
    tags: ["uscis", "call-center", "aws"],
    subtasks: [
      {name: "Phase 1 - Infrastructure Setup", status: "done", assignee: "Collin"},
      {name: "Phase 2 - EKS Application Deployment", status: "done", assignee: "Collin"},
      {name: "Parallel Voice Generation", status: "done", assignee: "Collin"},
      {name: "CloudFront HTTPS Deployment", status: "done", assignee: "Collin"},
      {name: "Phase 3 - AWS Bedrock Integration", status: "todo", assignee: "Collin"},
      {name: "Phase 4 - Lambda Functions", status: "todo", assignee: "Collin"},
      {name: "Phase 5 - CI/CD Pipeline", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "DHA Proposal",
    description: "Defense Health Agency AI implementation proposal - Healthcare AI solutions for military medical facilities",
    owner: "Carl",
    status: "inprogress",
    priority: "high",
    tags: ["dha", "healthcare", "proposal"],
    subtasks: [
      {name: "DHA Requirements Analysis", status: "done", assignee: "Collin"},
      {name: "Technical Architecture Design", status: "done", assignee: "Collin"},
      {name: "Cost Estimation", status: "done", assignee: "Collin"},
      {name: "Proposal Draft", status: "inprogress", assignee: "Collin"},
      {name: "Security Compliance Review", status: "todo", assignee: "Collin"},
      {name: "Final Submission", status: "todo", assignee: "Collin"}
    ]
  },
  {
    name: "State Department Compliance Search System",
    description: "RAG-based regulation search system for State Dept - replacing ChatGPT with FedRAMP-compliant solution for ITAR, EAR, and policy document search",
    owner: "Ann",
    status: "inprogress",
    priority: "high",
    tags: ["govcloud", "fedramp", "rag", "state-dept"],
    subtasks: [
      {name: "Requirements gathering with Ann", status: "done", assignee: "Collin"},
      {name: "Sample regulations collection", status: "done", assignee: "Collin"},
      {name: "GovCloud architecture design", status: "done", assignee: "Collin"},
      {name: "Local prototype development", status: "done", assignee: "Collin"},
      {name: "Document ingestion pipeline", status: "done", assignee: "Collin"},
      {name: "RAG query system", status: "done", assignee: "Collin"},
      {name: "Demo UI integration", status: "inprogress", assignee: "Collin"},
      {name: "Stakeholder demo with State Dept", status: "todo", assignee: "Collin"},
      {name: "Terraform GovCloud deployment", status: "todo", assignee: "Collin"},
      {name: "Security review & FedRAMP documentation", status: "todo", assignee: "Collin"}
    ]
  }
];

module.exports = { allProjectsData };
