import { ensureRuntimeSchema, getAllRows, getRow, repairOrphanedCommunities } from '../database.js';

await ensureRuntimeSchema();
await repairOrphanedCommunities();

const integrity = await getRow('PRAGMA integrity_check');
if (!integrity || integrity.integrity_check !== 'ok') {
  throw new Error(`Database integrity check failed: ${JSON.stringify(integrity)}`);
}

const requiredTables = ['users', 'communities', 'categories', 'demos'];
const tables = await getAllRows(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${requiredTables.map(() => '?').join(',')})`,
  requiredTables
);
const existingTables = new Set(tables.map(table => table.name));
const missingTables = requiredTables.filter(table => !existingTables.has(table));
if (missingTables.length > 0) {
  throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
}

const counts = {};
for (const table of requiredTables) {
  const row = await getRow(`SELECT COUNT(*) AS count FROM ${table}`);
  counts[table] = row.count;
}

console.log('[Data Safety] Database integrity: ok');
console.log('[Data Safety] Persistent record counts:', JSON.stringify(counts));
process.exit(0);
