import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const mapPublicationRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    demoId: row.demo_id,
    layer: row.layer,
    communityId: row.community_id || undefined,
    categoryId: row.category_id,
    status: row.status,
    rejectionReason: row.rejection_reason || undefined,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
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

const isCommunityMember = async (communityId, userId) => {
  const member = await getRow(
    'SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
    [communityId, userId, 'member']
  );
  return !!member;
};

const isCommunityAdmin = async (communityId, userId) => {
  const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
  if (community && community.creator_id === userId) return true;
  
  const member = await getRow(
    "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'member' AND role = 'admin'",
    [communityId, userId]
  );
  return !!member;
};

// POST /publications - Request to publish a demo to another community/layer
router.post('/', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { demoId, layer, communityId, categoryId } = req.body;

  const demo = await getRow('SELECT * FROM demos WHERE id = ?', [demoId]);
  if (!demo) {
    return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
  }

  if (demo.creator_id && demo.creator_id !== user.id) {
    return res.status(403).json({ code: 403, message: 'You can only publish your own demos', data: null });
  }

  if (layer === 'community' && !communityId) {
    return res.status(400).json({ code: 400, message: 'Community ID required for community layer', data: null });
  }

  if (layer === 'community') {
    const member = await isCommunityMember(communityId, user.id);
    if (!member) {
      return res.status(403).json({ code: 403, message: 'You must be a member of this community', data: null });
    }
  }

  const id = uuidv4();
  const now = Date.now();

  try {
    await runQuery(`
      INSERT INTO demo_publications 
      (id, demo_id, layer, community_id, category_id, status, requested_by, requested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, demoId, layer, communityId || null, categoryId, 'pending', user.id, now]);

    const publication = await getRow('SELECT * FROM demo_publications WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Publication request submitted', data: mapPublicationRow(publication) });
  } catch (error) {
    console.error('Error creating publication request:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /publications - Get all publications (filtered by user or status)
router.get('/', async (req, res) => {
  const { demoId, status, layer, communityId, requestedBy } = req.query;
  
  let query = 'SELECT * FROM demo_publications WHERE 1=1';
  const params = [];

  if (demoId) {
    query += ' AND demo_id = ?';
    params.push(demoId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (layer) {
    query += ' AND layer = ?';
    params.push(layer);
  }
  if (communityId) {
    query += ' AND community_id = ?';
    params.push(communityId);
  }
  if (requestedBy) {
    query += ' AND requested_by = ?';
    params.push(requestedBy);
  }

  query += ' ORDER BY requested_at DESC';

  try {
    const publications = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: publications.map(mapPublicationRow) });
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /publications/pending - Get pending publications for admin review
router.get('/pending', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code:401, message: 'Unauthorized', data: null });
  }

  let query = `
    SELECT p.* FROM demo_publications p
    WHERE p.status = 'pending'
  `;
  const params = [];

  if (user.role !== 'general_admin') {
    query += ` AND p.layer = ? AND p.community_id IN (
      SELECT id FROM communities WHERE creator_id = ?
      UNION
      SELECT community_id FROM community_members WHERE user_id = ? AND role = ? AND status = ?
    )`;
    params.push('community', user.id, user.id, 'admin', 'member');
  }

  query += ' ORDER BY p.requested_at DESC';

  try {
    const publications = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: publications.map(mapPublicationRow) });
  } catch (error) {
    console.error('Error fetching pending publications:', error);
    res.status(500).json({ code:500, message: 'Server error', data: null });
  }
});

// PATCH /publications/:id/status - Approve or reject a publication request
router.patch('/:id/status', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { status, rejectionReason } = req.body;
  const publication = await getRow('SELECT * FROM demo_publications WHERE id = ?', [req.params.id]);

  if (!publication) {
    return res.status(404).json({ code: 404, message: 'Publication not found', data: null });
  }

  let hasPermission = false;
  if (user.role === 'general_admin') {
    hasPermission = true;
  } else if (publication.layer === 'community' && publication.community_id) {
    hasPermission = await isCommunityAdmin(publication.community_id, user.id);
  }

  if (!hasPermission) {
    return res.status(403).json({ code: 403, message: 'You do not have permission to review this', data: null });
  }

  const now = Date.now();

  try {
    await runQuery(`
      UPDATE demo_publications 
      SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `, [status, rejectionReason || null, user.id, now, req.params.id]);

    if (status === 'published') {
      const demo = await getRow('SELECT * FROM demos WHERE id = ?', [publication.demo_id]);
      if (demo) {
        // Update demo status to published if it's not already
        if (demo.status !== 'published') {
          await runQuery('UPDATE demos SET status = ? WHERE id = ?', ['published', demo.id]);
          console.log(`[Publications] Demo ${demo.id} marked as published globally`);
        }

        await runQuery(`
          INSERT OR IGNORE INTO demo_locations (id, demo_id, layer, community_id, category_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(),
          publication.demo_id,
          publication.layer,
          publication.community_id || null,
          publication.category_id,
          Date.now()
        ]);
        console.log(`[Publications] Demo ${demo.id} added to location: ${publication.layer}${publication.community_id ? ' (' + publication.community_id + ')' : ''}`);
      }
    }

    const updated = await getRow('SELECT * FROM demo_publications WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Status updated', data: mapPublicationRow(updated) });
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
