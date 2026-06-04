import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

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

const isCommunityAdmin = async (communityId, userId) => {
  if (!communityId || !userId) return false;
  // Check if creator
  const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
  if (community && community.creator_id === userId) return true;
  // Check if sub-admin
  const member = await getRow(
    "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'member' AND role = 'admin'",
    [communityId, userId]
  );
  return !!member;
};

const mapCategoryRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    communityId: row.community_id || undefined,
    createdAt: row.created_at
  };
};

// GET /categories
router.get('/', async (req, res) => {
  const { layer, communityId } = req.query;
  
  try {
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];
    
    if (layer === 'general') {
      query += ' AND community_id IS NULL';
    } else if (layer === 'community' && communityId) {
      query += ' AND community_id = ?';
      params.push(communityId);
    }
    
    query += ' ORDER BY created_at ASC';
    
    const categories = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: categories.map(mapCategoryRow) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /categories
router.post('/', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { name, parentId, communityId } = req.body;
  
  // Permission check
  let hasPermission = false;
  if (user.role === 'general_admin') {
    hasPermission = true;
  } else if (communityId) {
    hasPermission = await isCommunityAdmin(communityId, user.id);
  }

  if (!hasPermission) {
    return res.status(403).json({ code: 403, message: 'Forbidden: You do not have permission to manage categories here', data: null });
  }
  
  const id = 'cat-' + Date.now();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO categories (id, name, parent_id, community_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, name, parentId || null, communityId || null, now]);
    
    const category = await getRow('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapCategoryRow(category) });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /categories/:id
router.delete('/:id', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  try {
    const category = await getRow('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ code: 404, message: 'Category not found', data: null });
    }

    // Permission check
    let hasPermission = false;
    if (user.role === 'general_admin') {
      hasPermission = true;
    } else if (category.community_id) {
      hasPermission = await isCommunityAdmin(category.community_id, user.id);
    }

    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    // SQLite with foreign key constraints will handle cascade delete
    const result = await runQuery('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Category not found', data: null });
    }
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /categories/:id - Rename a category
router.put('/:id', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ code: 400, message: 'New name is required', data: null });
  }

  try {
    const category = await getRow('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ code: 404, message: 'Category not found', data: null });
    }

    // Permission check
    let hasPermission = false;
    if (user.role === 'general_admin') {
      hasPermission = true;
    } else if (category.community_id) {
      hasPermission = await isCommunityAdmin(category.community_id, user.id);
    }

    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    const result = await runQuery('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    
    // Check if the update was successful. If changes is 0, it might be because the name is the same.
    // We can also verify that the category still exists.
    const updatedCategory = await getRow('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!updatedCategory) {
      return res.status(404).json({ code: 404, message: 'Category not found after update', data: null });
    }
    
    console.log(`[Categories] Category ${req.params.id} renamed to ${name}`);
    res.json({ code: 200, message: 'Updated successfully', data: mapCategoryRow(updatedCategory) });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ code: 500, message: `目录名称保存失败: ${error.message}`, data: null });
  }
});

export default router;
