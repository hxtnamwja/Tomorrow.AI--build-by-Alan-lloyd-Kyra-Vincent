import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const mapUserRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
    isBanned: row.is_banned,
    banReason: row.ban_reason || undefined,
    contactInfo: row.contact_info || undefined,
    paymentQr: row.payment_qr || undefined,
    bio: row.bio || undefined,
    contributionPoints: row.contribution_points || 0,
    points: row.points || 0,
    communityPoints: row.community_points || 0,
    favorites: row.favorites ? JSON.parse(row.favorites) : [],
    avatarBorder: row.avatar_border || undefined,
    avatarAccessory: row.avatar_accessory || undefined,
    avatarEffect: row.avatar_effect || undefined,
    usernameColor: row.username_color || undefined,
    usernameEffect: row.username_effect || undefined,
    profileTheme: row.profile_theme || undefined,
    profileBackground: row.profile_background || undefined,
    customTitle: row.custom_title || undefined,
    unlockedAchievements: row.unlocked_achievements ? JSON.parse(row.unlocked_achievements) : [],
    ownedItems: row.owned_items ? JSON.parse(row.owned_items) : []
  };
};

const mapDemoRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    layer: row.layer,
    communityId: row.community_id || undefined,
    code: row.code,
    author: row.author,
    creatorId: row.creator_id || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    status: row.status,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason || undefined,
    bountyId: row.bounty_id || undefined,
    likeCount: row.like_count || 0,
    projectType: row.project_type || 'single-file',
    entryFile: row.entry_file || undefined,
    projectSize: row.project_size || 0,
    archived: row.archived === 1,
    archivedAt: row.archived_at || undefined
  };
};

const router = Router();

// Helper to get user from auth header
const getUserFromAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
    return user;
  } catch {
    return null;
  }
};

// GET /users - Get all users (general admin and site sub admin)
router.get('/', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || !['general_admin', 'site_sub_admin'].includes(currentUser.role)) {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    const users = await getAllRows(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, bio, 
             contribution_points, points, community_points, favorites, avatar_border, avatar_accessory, avatar_effect,
             username_color, username_effect, profile_theme, profile_background, custom_title,
             unlocked_achievements, owned_items
      FROM users 
      ORDER BY created_at DESC
    `);
    const mappedUsers = users.map(mapUserRow);
    res.json({ code: 200, message: 'Success', data: mappedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/public - Get public user list (all users, no auth required)
router.get('/public', async (req, res) => {
  try {
    const users = await getAllRows(`
      SELECT id, username, role, created_at, contact_info, bio, is_banned, ban_reason,
             contribution_points, points, community_points, favorites, avatar_border, avatar_accessory, avatar_effect,
             username_color, username_effect, profile_theme, profile_background, custom_title,
             unlocked_achievements, owned_items
      FROM users 
      WHERE is_banned = 0
      ORDER BY created_at DESC
    `);
    const mappedUsers = users.map(mapUserRow);
    res.json({ code: 200, message: 'Success', data: mappedUsers });
  } catch (error) {
    console.error('Get public users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/community/:communityId - Get users in a community (community admin or general admin)
router.get('/community/:communityId', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { communityId } = req.params;

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check if user is general admin or community creator
    if (currentUser.role !== 'general_admin' && community.creator_id !== currentUser.id) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    const members = await getAllRows(`
      SELECT u.id, u.username, u.role, u.created_at, u.is_banned, u.ban_reason, u.contact_info, u.bio,
             cm.status as membership_status
      FROM users u
      INNER JOIN community_members cm ON u.id = cm.user_id
      WHERE cm.community_id = ?
      ORDER BY u.created_at DESC
    `, [communityId]);

    const mappedMembers = members.map(member => ({
      ...mapUserRow(member),
      membershipStatus: member.membership_status
    }));

    res.json({ code: 200, message: 'Success', data: mappedMembers });
  } catch (error) {
    console.error('Get community users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id - Get a specific user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await getRow(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr, bio,
             contribution_points, points, community_points, favorites, avatar_border, avatar_accessory, avatar_effect,
             username_color, username_effect, profile_theme, profile_background, custom_title,
             unlocked_achievements, owned_items
      FROM users 
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    res.json({ code: 200, message: 'Success', data: mapUserRow(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id/ban - Ban a user (general admin only)
router.put('/:id/ban', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (id === currentUser.id) {
    return res.status(400).json({ code: 400, message: 'Cannot ban yourself', data: null });
  }

  try {
    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    if (user.role === 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Cannot ban another admin', data: null });
    }

    await runQuery('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?', [reason || null, id]);
    res.json({ code: 200, message: 'User banned successfully', data: null });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id/unban - Unban a user (general admin only)
router.put('/:id/unban', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  const { id } = req.params;

  try {
    await runQuery('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?', [id]);
    res.json({ code: 200, message: 'User unbanned successfully', data: null });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});
// PATCH /users/:id/role - Toggle general admin role (admin only, but only original admin can modify other admins)
router.patch('/:id/role', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || !['general_admin', 'site_sub_admin'].includes(currentUser.role)) {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  const { id } = req.params;
  const { role } = req.body;

  // Only original admin (username: admin) can modify roles
  if (currentUser.username !== 'admin') {
    return res.status(403).json({ code: 403, message: 'Only the original admin can modify user roles', data: null });
  }

  if (id === currentUser.id && role !== 'general_admin') {
    return res.status(400).json({ code: 400, message: 'Cannot demote yourself', data: null });
  }

  if (!['user', 'general_admin', 'site_sub_admin'].includes(role)) {
    return res.status(400).json({ code: 400, message: 'Invalid role', data: null });
  }

  try {
    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    await runQuery('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const roleName = role === 'general_admin' ? '总管理员' : role === 'site_sub_admin' ? '分管理员' : '普通用户';
    res.json({ code: 200, message: `用户权限已更新为 ${roleName}`, data: null });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id - Update user profile
router.put('/:id', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { id } = req.params;
  const {
    username, password, contactInfo, paymentQr, bio,
    contributionPoints, points, communityPoints, favorites,
    avatarBorder, avatarAccessory, avatarEffect,
    usernameColor, usernameEffect, profileTheme, profileBackground,
    customTitle, unlockedAchievements, ownedItems
  } = req.body;

  if (id !== currentUser.id && currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    let updates = [];
    let params = [];

    if (username) {
      const existing = await getRow('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existing) {
        return res.status(400).json({ code: 400, message: 'Username already exists', data: null });
      }
      updates.push('username = ?');
      params.push(username);
    }

    if (password) {
      updates.push('password = ?');
      params.push(password);
    }

    if (contactInfo !== undefined) {
      updates.push('contact_info = ?');
      params.push(contactInfo || null);
    }

    if (paymentQr !== undefined) {
      updates.push('payment_qr = ?');
      params.push(paymentQr || null);
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio || null);
    }

    // Only admin can update contribution points
    if (currentUser.role === 'general_admin' && contributionPoints !== undefined) {
      updates.push('contribution_points = ?');
      params.push(contributionPoints);
    }

    // Both users and admins can update points (for shop purchases)
    if (points !== undefined) {
      updates.push('points = ?');
      params.push(points);
    }

    // Both users and admins can update community points
    if (communityPoints !== undefined) {
      updates.push('community_points = ?');
      params.push(communityPoints);
    }

    if (favorites !== undefined) {
      updates.push('favorites = ?');
      params.push(JSON.stringify(favorites));
    }

    if (avatarBorder !== undefined) {
      updates.push('avatar_border = ?');
      params.push(avatarBorder || null);
    }

    if (avatarAccessory !== undefined) {
      updates.push('avatar_accessory = ?');
      params.push(avatarAccessory || null);
    }

    if (avatarEffect !== undefined) {
      updates.push('avatar_effect = ?');
      params.push(avatarEffect || null);
    }

    if (usernameColor !== undefined) {
      updates.push('username_color = ?');
      params.push(usernameColor || null);
    }

    if (usernameEffect !== undefined) {
      updates.push('username_effect = ?');
      params.push(usernameEffect || null);
    }

    if (profileTheme !== undefined) {
      updates.push('profile_theme = ?');
      params.push(profileTheme || null);
    }

    if (profileBackground !== undefined) {
      updates.push('profile_background = ?');
      params.push(profileBackground || null);
    }

    if (customTitle !== undefined) {
      updates.push('custom_title = ?');
      params.push(customTitle || null);
    }

    if (unlockedAchievements !== undefined) {
      updates.push('unlocked_achievements = ?');
      params.push(JSON.stringify(unlockedAchievements));
    }

    if (ownedItems !== undefined) {
      updates.push('owned_items = ?');
      params.push(JSON.stringify(ownedItems));
    }

    if (updates.length > 0) {
      params.push(id);
      await runQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updatedUser = await getRow(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr, bio,
             contribution_points, points, community_points, favorites, avatar_border, avatar_accessory, avatar_effect,
             username_color, username_effect, profile_theme, profile_background, custom_title,
             unlocked_achievements, owned_items
      FROM users WHERE id = ?
    `, [id]);

    res.json({ code: 200, message: 'User updated successfully', data: mapUserRow(updatedUser) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id/stats - Get user stats (demos created, communities managed)
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the user to know their username
    const user = await getRow('SELECT id, username FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    // Count demos by creator_id if available, otherwise by author (username)
    const demosCountResult = await getRow(`
      SELECT COUNT(*) as count FROM demos 
      WHERE (creator_id = ? OR author = ?)
    `, [id, user.username]);

    const demosCount = demosCountResult.count;

    const communitiesManaged = await getAllRows('SELECT * FROM communities WHERE creator_id = ?', [id]);
    const likedDemos = await getAllRows(`
      SELECT d.* FROM demos d
      INNER JOIN demo_likes dl ON d.id = dl.demo_id
      WHERE dl.user_id = ?
    `, [id]);

    const mappedLikedDemos = likedDemos.map(mapDemoRow);

    res.json({
      code: 200,
      message: 'Success',
      data: {
        demosCount,
        communitiesCount: communitiesManaged.length,
        communitiesManaged,
        likedDemos: mappedLikedDemos
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id/demos - Get all demos by user
router.get('/:id/demos', async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the user to know their username
    const user = await getRow('SELECT id, username FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    // First, get all unique demo ids from demos table (original demos)
    const baseDemos = await getAllRows(`
      SELECT DISTINCT d.* FROM demos d 
      WHERE (d.creator_id = ? OR d.author = ?) AND d.status = 'published' AND (d.archived = 0 OR d.archived IS NULL)
      ORDER BY d.created_at DESC
    `, [id, user.username]);

    // For each demo, get all its locations
    const demosWithLocations = [];
    for (const demo of baseDemos) {
      const locations = await getAllRows(`
        SELECT dl.*, c.name as community_name 
        FROM demo_locations dl 
        LEFT JOIN communities c ON dl.community_id = c.id
        WHERE dl.demo_id = ?
      `, [demo.id]);

      const mappedDemo = mapDemoRow(demo);
      mappedDemo.locations = locations.map(loc => ({
        layer: loc.layer,
        communityId: loc.community_id || undefined,
        communityName: loc.community_name || undefined,
        categoryId: loc.category_id
      }));

      demosWithLocations.push(mappedDemo);
    }

    res.json({ code: 200, message: 'Success', data: demosWithLocations });
  } catch (error) {
    console.error('Get user demos error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
