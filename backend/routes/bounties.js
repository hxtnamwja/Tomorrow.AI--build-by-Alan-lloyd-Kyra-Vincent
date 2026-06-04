import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

const mapBountyRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    reward: row.reward,
    rewardPoints: row.reward_points,
    layer: row.layer,
    communityId: row.community_id || undefined,
    status: row.status,
    creator: row.creator,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    acceptedSolutionId: row.accepted_solution_id || undefined,
    acceptedUserId: row.accepted_user_id || undefined,
    publishLayer: row.publish_layer || undefined,
    publishCommunityId: row.publish_community_id || undefined,
    publishCategoryId: row.publish_category_id || undefined,
    programTitle: row.program_title || undefined,
    programDescription: row.program_description || undefined,
    programTags: row.program_tags ? JSON.parse(row.program_tags) : undefined
  };
};

const mapSolutionRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    bountyId: row.bounty_id,
    demoId: row.demo_id,
    userId: row.user_id,
    username: row.username,
    submittedAt: row.submitted_at,
    status: row.status,
    rejectionReason: row.rejection_reason || undefined,
    reviewedAt: row.reviewed_at || undefined
  };
};

const requireUser = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
    return null;
  }
  return user;
};

const isCommunityMember = async (communityId, userId) => {
  const member = await getRow(
    'SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
    [communityId, userId, 'member']
  );
  return !!member;
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

router.get('/', async (req, res) => {
  const { layer, communityId, status, creatorId } = req.query;
  
  try {
    if (layer === 'community' && !communityId) {
      return res.status(400).json({ code: 400, message: 'communityId is required for community layer', data: null });
    }
    
    const currentUser = await getCurrentUser(req);
    
    let query = 'SELECT * FROM bounties WHERE 1=1';
    const params = [];
    
    if (layer) {
      query += ' AND layer = ?';
      params.push(layer);
    }
    
    if (communityId) {
      query += ' AND community_id = ?';
      params.push(communityId);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (creatorId) {
      query += ' AND creator_id = ?';
      params.push(creatorId);
    }
    
    if (currentUser) {
      const userSolutions = await getAllRows(
        'SELECT DISTINCT bounty_id FROM bounty_solutions WHERE user_id = ?',
        [currentUser.id]
      );
      const userBountyIds = userSolutions.map(s => s.bounty_id);
      
      if (userBountyIds.length > 0) {
        const placeholders = userBountyIds.map(() => '?').join(',');
        query += ` AND (status != ? OR creator_id = ? OR id IN (${placeholders}))`;
        params.push('closed', currentUser.id, ...userBountyIds);
      } else {
        query += ' AND (status != ? OR creator_id = ?)';
        params.push('closed', currentUser.id);
      }
    } else {
      query += ' AND status != ?';
      params.push('closed');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const bounties = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: bounties.map(mapBountyRow) });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.id]);
    
    if (!bounty) {
      return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
    }
    
    const currentUser = await getCurrentUser(req);
    
    if (bounty.status === 'closed') {
      if (currentUser) {
        const userHasSolution = await getRow(
          'SELECT id FROM bounty_solutions WHERE bounty_id = ? AND user_id = ?',
          [req.params.id, currentUser.id]
        );
        
        if (bounty.creator_id !== currentUser.id && !userHasSolution) {
          return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
        }
      } else {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
    
    const solutions = await getAllRows('SELECT * FROM bounty_solutions WHERE bounty_id = ?', [req.params.id]);
    
    res.json({ 
      code: 200, 
      message: 'Success', 
      data: {
        ...mapBountyRow(bounty),
        solutions: solutions.map(mapSolutionRow)
      } 
    });
  } catch (error) {
    console.error('Error fetching bounty:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/', async (req, res) => {
  const { 
    title, 
    description, 
    reward, 
    rewardPoints, 
    layer, 
    communityId,
    publishLayer,
    publishCommunityId,
    publishCategoryId,
    programTitle,
    programDescription,
    programTags
  } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }

  const normalizedRewardPoints = Number.parseInt(rewardPoints, 10);
  if (!Number.isSafeInteger(normalizedRewardPoints) || normalizedRewardPoints <= 0) {
    return res.status(400).json({ code: 400, message: 'Reward points must be a positive integer', data: null });
  }

  if ((user.points || 0) < normalizedRewardPoints) {
    return res.status(400).json({ code: 400, message: 'Insufficient points', data: null });
  }
  
  const id = 'bounty-' + Date.now();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO bounties (
        id, title, description, reward, reward_points, layer, community_id, 
        status, creator, creator_id, created_at, publish_layer, 
        publish_community_id, publish_category_id, program_title, 
        program_description, program_tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title, description, reward, normalizedRewardPoints, layer, communityId || null,
      'open', user.username, user.id, now, publishLayer, 
      publishCommunityId || null, publishCategoryId,
      programTitle || null, programDescription || null,
      programTags ? JSON.stringify(programTags) : null
    ]);
    
    const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapBountyRow(bounty) });
  } catch (error) {
    console.error('Error creating bounty:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/:id/solutions', async (req, res) => {
  console.log('=== POST /bounties/:id/solutions ===');
  console.log('req.params.id:', req.params.id);
  console.log('req.body:', req.body);
  
  const { demoId } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    console.log('User not authenticated');
    return;
  }
  
  console.log('User:', user);
  
  const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.id]);
  if (!bounty) {
    console.log('Bounty not found');
    return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
  }
  
  console.log('Bounty:', bounty);
  
  if (bounty.status !== 'open') {
    console.log('Bounty is not open, status:', bounty.status);
    return res.status(400).json({ code: 400, message: 'Bounty is not open', data: null });
  }
  
  const id = 'solution-' + Date.now();
  const now = Date.now();
  
  try {
    console.log('Inserting solution into database...');
    await runQuery(`
      INSERT INTO bounty_solutions (id, bounty_id, demo_id, user_id, username, submitted_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, req.params.id, demoId, user.id, user.username, now, 'pending']);
    
    console.log('Solution inserted, id:', id);
    
    const solution = await getRow('SELECT * FROM bounty_solutions WHERE id = ?', [id]);
    console.log('Solution retrieved:', solution);
    res.json({ code: 200, message: 'Success', data: mapSolutionRow(solution) });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.patch('/:bountyId/solutions/:solutionId', async (req, res) => {
  const { action, rejectionReason } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.bountyId]);
  if (!bounty) {
    return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
  }
  
  if (bounty.creator_id !== user.id) {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }
  
  const solution = await getRow(
    'SELECT * FROM bounty_solutions WHERE id = ? AND bounty_id = ?',
    [req.params.solutionId, req.params.bountyId]
  );
  if (!solution) {
    return res.status(404).json({ code: 404, message: 'Solution not found', data: null });
  }
  
  const now = Date.now();
  
  try {
    await runQuery('BEGIN TRANSACTION');
    
    if (action === 'accept') {
      if (bounty.status === 'closed' || solution.status !== 'pending') {
        await runQuery('ROLLBACK');
        return res.status(409).json({ code: 409, message: 'This bounty solution has already been reviewed', data: null });
      }

      const creator = await getRow('SELECT * FROM users WHERE id = ?', [bounty.creator_id]);
      
      if (!creator || creator.points < bounty.reward_points) {
        await runQuery('ROLLBACK');
        return res.status(400).json({ code: 400, message: 'Creator has insufficient points', data: null });
      }
      
      const debit = await runQuery(
        'UPDATE users SET points = points - ? WHERE id = ? AND points >= ?',
        [bounty.reward_points, bounty.creator_id, bounty.reward_points]
      );
      if (debit.changes !== 1) {
        await runQuery('ROLLBACK');
        return res.status(400).json({ code: 400, message: 'Creator has insufficient points', data: null });
      }
      await runQuery('UPDATE users SET points = points + ? WHERE id = ?', [bounty.reward_points, solution.user_id]);
      
      await runQuery(`
        UPDATE bounty_solutions 
        SET status = ?, reviewed_at = ? 
        WHERE id = ?
      `, ['accepted', now, req.params.solutionId]);
      
      await runQuery(`
        UPDATE bounties 
        SET status = ?, accepted_solution_id = ?, accepted_user_id = ? 
        WHERE id = ?
      `, ['closed', req.params.solutionId, solution.user_id, req.params.bountyId]);
      
      if (bounty.publish_layer) {
        let demoUpdateQuery = 'UPDATE demos SET layer = ?, community_id = ?, category_id = ?, status = ?, bounty_id = NULL';
        const demoUpdateParams = [
          bounty.publish_layer, 
          bounty.publish_community_id || null, 
          bounty.publish_category_id, 
          'pending'
        ];
        
        if (bounty.program_title) {
          demoUpdateQuery += ', title = ?';
          demoUpdateParams.push(bounty.program_title);
        }
        
        if (bounty.program_description) {
          demoUpdateQuery += ', description = ?';
          demoUpdateParams.push(bounty.program_description);
        }
        
        if (bounty.program_tags) {
          demoUpdateQuery += ', tags = ?';
          demoUpdateParams.push(bounty.program_tags);
        }
        
        demoUpdateQuery += ' WHERE id = ?';
        demoUpdateParams.push(solution.demo_id);
        
        await runQuery(demoUpdateQuery, demoUpdateParams);
      }
    } else if (action === 'reject') {
      await runQuery(`
        UPDATE bounty_solutions 
        SET status = ?, rejection_reason = ?, reviewed_at = ? 
        WHERE id = ?
      `, ['rejected', rejectionReason || null, now, req.params.solutionId]);
      
      const pendingSolutions = await getAllRows(
        'SELECT id FROM bounty_solutions WHERE bounty_id = ? AND status = ?',
        [req.params.bountyId, 'pending']
      );
      
      if (pendingSolutions.length === 0) {
        await runQuery('UPDATE bounties SET status = ? WHERE id = ?', ['open', req.params.bountyId]);
      }
    }
    
    await runQuery('COMMIT');
    
    const updatedBounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.bountyId]);
    res.json({ code: 200, message: 'Success', data: mapBountyRow(updatedBounty) });
  } catch (error) {
    await runQuery('ROLLBACK');
    console.error('Error reviewing solution:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.delete('/:id', async (req, res) => {
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.id]);
  if (!bounty) {
    return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
  }
  
  if (bounty.creator_id !== user.id && user.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }
  
  try {
    await runQuery('BEGIN TRANSACTION');
    
    await runQuery('DELETE FROM bounty_solutions WHERE bounty_id = ?', [req.params.id]);
    await runQuery('DELETE FROM bounties WHERE id = ?', [req.params.id]);
    
    await runQuery('COMMIT');
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    await runQuery('ROLLBACK');
    console.error('Error deleting bounty:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
