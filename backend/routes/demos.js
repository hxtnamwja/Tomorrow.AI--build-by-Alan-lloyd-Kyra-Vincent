import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';
import multer from 'multer';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用环境变量或默认路径，使用 path.resolve 确保绝对路径
const PROJECTS_DIR = process.env.PROJECTS_PATH 
  ? path.resolve(process.env.PROJECTS_PATH) 
  : path.resolve(__dirname, '..', 'projects');
const UPLOAD_TEMP_DIR = path.resolve(__dirname, '..', 'uploads', 'temp');

console.log('[Demos] Projects directory:', PROJECTS_DIR);

// 确保 projects 目录存在
if (!fs.existsSync(PROJECTS_DIR)) {
  try {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    console.log('[Demos] Created projects directory:', PROJECTS_DIR);
  } catch (err) {
    console.error('[Demos] Failed to create projects directory:', err);
  }
}
fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });

const router = Router();

const mapDemoRow = (row) => {
  if (!row) return null;
  let config = undefined;
  let tags = [];
  try {
    if (row.config) {
      config = JSON.parse(row.config);
    }
  } catch (e) {
    config = undefined;
  }
  try {
    if (row.tags) {
      tags = JSON.parse(row.tags);
    }
  } catch (e) {
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    layer: row.layer,
    communityId: row.community_id || undefined,
    code: row.code,
    originalCode: row.original_code || undefined,
    author: row.author,
    creatorId: row.creator_id || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rejectionReason: row.rejection_reason || undefined,
    bountyId: row.bounty_id || undefined,
    likeCount: row.like_count || 0,
    projectType: row.project_type || 'single-file',
    entryFile: row.entry_file || undefined,
    projectSize: row.project_size || 0,
    config,
    archived: row.archived ? true : false,
    archivedAt: row.archived_at || undefined,
    tags
  };
};

const mapDemoListRow = (row) => {
  const demo = mapDemoRow(row);
  if (demo?.thumbnailUrl?.startsWith('data:image/')) {
    demo.thumbnailUrl = `/api/v1/demos/${demo.id}/thumbnail`;
  }
  return demo;
};

const isCommunityMember = async (communityId, userId) => {
  const member = await getRow(
    'SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
    [communityId, userId, 'member']
  );
  return !!member;
};

const isCommunityAdmin = async (communityId, userId) => {
  if (!communityId || !userId) return false;
  const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
  if (community && community.creator_id === userId) return true;
  
  const member = await getRow(
    "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'member' AND role = 'admin'",
    [communityId, userId]
  );
  return !!member;
};

// Helper to get current user from token
const getCurrentUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
  } catch (e) {
    return null;
  }
};

// GET /demos
router.get('/', async (req, res) => {
  const { layer, communityId, categoryId, search, status, authorId, sortBy, archived, fields } = req.query;

  // List views only need metadata. Avoid transferring complete source code and
  // configuration for every demo; details are fetched on demand via GET /:id.
  const demoFields = fields === 'full'
    ? 'd.*'
    : `d.id, d.title, d.description, d.category_id, d.layer, d.community_id,
       d.author, d.creator_id, d.thumbnail_url, d.status, d.created_at, d.updated_at,
       d.rejection_reason, d.bounty_id, d.project_type, d.entry_file, d.project_size,
       d.archived, d.archived_at, d.tags`;
  let query = `
    SELECT ${demoFields}, COUNT(l.id) as like_count
    FROM demos d 
    LEFT JOIN demo_likes l ON d.id = l.demo_id 
    WHERE 1=1
  `;
  const params = [];
  
  // Default to non-archived demos unless explicitly requested
  if (archived === 'true') {
    query += ' AND d.archived = 1';
  } else {
    query += ' AND (d.archived = 0 OR d.archived IS NULL)';
  }

  // Note: Removed community member check to allow viewing all community demos
  // The check should be done at the publication/creation level, not at the viewing level
  // Also removed the requirement for communityId when layer is 'community' - now returns all community demos

  // Filter by location (Primary in 'demos' table only - simplified to avoid demo_locations issues)
  if (layer) {
    query += ' AND d.layer = ?';
    params.push(layer);
  }
  if (communityId) {
    query += ' AND d.community_id = ?';
    params.push(communityId);
  }
  if (categoryId) {
    query += ' AND d.category_id = ?';
    params.push(categoryId);
  }

  if (search) {
    query += ' AND (d.title LIKE ? OR d.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  if (authorId) {
    query += ' AND d.author = ?';
    params.push(authorId);
  }

  // Group by demo id
  query += ' GROUP BY d.id';

  // Support sorting by likes or creation date
  if (sortBy === 'likes') {
    query += ' ORDER BY like_count DESC, d.created_at DESC';
  } else {
    query += ' ORDER BY d.created_at DESC';
  }

  try {
    const demos = await getAllRows(query, params);
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.json({ code: 200, message: 'Success', data: demos.map(mapDemoListRow) });
  } catch (error) {
    console.error('Error fetching demos:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos
router.post('/', async (req, res) => {
  const { title, description, categoryId, layer, communityId, code, originalCode, config, bountyId, tags } = req.body;
  
  const user = await getCurrentUser(req);
  const resolvedAuthor = user ? user.username : 'Anonymous';
  const creatorId = user ? user.id : null;
  
  const id = 'demo-' + Date.now();
  const now = Date.now();
  
  try {
    const configJson = config ? JSON.stringify(config) : null;
    const tagsJson = tags ? JSON.stringify(tags) : null;
    await runQuery(`
      INSERT INTO demos (id, title, description, category_id, layer, community_id, code, original_code, config, tags, author, creator_id, status, bounty_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, categoryId, layer, communityId || null, code, originalCode || null, configJson, tagsJson, resolvedAuthor, creatorId, 'pending', bountyId || null, now]);
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error creating demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/archived/by/:userId - Get all archived demos by user (MUST be before /:id routes)
router.get('/archived/by/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const demos = await getAllRows(`
      SELECT d.* FROM demos d
      WHERE d.creator_id = ? AND d.archived = 1
      ORDER BY d.archived_at DESC
    `, [userId]);
    
    res.json({ code: 200, message: 'Success', data: demos.map(mapDemoRow) });
  } catch (error) {
    console.error('Error fetching archived demos:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/liked/by/:userId - Get all demos liked by a user (MUST be before /:id routes)
router.get('/liked/by/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const demos = await getAllRows(`
      SELECT d.* FROM demos d
      JOIN demo_likes l ON d.id = l.demo_id
      WHERE l.user_id = ? AND d.status = 'published'
      ORDER BY l.created_at DESC
    `, [userId]);
    
    res.json({ code: 200, message: 'Success', data: demos.map(mapDemoRow) });
  } catch (error) {
    console.error('Error fetching liked demos:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/:id/thumbnail - Serve stored data-URL covers as cacheable image resources.
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const demo = await getRow('SELECT thumbnail_url FROM demos WHERE id = ?', [req.params.id]);
    if (!demo?.thumbnail_url) {
      return res.status(404).end();
    }
    const match = demo.thumbnail_url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (!match) {
      return res.redirect(demo.thumbnail_url);
    }
    res.setHeader('Content-Type', match[1]);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(Buffer.from(match[2], 'base64'));
  } catch (error) {
    console.error('Error serving demo thumbnail:', error);
    res.status(500).end();
  }
});

// PATCH /demos/:id/status
router.patch('/:id/status', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { status, rejectionReason } = req.body;
  
  try {
    // First get the current demo to check the old status
    const oldDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!oldDemo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }

    // Permission check
    let hasPermission = false;
    if (user.role === 'general_admin' || user.role === 'site_sub_admin') {
      hasPermission = true;
    } else if (oldDemo.layer === 'community' && oldDemo.community_id) {
      hasPermission = await isCommunityAdmin(oldDemo.community_id, user.id);
    }

    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: 'Forbidden: You do not have permission to review this demo', data: null });
    }
    
    const result = await runQuery(`
      UPDATE demos SET status = ?, rejection_reason = ? WHERE id = ?
    `, [status, rejectionReason || null, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    // If status is changing to published from pending, award points
    if (status === 'published' && oldDemo.status === 'pending' && oldDemo.creator_id) {
      // Get the current user to check their level
      const user = await getRow('SELECT * FROM users WHERE id = ?', [oldDemo.creator_id]);
      
      if (user) {
        let bonusPoints = 0;
        const contributionPoints = user.contribution_points || 0;
        
        // Determine bonus points based on user's current level
        if (contributionPoints >= 300) {
          // Co-Creator: +40 bonus points
          bonusPoints = 40;
        } else if (contributionPoints >= 200) {
          // Principal Researcher: +20 bonus points
          bonusPoints = 20;
        } else if (contributionPoints >= 100) {
          // Senior Researcher: +10 bonus points
          bonusPoints = 10;
        }
        
        // Add base 10 contribution points and any bonus points
        const newContributionPoints = (user.contribution_points || 0) + 10;
        const newPoints = (user.points || 0) + 10 + bonusPoints;
        
        await runQuery(
          'UPDATE users SET contribution_points = ?, points = ? WHERE id = ?',
          [newContributionPoints, newPoints, oldDemo.creator_id]
        );
      }
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error updating demo status:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /demos/:id/cover
router.patch('/:id/cover', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { thumbnailUrl } = req.body;
  
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }

    // Permission check
    const isOwner = demo.creator_id === user.id;
    let isAdmin = user.role === 'general_admin';
    if (!isAdmin && demo.layer === 'community' && demo.community_id) {
      isAdmin = await isCommunityAdmin(demo.community_id, user.id);
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: 'Forbidden: You do not have permission to edit this demo', data: null });
    }

    const result = await runQuery('UPDATE demos SET thumbnail_url = ? WHERE id = ?', 
      [thumbnailUrl, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(updatedDemo) });
  } catch (error) {
    console.error('Error updating demo cover:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id - Soft delete (archive)
router.delete('/:id', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const isOwner = demo.creator_id === user.id;
    let isAdmin = user.role === 'general_admin';
    if (!isAdmin && demo.layer === 'community' && demo.community_id) {
      isAdmin = await isCommunityAdmin(demo.community_id, user.id);
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: 'Not authorized', data: null });
    }
    
    const result = await runQuery(
      'UPDATE demos SET archived = 1, archived_at = ? WHERE id = ?', 
      [Date.now(), req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Demo archived successfully', data: mapDemoRow(updatedDemo) });
  } catch (error) {
    console.error('Error archiving demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos/:id/restore - Restore archived demo
router.post('/:id/restore', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Only the owner can restore this demo', data: null });
    }
    
    const result = await runQuery(
      'UPDATE demos SET archived = 0, archived_at = NULL WHERE id = ?', 
      [req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Demo restored successfully', data: mapDemoRow(updatedDemo) });
  } catch (error) {
    console.error('Error restoring demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /demos/:id/tags - Update demo tags
router.patch('/:id/tags', async (req, res) => {
  const { tags } = req.body;
  
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const isOwner = demo.creator_id === user.id;
    let isAdmin = user.role === 'general_admin';
    if (!isAdmin && demo.layer === 'community' && demo.community_id) {
      isAdmin = await isCommunityAdmin(demo.community_id, user.id);
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: 'Not authorized to update tags', data: null });
    }
    
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const result = await runQuery(
      'UPDATE demos SET tags = ?, updated_at = ? WHERE id = ?',
      [tagsJson, Date.now(), req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Tags updated successfully', data: mapDemoRow(updatedDemo) });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id/permanent - Permanently delete demo
router.delete('/:id/permanent', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Only the owner can permanently delete this demo', data: null });
    }
    
    const result = await runQuery('DELETE FROM demos WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    res.json({ code: 200, message: 'Demo permanently deleted', data: null });
  } catch (error) {
    console.error('Error permanently deleting demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// ==================== LIKE ROUTES ====================

// GET /demos/:id/likes - Get like count and user's like status
router.get('/:id/likes', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  try {
    // Get total like count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    // Check if current user has liked
    let userLiked = false;
    if (user) {
      const userLike = await getRow(
        'SELECT id FROM demo_likes WHERE demo_id = ? AND user_id = ?',
        [demoId, user.id]
      );
      userLiked = !!userLike;
    }
    
    res.json({
      code: 200,
      message: 'Success',
      data: {
        count: countResult?.count || 0,
        userLiked
      }
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos/:id/like - Like a demo
router.post('/:id/like', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    // Check if already liked
    const existingLike = await getRow(
      'SELECT id FROM demo_likes WHERE demo_id = ? AND user_id = ?',
      [demoId, user.id]
    );
    
    if (existingLike) {
      return res.status(400).json({ code: 400, message: 'Already liked', data: null });
    }
    
    // Add like
    await runQuery(
      'INSERT INTO demo_likes (demo_id, user_id, created_at) VALUES (?, ?, ?)',
      [demoId, user.id, Date.now()]
    );
    
    // Get updated count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Liked successfully',
      data: {
        count: countResult?.count || 0,
        userLiked: true
      }
    });
  } catch (error) {
    console.error('Error liking demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id/like - Unlike a demo
router.delete('/:id/like', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    // Remove like
    await runQuery(
      'DELETE FROM demo_likes WHERE demo_id = ? AND user_id = ?',
      [demoId, user.id]
    );
    
    // Get updated count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Unliked successfully',
      data: {
        count: countResult?.count || 0,
        userLiked: false
      }
    });
  } catch (error) {
    console.error('Error unliking demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// ==================== ZIP UPLOAD ROUTES ====================

// 配置multer用于文件上传
const upload = multer({
  dest: UPLOAD_TEMP_DIR,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 2 // allow up to 2 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.toLowerCase().endsWith('.zip') ||
        file.mimetype === 'text/html' ||
        file.originalname.toLowerCase().endsWith('.html') ||
        file.originalname.toLowerCase().endsWith('.htm')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 ZIP 或 HTML 文件'));
    }
  }
});

const uploadMultiple = upload.fields([
  { name: 'zipFile', maxCount: 1 },
  { name: 'originalZip', maxCount: 1 }
]);

// POST /demos/upload-zip - 上传ZIP项目
router.post('/upload-zip', uploadMultiple, async (req, res) => {
  const { title, description, categoryId, layer, communityId, config, tags, bountyId } = req.body;
  const user = await getCurrentUser(req);
  
  console.log('[Upload-ZIP] Starting upload process...');
  console.log('[Upload-ZIP] User:', user?.username || 'Unknown');
  console.log('[Upload-ZIP] Title:', title);
  
  if (!user) {
    console.error('[Upload-ZIP] Unauthorized - no user');
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  if (!req.files || !req.files.zipFile) {
    console.error('[Upload-ZIP] No file uploaded');
    return res.status(400).json({ code: 400, message: 'No file uploaded', data: null });
  }
  if (!req.files.zipFile[0].originalname.toLowerCase().endsWith('.zip')) {
    return res.status(400).json({ code: 400, message: '新建多文件项目只允许上传 ZIP 文件', data: null });
  }
  
  console.log('[Upload-ZIP] File received:', req.files.zipFile[0].originalname, 'size:', req.files.zipFile[0].size);
  
  const demoId = 'demo-' + Date.now();
  const projectDir = path.resolve(PROJECTS_DIR, demoId);
  const originalDir = path.resolve(PROJECTS_DIR, demoId, '_original');
  
  console.log('[Upload-ZIP] Project directory:', projectDir);
  
  try {
    // 确保项目目录存在
    if (!fs.existsSync(projectDir)) {
      console.log('[Upload-ZIP] Creating project directory...');
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // 确保 _original 目录存在
    if (!fs.existsSync(originalDir)) {
      console.log('[Upload-ZIP] Creating _original directory...');
      fs.mkdirSync(originalDir, { recursive: true });
    }
    
    // 解压主 ZIP 文件
    console.log('[Upload-ZIP] Extracting main ZIP file...');
    try {
      const zip = new AdmZip(req.files.zipFile[0].path);
      zip.extractAllTo(projectDir, true);
      console.log('[Upload-ZIP] Main ZIP extracted successfully');
    } catch (zipErr) {
      console.error('[Upload-ZIP] Failed to extract main ZIP:', zipErr);
      throw new Error('ZIP文件解压失败: ' + (zipErr.message || 'Unknown error'));
    }
    
    // 解压原始 ZIP 文件（如果有）
    if (req.files.originalZip && req.files.originalZip.length > 0) {
      console.log('[Upload-ZIP] Extracting original ZIP file...');
      try {
        const originalZip = new AdmZip(req.files.originalZip[0].path);
        originalZip.extractAllTo(originalDir, true);
        console.log('[Upload-ZIP] Original ZIP extracted successfully');
      } catch (e) {
        console.warn('[Upload-ZIP] Failed to save original ZIP (non-critical):', e);
      }
    }
    
    // 分析项目结构
    console.log('[Upload-ZIP] Analyzing project structure...');
    const projectInfo = analyzeProjectStructure(projectDir);
    console.log('[Upload-ZIP] Found', projectInfo.entryFiles.length, 'HTML files');
    console.log('[Upload-ZIP] Entry files:', projectInfo.entryFiles);
    
    if (!projectInfo.entryFiles.length) {
      console.error('[Upload-ZIP] No HTML files found in ZIP');
      // 清理
      try {
        if (fs.existsSync(projectDir)) {
          fs.rmSync(projectDir, { recursive: true, force: true });
        }
        if (req.files.zipFile[0].path && fs.existsSync(req.files.zipFile[0].path)) {
          fs.unlinkSync(req.files.zipFile[0].path);
        }
        if (req.files.originalZip && req.files.originalZip[0] && fs.existsSync(req.files.originalZip[0].path)) {
          fs.unlinkSync(req.files.originalZip[0].path);
        }
      } catch (cleanupErr) {
        console.error('[Upload-ZIP] Cleanup error:', cleanupErr);
      }
      return res.status(400).json({ 
        code: 400, 
        message: 'ZIP中未找到HTML文件，请确保ZIP包含至少一个.html文件', 
        data: null 
      });
    }
    
    const configJson = config ? JSON.stringify(config) : null;
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const hasOriginal = req.files.originalZip && req.files.originalZip.length > 0;
    
    // 插入数据库
    console.log('[Upload-ZIP] Inserting into database...');
    await runQuery(`
      INSERT INTO demos (id, title, description, category_id, layer, community_id, 
                       code, original_code, config, tags, author, creator_id, status, project_type, entry_file, project_size, created_at, bounty_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      demoId,
      title,
      description,
      categoryId,
      layer,
      communityId || null,
      projectInfo.entryFiles[0],
      hasOriginal ? 'has_original_files' : null,
      configJson,
      tagsJson,
      user.username,
      user.id,
      'pending',
      'multi-file',
      projectInfo.entryFiles[0],
      projectInfo.totalSize,
      Date.now(),
      bountyId || null
    ]);
    
    console.log('[Upload-ZIP] Database insert successful');
    
    // 清理临时文件
    try {
      if (req.files.zipFile[0].path && fs.existsSync(req.files.zipFile[0].path)) {
        fs.unlinkSync(req.files.zipFile[0].path);
      }
      if (req.files.originalZip && req.files.originalZip[0] && fs.existsSync(req.files.originalZip[0].path)) {
        fs.unlinkSync(req.files.originalZip[0].path);
      }
    } catch (cleanupErr) {
      console.warn('[Upload-ZIP] Temp file cleanup warning:', cleanupErr);
    }
    
    console.log('[Upload-ZIP] Upload completed successfully:', demoId);
    
    res.json({ 
      code: 200, 
      message: '上传成功', 
      data: { 
        id: demoId, 
        entryFile: projectInfo.entryFiles[0],
        structure: projectInfo.structure,
        size: projectInfo.totalSize
      }
    });
  } catch (error) {
    console.error('[Upload-ZIP] Error:', error);
    console.error('[Upload-ZIP] Error stack:', error.stack);
    
    // 清理失败的目录
    try {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      if (req.files && req.files.zipFile && req.files.zipFile[0] && fs.existsSync(req.files.zipFile[0].path)) {
        fs.unlinkSync(req.files.zipFile[0].path);
      }
      if (req.files && req.files.originalZip && req.files.originalZip[0] && fs.existsSync(req.files.originalZip[0].path)) {
        fs.unlinkSync(req.files.originalZip[0].path);
      }
    } catch (cleanupErr) {
      console.error('[Upload-ZIP] Cleanup error:', cleanupErr);
    }
    
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误: ' + (error.message || 'Unknown error'), 
      data: null 
    });
  }
});

// POST /demos/:id/update - 更新demo（需要审批）
router.post('/:id/update', uploadMultiple, async (req, res) => {
  const { title, description, config, tags } = req.body;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    const existingDemo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!existingDemo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (existingDemo.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Only author can update this demo', data: null });
    }
    
    const demoId = existingDemo.id;
    const projectDir = path.join(PROJECTS_DIR, demoId);
    const backupDir = path.join(PROJECTS_DIR, demoId + '_backup_' + Date.now());
    const originalDir = path.join(PROJECTS_DIR, demoId, '_original');
    
    if (req.files && req.files.zipFile) {
      const uploadedFile = req.files.zipFile[0];
      const isZip = uploadedFile.originalname.toLowerCase().endsWith('.zip');
      const tagsJson = tags ? JSON.stringify(JSON.parse(tags)) : existingDemo.tags;

      if (!isZip) {
        const code = fs.readFileSync(uploadedFile.path, 'utf-8');
        await runQuery(`
          UPDATE demos
          SET title = ?, description = ?, code = ?, tags = ?, project_type = 'single-file',
              entry_file = NULL, project_size = ?, status = 'pending', updated_at = ?
          WHERE id = ?
        `, [
          title || existingDemo.title,
          description || existingDemo.description,
          code,
          tagsJson,
          Buffer.byteLength(code, 'utf-8'),
          Date.now(),
          demoId
        ]);
        fs.unlinkSync(uploadedFile.path);
        const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [demoId]);
        return res.json({
          code: 200,
          message: '更新提交成功，等待管理员审批',
          data: mapDemoRow(updatedDemo)
        });
      }

      if (fs.existsSync(projectDir)) {
        fs.renameSync(projectDir, backupDir);
      }
      
      fs.mkdirSync(projectDir, { recursive: true });
      
      const zip = new AdmZip(req.files.zipFile[0].path);
      zip.extractAllTo(projectDir, true);
      
      if (req.files.originalZip && req.files.originalZip.length > 0) {
        try {
          if (fs.existsSync(originalDir)) {
            fs.rmSync(originalDir, { recursive: true, force: true });
          }
          fs.mkdirSync(originalDir, { recursive: true });
          const originalZip = new AdmZip(req.files.originalZip[0].path);
          originalZip.extractAllTo(originalDir, true);
        } catch (e) {
          console.warn('Failed to save original ZIP:', e);
        }
      }
      
      const projectInfo = analyzeProjectStructure(projectDir);
      
      if (!projectInfo.entryFiles.length) {
        if (fs.existsSync(backupDir)) {
          fs.renameSync(backupDir, projectDir);
        }
        fs.unlinkSync(req.files.zipFile[0].path);
        if (req.files.originalZip && req.files.originalZip.length > 0) {
          fs.unlinkSync(req.files.originalZip[0].path);
        }
        return res.status(400).json({ 
          code: 400, 
          message: 'ZIP中未找到HTML文件', 
          data: null 
        });
      }
      
      const configJson = config ? JSON.stringify(config) : existingDemo.config;
      const hasOriginal = req.files.originalZip && req.files.originalZip.length > 0;
      
      await runQuery(`
        UPDATE demos 
        SET title = ?, description = ?, code = ?, original_code = ?, config = ?, tags = ?,
            entry_file = ?, project_size = ?, status = 'pending', updated_at = ?
        WHERE id = ?
      `, [
        title || existingDemo.title,
        description || existingDemo.description,
        projectInfo.entryFiles[0],
        hasOriginal ? 'has_original_files' : existingDemo.original_code,
        configJson,
        tagsJson,
        projectInfo.entryFiles[0],
        projectInfo.totalSize,
        Date.now(),
        demoId
      ]);
      
      fs.unlinkSync(req.files.zipFile[0].path);
      if (req.files.originalZip && req.files.originalZip.length > 0) {
        fs.unlinkSync(req.files.originalZip[0].path);
      }
      
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      
      const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [demoId]);
      res.json({ 
        code: 200, 
        message: '更新提交成功，等待管理员审批', 
        data: mapDemoRow(updatedDemo)
      });
    } else {
      const configJson = config ? JSON.stringify(config) : existingDemo.config;
      const tagsJson = tags ? JSON.stringify(JSON.parse(tags)) : existingDemo.tags;
      
      await runQuery(`
        UPDATE demos 
        SET title = ?, description = ?, config = ?, tags = ?, status = 'pending', updated_at = ?
        WHERE id = ?
      `, [
        title || existingDemo.title,
        description || existingDemo.description,
        configJson,
        tagsJson,
        Date.now(),
        demoId
      ]);
      
      const updatedDemo = await getRow('SELECT * FROM demos WHERE id = ?', [demoId]);
      res.json({ 
        code: 200, 
        message: '更新提交成功，等待管理员审批', 
        data: mapDemoRow(updatedDemo)
      });
    }
  } catch (error) {
    console.error('Update demo error:', error);
    try {
      const demoId = req.params.id;
      const projectDir = path.join(PROJECTS_DIR, demoId);
      const backupPrefix = demoId + '_backup_';
      const backup = fs.readdirSync(PROJECTS_DIR).find(name => name.startsWith(backupPrefix));
      if (backup) {
        if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true, force: true });
        fs.renameSync(path.join(PROJECTS_DIR, backup), projectDir);
      }
      for (const files of Object.values(req.files || {})) {
        for (const file of files) {
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    } catch (cleanupError) {
      console.error('Update demo cleanup error:', cleanupError);
    }
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// GET /demos/:id/structure - 获取项目结构
router.get('/:id/structure', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.project_type !== 'multi-file') {
      return res.status(400).json({ 
        code: 400, 
        message: '此演示不是多文件项目', 
        data: null 
      });
    }
    
    const projectDir = path.join(PROJECTS_DIR, demo.id);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ 
        code: 404, 
        message: '项目文件不存在', 
        data: null 
      });
    }
    
    const projectInfo = analyzeProjectStructure(projectDir);
    
    res.json({ 
      code: 200, 
      message: 'Success', 
      data: projectInfo 
    });
  } catch (error) {
    console.error('Get project structure error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/:id/files/:filepath - 获取项目文件内容
router.get('/:id/files/*', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.project_type !== 'multi-file') {
      return res.status(400).json({ 
        code: 400, 
        message: '此演示不是多文件项目', 
        data: null 
      });
    }
    
    // URL解码路径，处理中文和特殊字符
    const filepath = decodeURIComponent(req.params[0] || '');
    const isOriginal = req.query.original === 'true';
    const projectDir = path.join(PROJECTS_DIR, demo.id);
    const baseDir = isOriginal ? path.join(projectDir, '_original') : projectDir;
    const fullPath = path.join(baseDir, filepath);
    
    const normalizedPath = path.normalize(fullPath);
    const normalizedBaseDir = path.normalize(baseDir);
    
    if (!normalizedPath.startsWith(normalizedBaseDir)) {
      return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ code: 404, message: '文件不存在', data: null });
    }
    
    const ext = path.extname(filepath).toLowerCase();
    
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.md': 'text/markdown'
    };
    
    if (['.html', '.htm', '.css', '.js', '.json', '.txt', '.md'].includes(ext)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.json({ 
        code: 200, 
        message: 'Success', 
        data: { 
          path: filepath,
          content: content,
          extension: ext
        } 
      });
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.sendFile(fullPath, { root: process.cwd() });
    }
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// 辅助函数：分析项目结构
function analyzeProjectStructure(dir) {
  const structure = [];
  const entryFiles = [];
  const imageFiles = [];
  let totalSize = 0;
  
  function scanDirectory(currentDir, basePath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      // 过滤掉系统隐藏文件和目录
      if (entry.name === '__MACOSX' || entry.name.startsWith('.') || entry.name === '.DS_Store' || entry.name === '_original') {
        continue;
      }
      
      const relativePath = path.join(basePath, entry.name);
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        structure.push({
          type: 'directory',
          path: relativePath,
          name: entry.name
        });
        scanDirectory(fullPath, relativePath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const fileStats = fs.statSync(fullPath);
        
        structure.push({
          type: 'file',
          path: relativePath,
          name: entry.name,
          size: fileStats.size,
          extension: ext
        });
        
        totalSize += fileStats.size;
        
        // 收集HTML入口文件
        if (ext === '.html' || ext === '.htm') {
          entryFiles.push(relativePath);
        }
        
        // 收集图片文件
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext)) {
          imageFiles.push({
            path: relativePath,
            name: entry.name,
            size: fileStats.size
          });
        }
      }
    }
  }
  
  scanDirectory(dir);
  
  return {
    structure,
    entryFiles,
    imageFiles,
    totalSize
  };
}

// ==================== COMMENT ROUTES ====================

// GET /demos/:id/comments - Get all comments for a demo
router.get('/:id/comments', async (req, res) => {
  const demoId = req.params.id;
  
  try {
    const comments = await getAllRows(
      'SELECT * FROM demo_comments WHERE demo_id = ? ORDER BY created_at DESC',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Success',
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos/:id/comments - Add a comment to a demo
router.post('/:id/comments', async (req, res) => {
  const demoId = req.params.id;
  const { content } = req.body;
  
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ code: 400, message: 'Comment content is required', data: null });
  }
  
  try {
    const now = Date.now();
    await runQuery(
      'INSERT INTO demo_comments (demo_id, user_id, username, content, created_at) VALUES (?, ?, ?, ?, ?)',
      [demoId, user.id, user.username, content.trim(), now]
    );
    
    const comments = await getAllRows(
      'SELECT * FROM demo_comments WHERE demo_id = ? ORDER BY created_at DESC',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Comment added successfully',
      data: comments
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id/comments/:commentId - Delete a comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  const demoId = req.params.id;
  const commentId = req.params.commentId;
  
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    const comment = await getRow(
      'SELECT * FROM demo_comments WHERE id = ? AND demo_id = ?',
      [commentId, demoId]
    );
    
    if (!comment) {
      return res.status(404).json({ code: 404, message: 'Comment not found', data: null });
    }
    
    const isOwner = comment.user_id === user.id;
    const isAdmin = user.role === 'general_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: 'Not authorized to delete this comment', data: null });
    }
    
    await runQuery(
      'DELETE FROM demo_comments WHERE id = ?',
      [commentId]
    );
    
    const comments = await getAllRows(
      'SELECT * FROM demo_comments WHERE demo_id = ? ORDER BY created_at DESC',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Comment deleted successfully',
      data: comments
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/:id - 必须放在所有具体路由之后，否则会拦截其他路由
router.get('/:id', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error fetching demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
