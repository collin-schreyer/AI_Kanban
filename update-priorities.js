const Database = require('better-sqlite3');
const db = new Database('kanban.db');

const priorities = [
  { name: 'OMB / FPI Gap Discovery', priority: 'high' },
  { name: 'SRT Compliance Engine', priority: 'high' },
  { name: 'FAR Reasoning Engine', priority: 'medium' },
  { name: 'USCIS AI Call Center', priority: 'high' },
  { name: 'EO Policy Tracker', priority: 'low' },
  { name: 'Agency Insights (CBJ Analysis)', priority: 'low' },
  { name: 'Anthropos-Inspired Platform', priority: 'low' },
  { name: 'TSS (Tenant Satisfaction AI)', priority: 'low' },
  { name: 'Legal AI Assistant', priority: 'low' },
  { name: 'DHA Proposal', priority: 'low' }
];

console.log('Updating project priorities...\n');

const update = db.prepare('UPDATE projects SET priority = ? WHERE name = ?');

for (const p of priorities) {
  const result = update.run(p.priority, p.name);
  const icon = p.priority === 'high' ? '🔴' : p.priority === 'medium' ? '🟡' : '🟢';
  if (result.changes > 0) {
    console.log(`${icon} ${p.name} → ${p.priority}`);
  }
}

console.log('\n✅ Priorities updated!');
db.close();
