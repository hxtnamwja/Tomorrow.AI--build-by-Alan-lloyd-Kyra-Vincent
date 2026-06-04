import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const mapFeedbackRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    layer: row.layer,
    communityId: row.community_id || undefined,
    demoId: row.demo_id || undefined,
    demoTitle: row.demo_title || undefined,
    communityName: row.community_name || undefined,
    status: row.status,
    resolution: row.resolution || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined
  };
};

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

// Create a new feedback
router.post('/', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }

    const { type, title, content, layer, communityId, demoId, demoTitle, communityName } = req.body;
    const id = uuidv4();
    const createdAt = Date.now();

    await runQuery(`
      INSERT INTO feedback (
        id, type, title, content, layer, community_id, demo_id, 
        demo_title, community_name, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [id, type, title, content, layer, communityId || null, demoId || null, 
         demoTitle || null, communityName || null, user.id, createdAt]);

    const feedback = await getRow('SELECT * FROM feedback WHERE id = ?', [id]);
    res.json({
      code: 200,
      message: 'Success',
      data: mapFeedbackRow(feedback)
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ code: 500, message: 'Failed to create feedback', data: null });
  }
});

// Get feedback for a specific user
router.get('/my', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }

    const rows = await getAllRows(`
      SELECT * FROM feedback 
      WHERE created_by = ? 
      ORDER BY created_at DESC
    `, [user.id]);

    res.json({
      code: 200,
      message: 'Success',
      data: rows.map(mapFeedbackRow)
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ code: 500, message: 'Failed to fetch feedback', data: null });
  }
});

// Get pending feedback for admin/community admin
router.get('/pending', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }

    let rows;
    if (user.role === 'general_admin' || user.role === 'site_sub_admin') {
      // General admin sees all pending feedback
      rows = await getAllRows(`
        SELECT * FROM feedback 
        WHERE status IN ('pending', 'in_progress')
        ORDER BY created_at DESC
      `, []);
    } else {
      // Community admin sees feedback for their communities
      const communities = await getAllRows(`
        SELECT * FROM communities WHERE creator_id = ?
        UNION
        SELECT c.* FROM communities c
        JOIN community_members cm ON cm.community_id = c.id
        WHERE cm.user_id = ? AND cm.status = 'member' AND cm.role = 'admin'
      `, [user.id, user.id]);
      
      const communityIds = communities.map(c => c.id);
      
      if (communityIds.length === 0) {
        return res.json({
          code: 200,
          message: 'Success',
          data: []
        });
      }
      
      const placeholders = communityIds.map(() => '?').join(',');
      rows = await getAllRows(`
        SELECT * FROM feedback 
        WHERE status IN ('pending', 'in_progress')
        AND community_id IN (${placeholders})
        ORDER BY created_at DESC
      `, communityIds);
    }
    
    res.json({
      code: 200,
      message: 'Success',
      data: rows.map(mapFeedbackRow)
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ code: 500, message: 'Failed to fetch feedback', data: null });
  }
});

// Update feedback status
router.put('/:id/status', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }

    const { id } = req.params;
    const { status, resolution } = req.body;

    const feedback = await getRow('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!feedback) {
      return res.status(404).json({ code: 404, message: 'Feedback not found', data: null });
    }

    // Check permissions
    let hasPermission = false;
    if (user.role === 'general_admin' || user.role === 'site_sub_admin') {
      hasPermission = true;
    } else if (feedback.community_id) {
      const community = await getRow('SELECT * FROM communities WHERE id = ?', [feedback.community_id]);
      if (community && community.creator_id === user.id) hasPermission = true;
      if (!hasPermission) {
        const membership = await getRow(
          "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'member' AND role = 'admin'",
          [feedback.community_id, user.id]
        );
        hasPermission = !!membership;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: 'Not authorized', data: null });
    }

    await runQuery(`
      UPDATE feedback 
      SET status = ?, resolution = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `, [status, resolution || null, user.id, Date.now(), id]);

    const updatedFeedback = await getRow('SELECT * FROM feedback WHERE id = ?', [id]);
    res.json({
      code: 200,
      message: 'Success',
      data: mapFeedbackRow(updatedFeedback)
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ code: 500, message: 'Failed to update feedback', data: null });
  }
});

// Delete feedback (only creator can delete)
router.delete('/:id', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated', data: null });
    }

    const { id } = req.params;

    const feedback = await getRow('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!feedback) {
      return res.status(404).json({ code: 404, message: 'Feedback not found', data: null });
    }

    // Only the creator can delete the feedback
    if (feedback.created_by !== user.id) {
      return res.status(403).json({ code: 403, message: 'Not authorized', data: null });
    }

    await runQuery('DELETE FROM feedback WHERE id = ?', [id]);
    res.json({
      code: 200,
      message: 'Feedback deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ code: 500, message: 'Failed to delete feedback', data: null });
  }
});

export default router;
