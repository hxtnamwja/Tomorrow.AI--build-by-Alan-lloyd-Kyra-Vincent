import { initDatabase, runQuery, getAllRows } from '../database.js';
import fs from 'fs';

const db = initDatabase();

const migrateDatabase = async () => {
  console.log('开始数据库迁移...');
  
  try {
    // 检查字段是否已存在
    const tableInfo = await getAllRows('PRAGMA table_info(demos)');
    const columns = tableInfo.map(row => row.name);
    
    console.log('当前demos表字段:', columns);
    
    // 添加project_type字段
    if (!columns.includes('project_type')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN project_type TEXT DEFAULT 'single-file' CHECK(project_type IN ('single-file', 'multi-file'))`);
      console.log('✓ 添加project_type字段');
    } else {
      console.log('- project_type字段已存在');
    }
    
    // 添加entry_file字段
    if (!columns.includes('entry_file')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN entry_file TEXT`);
      console.log('✓ 添加entry_file字段');
    } else {
      console.log('- entry_file字段已存在');
    }
    
    // 添加project_size字段
    if (!columns.includes('project_size')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN project_size INTEGER`);
      console.log('✓ 添加project_size字段');
    } else {
      console.log('- project_size字段已存在');
    }

    // Add demo_publications table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_publications (
        id TEXT PRIMARY KEY,
        demo_id TEXT NOT NULL,
        layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
        community_id TEXT,
        category_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected')),
        rejection_reason TEXT,
        requested_by TEXT NOT NULL,
        requested_at INTEGER NOT NULL,
        reviewed_by TEXT,
        reviewed_at INTEGER,
        FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 确保 demo_publications 表存在');

    // Add demo_locations table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_locations (
        id TEXT PRIMARY KEY,
        demo_id TEXT NOT NULL,
        layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
        community_id TEXT,
        category_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        UNIQUE(demo_id, layer, community_id)
      )
    `);
    console.log('✓ 确保 demo_locations 表存在');
    
    console.log('\n✅ 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
};

migrateDatabase();