import { Router } from 'express';
import { runQuery, getRow, ensurePersonalCommunityForUser } from '../database.js';

const router = Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    let user = await getRow('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found. Please register.', data: null });
    }
    
    // Verify password (in real app, use bcrypt)
    const storedPassword = user.password || '123456';
    if (password !== storedPassword) {
      return res.status(401).json({ code: 401, message: 'Invalid password', data: null });
    }
    
    const token = Buffer.from(JSON.stringify({ userId: user.id, role: user.role })).toString('base64');
    await ensurePersonalCommunityForUser(user);
    
    res.json({
      code: 200,
      message: 'Success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isBanned: user.is_banned,
          banReason: user.ban_reason,
          contactInfo: user.contact_info,
          paymentQr: user.payment_qr,
          bio: user.bio,
          contributionPoints: user.contribution_points || 0,
          points: user.points || 0,
          communityPoints: user.community_points || 0
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin') {
      return res.status(400).json({ code: 400, message: 'Cannot register as admin', data: null });
  }

  try {
    const existing = await getRow('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) {
        return res.status(400).json({ code: 400, message: 'Username already exists', data: null });
    }

    const id = 'user-' + Date.now();
    await runQuery('INSERT INTO users (id, username, role, created_at, password, is_banned, community_points, points, contribution_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, username, 'user', Date.now(), password, 0, 100, 0, 0]);
    
    const user = { id, username, role: 'user', isBanned: 0, communityPoints: 100, points: 0, contributionPoints: 0 };
    await ensurePersonalCommunityForUser(user);
    const token = Buffer.from(JSON.stringify({ userId: user.id, role: user.role })).toString('base64');

    res.json({
        code: 200,
        message: 'Registered successfully',
        data: { token, user }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }
    
    res.json({ 
      code: 200, 
      message: 'Success', 
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isBanned: user.is_banned,
        contactInfo: user.contact_info,
        paymentQr: user.payment_qr,
        bio: user.bio,
        contributionPoints: user.contribution_points || 0,
        points: user.points || 0,
        communityPoints: user.community_points || 0
      }
    });
  } catch (error) {
    res.status(401).json({ code: 401, message: 'Invalid token', data: null });
  }
});

export default router;
