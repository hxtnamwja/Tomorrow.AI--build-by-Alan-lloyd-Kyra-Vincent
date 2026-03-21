import { initDatabase, runQuery, getAllRows } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase();

// Create tables
const createTables = async () => {
  // Users table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'general_admin')),
      created_at INTEGER NOT NULL,
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT,
      contact_info TEXT,
      payment_qr TEXT,
      bio TEXT,
      password TEXT,
      community_points INTEGER DEFAULT 0
    )
  `);

  // Communities table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // Community members table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('member', 'pending')),
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member', 'admin')),
      joined_at INTEGER NOT NULL,
      UNIQUE(community_id, user_id),
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Categories table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      community_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);

  // Demos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL,
      layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
      community_id TEXT,
      code TEXT NOT NULL,
      original_code TEXT,
      config TEXT,
      author TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      thumbnail_url TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'published', 'rejected')),
      rejection_reason TEXT,
      bounty_id TEXT,
      project_type TEXT DEFAULT 'single-file' CHECK(project_type IN ('single-file', 'multi-file')),
      entry_file TEXT,
      project_size INTEGER,
      tags TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Bounties table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS bounties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reward TEXT NOT NULL,
      reward_points INTEGER NOT NULL DEFAULT 0,
      layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
      community_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('open', 'in_review', 'closed')),
      creator TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      accepted_solution_id TEXT,
      accepted_user_id TEXT,
      publish_layer TEXT,
      publish_community_id TEXT,
      publish_category_id TEXT,
      program_title TEXT,
      program_description TEXT,
      program_tags TEXT,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);

  // Bounty solutions table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS bounty_solutions (
      id TEXT PRIMARY KEY,
      bounty_id TEXT NOT NULL,
      demo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
      rejection_reason TEXT,
      reviewed_at INTEGER,
      FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
      FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE
    )
  `);

  // Likes table - for demo likes
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(demo_id, user_id),
      FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Demo user data table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      data_key TEXT NOT NULL,
      data_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(demo_id, user_id, data_key)
    )
  `);

  // Demo rooms table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demo_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      title TEXT NOT NULL,
      max_players INTEGER DEFAULT 4,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Demo room members table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'player',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES demo_rooms(id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    )
  `);

  // Demo room messages table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_room_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      message_type TEXT DEFAULT 'update',
      message_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES demo_rooms(id) ON DELETE CASCADE
    )
  `);

  // Announcements table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('general', 'community')),
      layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
      community_id TEXT,
      created_by TEXT NOT NULL,
      created_by_username TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);
  
  // Demo publications table
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

  // Demo locations table (secondary locations for published demos)
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


  console.log('Tables created successfully');
};

// Seed initial data
const seedData = async () => {
  const now = Date.now();
  const adminId = 'admin-001';
  const userId = 'user-101';

  // Insert seed users
  try {
    await runQuery('INSERT OR IGNORE INTO users (id, username, role, created_at, password, community_points) VALUES (?, ?, ?, ?, ?, ?)', 
      [adminId, 'admin', 'general_admin', now, '123456', 1000]);
    await runQuery('INSERT OR IGNORE INTO users (id, username, role, created_at, password, community_points) VALUES (?, ?, ?, ?, ?, ?)', 
      [userId, 'researcher', 'user', now, '123456', 500]);
    console.log('Seed users inserted');
  } catch (err) {
    console.log('Users already exist');
  }

  // Insert seed categories for general layer
  const categories = [
    { id: 'cat-physics', name: 'Physics' },
    { id: 'cat-chemistry', name: 'Chemistry' },
    { id: 'cat-mathematics', name: 'Mathematics' },
    { id: 'cat-biology', name: 'Biology' },
    { id: 'cat-computer-science', name: 'Computer Science' },
    { id: 'cat-astronomy', name: 'Astronomy' },
    { id: 'cat-earth-science', name: 'Earth Science' },
    { id: 'cat-creative-tools', name: 'Creative Tools' }
  ];

  for (const cat of categories) {
    try {
      await runQuery('INSERT OR IGNORE INTO categories (id, name, parent_id, community_id, created_at) VALUES (?, ?, ?, ?, ?)', 
        [cat.id, cat.name, null, null, now]);
    } catch (err) {}
  }
  console.log('Seed categories inserted');

  // Insert seed bounty
  try {
    await runQuery(`
      INSERT OR IGNORE INTO bounties (id, title, description, reward, reward_points, layer, community_id, status, creator, creator_id, created_at, publish_layer, publish_category_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'b-1',
      'Viscous Fluid Simulation',
      'We need a high-performance visual of fluid dynamics with adjustable viscosity parameters.',
      '200积分',
      200,
      'general',
      null,
      'open',
      'Admin',
      adminId,
      now,
      'general',
      'cat-physics'
    ]);
    console.log('Seed bounty inserted');
  } catch (err) {}

  // Insert seed demo
  const seedDemoCode = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; }
    canvas { display: block; }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 15px 25px;
      border-radius: 30px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="controls">Wave Interference Simulation</div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let time = 0;
    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const r = 100 + Math.sin(time + i * 0.2) * 30;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + (200 + i * 2) + ', 70%, 60%)';
        ctx.fill();
      }
      
      time += 0.05;
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`;

  try {
    await runQuery(`
      INSERT OR IGNORE INTO demos (id, title, description, category_id, layer, community_id, code, author, thumbnail_url, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'demo-001',
      'Wave Interference Pattern',
      'A visualization of wave interference patterns showing constructive and destructive interference.',
      'cat-physics',
      'general',
      null,
      seedDemoCode,
      'Dr. Smith',
      null,
      'published',
      now
    ]);
    console.log('Seed demo inserted');
  } catch (err) {}

  // Insert seed announcement
  try {
    await runQuery(`
      INSERT OR IGNORE INTO announcements (id, title, content, type, layer, community_id, created_by, created_by_username, created_at, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'ann-1',
      'Welcome to Tomorrow!',
      'Welcome to Tomorrow! We are excited to have you here. Explore our demos, join communities, and participate in bounties!',
      'general',
      'general',
      null,
      adminId,
      'Admin',
      now,
      1
    ]);
    console.log('Seed announcement inserted');
  } catch (err) {}
};

// Main
(async () => {
  try {
    await createTables();
    await seedData();
    console.log('\n✅ Database initialized successfully!');
    console.log('Seed data inserted.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();
