import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();
const REVIEW_MODES = new Set(['pre_review', 'post_review']);

const mapCommunityRow = async (row) => {
  if (!row) return null;
  const members = await getAllRows(
    'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
    [row.id, 'member']
  );
  const pendingMembers = await getAllRows(
    'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
    [row.id, 'pending']
  );
  const adminMembers = await getAllRows(
    "SELECT user_id FROM community_members WHERE community_id = ? AND status = 'member' AND role = 'admin'",
    [row.id]
  );
  return {
	    id: row.id,
	    name: row.name,
	    nameCn: row.name_cn || undefined,
	    nameEn: row.name_en || undefined,
	    description: row.description,
	    descriptionCn: row.description_cn || undefined,
	    descriptionEn: row.description_en || undefined,
    creatorId: row.creator_id,
    code: row.code,
    status: row.status,
    members: members.map((m) => m.user_id),
    pendingMembers: pendingMembers.map((m) => m.user_id),
    adminMembers: adminMembers.map((m) => m.user_id),
    type: row.type || 'closed',
    reviewMode: row.review_mode || (row.type === 'personal' ? 'post_review' : 'pre_review'),
    personalAccessDays: row.personal_access_days || 7,
    createdAt: row.created_at
  };
};

const hasActivePersonalAccess = (membership) => {
  if (!membership) return false;
  if (membership.status !== 'member') return false;
  if (!membership.access_expires_at) return true;
  return Number(membership.access_expires_at) > Date.now();
};

const requireUser = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
    return null;
  }
  return user;
};

// Helper to generate 12-digit code
const generateCode = () => Math.random().toString().slice(2, 14);

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

// GET /communities
router.get('/', async (req, res) => {
  const { status, userId, type } = req.query;
  const currentUser = await getCurrentUser(req);

  try {
    let query = `
      SELECT c.*
      FROM communities c
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND c.type = ?';
      params.push(type);
    }

    if (userId) {
      query += ' AND c.id IN (SELECT community_id FROM community_members WHERE user_id = ? AND status = "member" AND (access_expires_at IS NULL OR access_expires_at > ?))';
      params.push(userId);
      params.push(Date.now());
    }

    query += ' ORDER BY c.created_at DESC';

    const communities = await getAllRows(query, params);

    if (communities.length === 0) {
      return res.json({ code: 200, message: 'Success', data: [] });
    }

    // Optimization: Batch fetch all members for these communities to avoid N+1 queries
    const communityIds = communities.map(c => c.id);
    const placeholders = communityIds.map(() => '?').join(',');

    const allMembers = await getAllRows(
      `SELECT community_id, user_id, status, role, access_expires_at FROM community_members WHERE community_id IN (${placeholders})`,
      communityIds
    );

    // Group members by community
    const memberMap = {};
    allMembers.forEach(m => {
      if (!memberMap[m.community_id]) {
        memberMap[m.community_id] = { members: [], pending: [], admins: [] };
      }
      if (m.status === 'member' && hasActivePersonalAccess(m)) {
        memberMap[m.community_id].members.push(m.user_id);
        if (m.role === 'admin') {
          memberMap[m.community_id].admins.push(m.user_id);
        }
      } else if (m.status === 'pending') {
        memberMap[m.community_id].pending.push(m.user_id);
      }
    });

    const visibleCommunities = communities.filter(c => {
      if (c.type !== 'personal') return true;
      if (!currentUser) return false;
      if (c.creator_id === currentUser.id) return true;
      const mm = memberMap[c.id] || { members: [] };
      return mm.members.includes(currentUser.id);
    });

    const data = visibleCommunities.map(c => {
      const mm = memberMap[c.id] || { members: [], pending: [], admins: [] };
      return {
        id: c.id,
        name: c.name,
        nameCn: c.name_cn || undefined,
        nameEn: c.name_en || undefined,
        description: c.description,
        descriptionCn: c.description_cn || undefined,
        descriptionEn: c.description_en || undefined,
        creatorId: c.creator_id,
        code: c.code,
        status: c.status,
        members: mm.members,
        pendingMembers: mm.pending,
        adminMembers: mm.admins,
        type: c.type || 'closed',
        reviewMode: c.review_mode || (c.type === 'personal' ? 'post_review' : 'pre_review'),
        personalAccessDays: c.personal_access_days || 7,
        createdAt: c.created_at
      };
    });

    res.json({ code: 200, message: 'Success', data });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.get('/general-review-mode', async (_req, res) => {
  try {
    const setting = await getRow("SELECT value FROM app_settings WHERE key = 'general_review_mode'");
    res.json({ code: 200, message: 'Success', data: { reviewMode: setting?.value || 'pre_review' } });
  } catch (error) {
    console.error('Error fetching general review mode:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.patch('/general-review-mode', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (user.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Only general admin can update this setting', data: null });
  }

  const { reviewMode } = req.body;
  if (!REVIEW_MODES.has(reviewMode)) {
    return res.status(400).json({ code: 400, message: 'Invalid review mode', data: null });
  }

  try {
    await runQuery(`
      INSERT INTO app_settings (key, value) VALUES ('general_review_mode', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, [reviewMode]);
    res.json({ code: 200, message: 'Success', data: { reviewMode } });
  } catch (error) {
    console.error('Error updating general review mode:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.get('/personal/by-user/:userId', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const community = await getRow(
      "SELECT * FROM communities WHERE creator_id = ? AND type = 'personal' LIMIT 1",
      [req.params.userId]
    );
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Personal community not found', data: null });
    }
    const membership = await getRow(
      'SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, user.id]
    );
    const canAccess = community.creator_id === user.id || hasActivePersonalAccess(membership);
    res.json({
      code: 200,
      message: 'Success',
      data: {
        community: canAccess ? await mapCommunityRow(community) : {
          id: community.id,
          name: community.name,
          nameCn: community.name_cn || undefined,
          nameEn: community.name_en || undefined,
          description: community.description,
          descriptionCn: community.description_cn || undefined,
          descriptionEn: community.description_en || undefined,
          creatorId: community.creator_id,
          status: community.status,
          type: 'personal',
          reviewMode: community.review_mode || 'post_review',
          personalAccessDays: community.personal_access_days || 7,
          createdAt: community.created_at,
          members: [],
          pendingMembers: membership?.status === 'pending' ? [user.id] : [],
          adminMembers: []
        },
        access: canAccess ? 'member' : (membership?.status === 'pending' ? 'pending' : 'none')
      }
    });
  } catch (error) {
    console.error('Error fetching personal community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities
router.post('/', async (req, res) => {
  const { name, nameCn, nameEn, description, descriptionCn, descriptionEn, type = 'closed' } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const id = 'comm-' + Date.now();
  const code = generateCode();
  const now = Date.now();
  const safeType = ['open', 'closed'].includes(type) ? type : 'closed';

  try {
    await runQuery(`
      INSERT INTO communities (id, name, name_cn, name_en, description, description_cn, description_en, creator_id, code, status, type, review_mode, personal_access_days, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pre_review', 7, ?)
    `, [id, name, nameCn || null, nameEn || null, description, descriptionCn || null, descriptionEn || null, user.id, code, 'pending', safeType, now]);

    // Creator is automatically a member and admin
    await runQuery(`
      INSERT INTO community_members (community_id, user_id, status, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, user.id, 'member', 'admin', now]);

    const community = await getRow('SELECT * FROM communities WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (user.role !== 'general_admin' && user.role !== 'site_sub_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    const result = await runQuery('UPDATE communities SET status = ? WHERE id = ?', [status, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error updating community status:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/join-by-code
router.post('/join-by-code', async (req, res) => {
  const { code } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE code = ? AND status = "approved"', [code]);

    if (!community) {
      return res.status(404).json({ code: 404, message: 'Invalid code or community not approved', data: null });
    }

    if (community.type === 'personal' && community.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Personal communities require owner approval from the profile page', data: null });
    }

    // Check if already a member
    const existing = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, user.id]);

    if (existing) {
      if (existing.status === 'member') {
        return res.json({ code: 200, message: 'Already a member', data: community });
      }
      // Update pending to member
      await runQuery('UPDATE community_members SET status = ? WHERE id = ?', ['member', existing.id]);
    } else {
      await runQuery('INSERT INTO community_members (community_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)',
        [community.id, user.id, 'member', Date.now()]);
    }

    res.json({ code: 200, message: 'Joined successfully', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/join-request
router.post('/:id/join-request', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);

    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    if (community.type === 'personal' && community.creator_id === user.id) {
      return res.status(400).json({ code: 400, message: 'Owner already has access', data: null });
    }

    // Check if already member or pending
    const existing = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
      [req.params.id, user.id]);

    if (existing) {
      return res.json({ code: 200, message: 'Request already submitted', data: null });
    }

    await runQuery('INSERT INTO community_members (community_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)',
      [req.params.id, user.id, 'pending', Date.now()]);

    res.json({ code: 200, message: 'Request submitted', data: null });
  } catch (error) {
    console.error('Error requesting to join:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/members/manage
router.post('/:id/members/manage', async (req, res) => {
  const { userId, action } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    // Check permissions based on action
    if (action === 'kick') {
      // Only creator can kick members
      if (community.creator_id !== user.id) {
        return res.status(403).json({ code: 403, message: 'Only community creator can kick members', data: null });
      }
      // Cannot kick creator
      if (userId === community.creator_id) {
        return res.status(400).json({ code: 400, message: 'Cannot kick community creator', data: null });
      }
    } else {
      const communityAdmin = await getRow(
        "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'member' AND role = 'admin'",
        [req.params.id, user.id]
      );
      if (
        community.creator_id !== user.id &&
        user.role !== 'general_admin' &&
        user.role !== 'site_sub_admin' &&
        !communityAdmin
      ) {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
    const member = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
      [req.params.id, userId]);

    if (!member) {
      return res.status(404).json({ code: 404, message: 'Member not found', data: null });
    }

    if (action === 'accept') {
      const expiresAt = community.type === 'personal'
        ? Date.now() + (Number(community.personal_access_days) || 7) * 24 * 60 * 60 * 1000
        : null;
      await runQuery('UPDATE community_members SET status = ?, access_expires_at = ? WHERE id = ?', ['member', expiresAt, member.id]);
    } else if (action === 'kick' || action === 'reject_request') {
      await runQuery('DELETE FROM community_members WHERE id = ?', [member.id]);
    }

    res.json({ code: 200, message: 'Success', data: null });
  } catch (error) {
    console.error('Error managing member:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /communities/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const members = await getAllRows(`
      SELECT u.id, u.username, cm.status, cm.joined_at, cm.role
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = ?
    `, [req.params.id]);

    res.json({ code: 200, message: 'Success', data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id/members/:userId/role - Toggle sub-admin role
router.patch('/:id/members/:userId/role', async (req, res) => {
  const { role: newRole } = req.body; // 'admin' or 'member'
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Only community creator or general_admin can change member roles
    if (community.creator_id !== user.id && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Only the community creator or general admin can manage roles', data: null });
    }

    // Cannot change creator's own role
    if (req.params.userId === community.creator_id) {
      return res.status(400).json({ code: 400, message: 'Cannot change the creator\'s role', data: null });
    }

    if (!['admin', 'member'].includes(newRole)) {
      return res.status(400).json({ code: 400, message: 'Invalid role. Must be admin or member', data: null });
    }

    const member = await getRow(
      'SELECT * FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
      [req.params.id, req.params.userId, 'member']
    );
    if (!member) {
      return res.status(404).json({ code: 404, message: 'Member not found in this community', data: null });
    }

    await runQuery('UPDATE community_members SET role = ? WHERE id = ?', [newRole, member.id]);
    res.json({ code: 200, message: `Role updated to ${newRole}`, data: null });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ code: 500, message: `设置社区分管理员失败: ${error.message}`, data: null });
  }
});

// PATCH /communities/:id/code
router.patch('/:id/code', async (req, res) => {
  const newCode = generateCode();
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    if (community.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }
    const result = await runQuery('UPDATE communities SET code = ? WHERE id = ?', [newCode, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    res.json({ code: 200, message: 'Success', data: { code: newCode } });
  } catch (error) {
    console.error('Error updating code:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/join - Join open community directly
router.post('/:id/join', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);

    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check if community is open
    if (community.type !== 'open') {
      return res.status(403).json({ code: 403, message: 'This community is not open', data: null });
    }

    // Check if already a member
    const existing = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, user.id]);

    if (existing) {
      if (existing.status === 'member') {
        return res.json({ code: 200, message: 'Already a member', data: community });
      }
      // Update pending to member
      await runQuery('UPDATE community_members SET status = ? WHERE id = ?', ['member', existing.id]);
    } else {
      await runQuery('INSERT INTO community_members (community_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)',
        [community.id, user.id, 'member', Date.now()]);
    }

    res.json({ code: 200, message: 'Joined successfully', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id - Update community info (name, description, type, etc.)
router.patch('/:id', async (req, res) => {
  const { name, nameCn, nameEn, description, descriptionCn, descriptionEn, members, pendingMembers, type, reviewMode, personalAccessDays } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    // Check if community exists
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Only creator or general admin can update community settings.
    if (community.creator_id !== user.id && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Only creator or general admin can update community', data: null });
    }

    // Update basic info if provided
    if (name !== undefined || nameCn !== undefined || nameEn !== undefined || description !== undefined || descriptionCn !== undefined || descriptionEn !== undefined || type !== undefined || reviewMode !== undefined || personalAccessDays !== undefined) {
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (nameCn !== undefined) {
        updates.push('name_cn = ?');
        params.push(nameCn || null);
      }
      if (nameEn !== undefined) {
        updates.push('name_en = ?');
        params.push(nameEn || null);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (descriptionCn !== undefined) {
        updates.push('description_cn = ?');
        params.push(descriptionCn || null);
      }
      if (descriptionEn !== undefined) {
        updates.push('description_en = ?');
        params.push(descriptionEn || null);
      }
      if (type !== undefined) {
        if (community.type === 'personal' || !['open', 'closed'].includes(type)) {
          return res.status(400).json({ code: 400, message: 'Invalid community type change', data: null });
        }
        updates.push('type = ?');
        params.push(type);
      }
      if (reviewMode !== undefined) {
        if (!REVIEW_MODES.has(reviewMode)) {
          return res.status(400).json({ code: 400, message: 'Invalid review mode', data: null });
        }
        updates.push('review_mode = ?');
        params.push(reviewMode);
      }
      if (personalAccessDays !== undefined) {
        const days = Math.max(1, Math.min(365, Number(personalAccessDays) || 7));
        updates.push('personal_access_days = ?');
        params.push(days);
      }

      if (updates.length > 0) {
        params.push(req.params.id);
        await runQuery(`UPDATE communities SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    }

    // Update members if provided (for member management)
    if (members !== undefined && Array.isArray(members)) {
      // Get current members from database
      const currentMembers = await getAllRows(
        'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
        [req.params.id, 'member']
      );
      const currentMemberIds = currentMembers.map(m => m.user_id);

      // Find members to remove (in current but not in new list)
      const membersToRemove = currentMemberIds.filter(id => !members.includes(id));
      for (const memberId of membersToRemove) {
        await runQuery(
          'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
          [req.params.id, memberId]
        );
      }
    }

    // Update pending members if provided (for join request management)
    if (pendingMembers !== undefined && Array.isArray(pendingMembers)) {
      // Get current pending members
      const currentPending = await getAllRows(
        'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
        [req.params.id, 'pending']
      );
      const currentPendingIds = currentPending.map(m => m.user_id);

      // Find pending members to remove (rejected requests)
      const pendingToRemove = currentPendingIds.filter(id => !pendingMembers.includes(id));
      for (const memberId of pendingToRemove) {
        await runQuery(
          'DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
          [req.params.id, memberId, 'pending']
        );
      }
    }

    // Return updated community
    const updatedCommunity = await mapCommunityRow(
      await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id])
    );

    res.json({ code: 200, message: 'Updated successfully', data: updatedCommunity });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// Community ban endpoints
// POST /communities/:id/ban
router.post('/:id/ban', async (req, res) => {
  const { userId, reason } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check permissions: only creator or general admin can ban
    if (community.creator_id !== user.id && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    // Cannot ban creator
    if (userId === community.creator_id) {
      return res.status(400).json({ code: 400, message: 'Cannot ban community creator', data: null });
    }

    const banId = 'cb-' + Date.now();
    await runQuery(`
      INSERT OR REPLACE INTO community_bans (id, community_id, user_id, reason, banned_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [banId, req.params.id, userId, reason || null, user.id, Date.now()]);

    // Also remove from community members if they are a member
    await runQuery('DELETE FROM community_members WHERE community_id = ? AND user_id = ?', [req.params.id, userId]);

    res.json({ code: 200, message: 'User banned from community', data: null });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/unban
router.post('/:id/unban', async (req, res) => {
  const { userId } = req.body;
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check permissions: only creator or general admin can unban
    if (community.creator_id !== user.id && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    const result = await runQuery('DELETE FROM community_bans WHERE community_id = ? AND user_id = ?', [req.params.id, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Ban not found', data: null });
    }

    res.json({ code: 200, message: 'User unbanned from community', data: null });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /communities/:id/bans
router.get('/:id/bans', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check permissions: only creator or general admin can view bans
    if (community.creator_id !== user.id && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    const bans = await getAllRows(`
      SELECT cb.*, u.username
      FROM community_bans cb
      JOIN users u ON cb.user_id = u.id
      WHERE cb.community_id = ?
    `, [req.params.id]);

    res.json({ code: 200, message: 'Success', data: bans });
  } catch (error) {
    console.error('Error fetching bans:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/leave - Leave a community
router.post('/:id/leave', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Cannot leave if you're the creator
    if (community.creator_id === user.id) {
      return res.status(400).json({ code: 400, message: 'Creator cannot leave the community', data: null });
    }

    // Check if member
    const member = await getRow(
      'SELECT * FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
      [req.params.id, user.id, 'member']
    );

    if (!member) {
      return res.status(400).json({ code: 400, message: 'Not a member of this community', data: null });
    }

    // Remove member
    await runQuery('DELETE FROM community_members WHERE id = ?', [member.id]);

    res.json({ code: 200, message: 'Left community successfully', data: null });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /communities/:id
router.delete('/:id', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  // Get the community first to check permissions
  const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
  if (!community) {
    return res.status(404).json({ code: 404, message: 'Community not found', data: null });
  }

  if (community.type === 'personal') {
    return res.status(400).json({ code: 400, message: 'Personal community cannot be deleted', data: null });
  }

  // Only general admin or community creator can delete communities
  if (user.role !== 'general_admin' && community.creator_id !== user.id) {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    // Delete all community members first
    await runQuery('DELETE FROM community_members WHERE community_id = ?', [req.params.id]);

    // Delete all categories for this community
    await runQuery('DELETE FROM categories WHERE community_id = ?', [req.params.id]);

    // Do NOT archive demos, just set community_id to null so they stay in personal published work
    await runQuery(
      'UPDATE demos SET community_id = NULL WHERE community_id = ?',
      [req.params.id]
    );

    // Delete the community
    const result = await runQuery('DELETE FROM communities WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
