import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const parseJson = (value, fallback = undefined) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const mapPublicationRow = (row) => {
  if (!row) return null;
  const publication = {
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

  if (row.demo_status) {
    publication.demo = {
      id: row.demo_id,
      title: row.demo_title,
      description: row.demo_description || '',
      categoryId: row.demo_category_id,
      layer: row.demo_layer,
      communityId: row.demo_community_id || undefined,
      author: row.demo_author || 'Unknown',
      creatorId: row.demo_creator_id || undefined,
      thumbnailUrl: row.demo_thumbnail_url || undefined,
      status: row.demo_status,
      createdAt: row.demo_created_at,
      updatedAt: row.demo_updated_at || undefined,
      rejectionReason: row.demo_rejection_reason || undefined,
      bountyId: row.demo_bounty_id || undefined,
      projectType: row.demo_project_type || 'single-file',
      entryFile: row.demo_entry_file || undefined,
      projectSize: row.demo_project_size || undefined,
      archived: row.demo_archived ? true : false,
      archivedAt: row.demo_archived_at || undefined,
      tags: parseJson(row.demo_tags, undefined),
      sourceVisibility: row.demo_source_visibility || 'open'
    };
  }

  return publication;
};

const publicationSelect = `
  SELECT p.*,
    d.title AS demo_title,
    d.description AS demo_description,
    d.category_id AS demo_category_id,
    d.layer AS demo_layer,
    d.community_id AS demo_community_id,
    d.author AS demo_author,
    d.creator_id AS demo_creator_id,
    d.thumbnail_url AS demo_thumbnail_url,
    d.status AS demo_status,
    d.created_at AS demo_created_at,
    d.updated_at AS demo_updated_at,
    d.rejection_reason AS demo_rejection_reason,
    d.bounty_id AS demo_bounty_id,
    d.project_type AS demo_project_type,
    d.entry_file AS demo_entry_file,
    d.project_size AS demo_project_size,
    d.archived AS demo_archived,
    d.archived_at AS demo_archived_at,
    d.tags AS demo_tags,
    d.source_visibility AS demo_source_visibility
  FROM demo_publications p
  LEFT JOIN demos d ON d.id = p.demo_id
`;

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

const getTargetReviewMode = async (layer, communityId) => {
  if (layer === 'community' && communityId) {
    const community = await getRow('SELECT review_mode, type FROM communities WHERE id = ?', [communityId]);
    return community?.review_mode || (community?.type === 'personal' ? 'post_review' : 'pre_review');
  }
  const setting = await getRow("SELECT value FROM app_settings WHERE key = 'general_review_mode'");
  return setting?.value || 'pre_review';
};

const publishLocation = async (publication) => {
  const demo = await getRow('SELECT * FROM demos WHERE id = ?', [publication.demo_id]);
  if (!demo) return;
  if (demo.status !== 'published') {
    await runQuery('UPDATE demos SET status = ? WHERE id = ?', ['published', demo.id]);
  }
  await runQuery(`
    UPDATE demos
    SET layer = ?, community_id = ?, category_id = ?
    WHERE id = ?
  `, [
    publication.layer,
    publication.community_id || null,
    publication.category_id,
    publication.demo_id
  ]);
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

  // Check if user is the creator (by creator_id or author)
  // Allow if creator_id matches, or author matches, or creator_id is null/empty (legacy data)
  const isCreator = demo.creator_id === user.id || 
                    demo.author === user.username || 
                    (!demo.creator_id && demo.author === 'Anonymous') ||
                    (!demo.creator_id && !demo.author);
  
  if (!isCreator) {
    console.log(`[Publications] Permission denied: user=${user.id}/${user.username}, demo creator=${demo.creator_id}, demo author=${demo.author}`);
    return res.status(403).json({ code: 403, message: 'You can only publish your own demos', data: null });
  }

  if (layer === 'community' && !communityId) {
    return res.status(400).json({ code: 400, message: 'Community ID required for community layer', data: null });
  }

  // 移除必须是社区成员的限制，允许发布到任何社区

  const id = uuidv4();
  const now = Date.now();

  try {
    const reviewMode = await getTargetReviewMode(layer, communityId || null);
    const initialStatus = reviewMode === 'post_review' ? 'published' : 'pending';
    await runQuery(`
      INSERT INTO demo_publications 
      (id, demo_id, layer, community_id, category_id, status, requested_by, requested_at, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, demoId, layer, communityId || null, categoryId, initialStatus, user.id, now, initialStatus === 'published' ? user.id : null, initialStatus === 'published' ? now : null]);

    if (initialStatus === 'published') {
      await publishLocation({
        demo_id: demoId,
        layer,
        community_id: communityId || null,
        category_id: categoryId
      });
    }

    const publication = await getRow(`${publicationSelect} WHERE p.id = ?`, [id]);
    res.json({ code: 200, message: initialStatus === 'published' ? 'Published immediately' : 'Publication request submitted', data: mapPublicationRow(publication) });
  } catch (error) {
    console.error('Error creating publication request:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ code: 409, message: '该作品已经申请发布到此位置，请勿重复提交', data: null });
    }
    res.status(500).json({ code: 500, message: 'Server error: ' + error.message, data: null });
  }
});

// GET /publications - Get all publications (filtered by user or status)
router.get('/', async (req, res) => {
  const { demoId, status, layer, communityId, requestedBy } = req.query;
  
  let query = `${publicationSelect} WHERE 1=1`;
  const params = [];

  if (demoId) {
    query += ' AND p.demo_id = ?';
    params.push(demoId);
  }
  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }
  if (layer) {
    query += ' AND p.layer = ?';
    params.push(layer);
  }
  if (communityId) {
    query += ' AND p.community_id = ?';
    params.push(communityId);
  }
  if (requestedBy) {
    query += ' AND p.requested_by = ?';
    params.push(requestedBy);
  }

  query += ' ORDER BY p.requested_at DESC';

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

  let query = `${publicationSelect} WHERE p.status = 'pending'`;
  const params = [];

  if (user.role !== 'general_admin' && user.role !== 'site_sub_admin') {
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
  if (user.role === 'general_admin' || user.role === 'site_sub_admin') {
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
      await publishLocation(publication);
    }

    const updated = await getRow(`${publicationSelect} WHERE p.id = ?`, [req.params.id]);
    res.json({ code: 200, message: 'Status updated', data: mapPublicationRow(updated) });
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
