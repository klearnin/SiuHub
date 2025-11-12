const db = require("../database");

exports.getuserlist = async (req, res, next) => {
  try {
    const user_team = req.user;
    const sql = `
      SELECT * FROM users where team_id = ${db.escape(user_team.team_id)}
    `;
    const userListRaw = await db.startQuery(sql);
    const userList = userListRaw.map(user => {
    const { id, ...rest } = user;
    return { uid: id, ...rest };
    });
    const detailedList = [];
    for (const user of userList) {
      delete user.password;
      const detail = { ...user };
      if (user.type=='player'){
        const [player] = await db.startQuery(`
          SELECT * FROM players where user_id = ${db.escape(user.uid)}
        `);
        if (player) {
          Object.assign(detail, player);
        }
      }
      detailedList.push(detail);
     
    }
    res.json({ code: 0, msg: '获取成功', userlist: detailedList });
  } catch (err) {
    next(err);
  }
};


exports.updateplayer = async (req, res, next) => {
  try {
    const playerId = req.params.id;
    const user = req.user;

    // 1. 验证必填字段
    const requiredFields = ['player_number', 'height', 'weight'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === '') {
        return res.status(400).json({
          code: 1,
          msg: `字段 ${field} 不能为空`,
          field: field
        });
      }
    }

    // 2. 处理输入字段
    const playerData = {
      player_number: Number(req.body.player_number),
      height: Number(req.body.height),
      weight: Number(req.body.weight),
      dominant_foot: req.body.dominant_foot || null,
      age: req.body.age ? Number(req.body.age) : null,
      health: req.body.health || null,
      position: req.body.position || null,
      rating: req.body.rating ? Number(req.body.rating) : null,
      speed: req.body.speed ? Number(req.body.speed) : null,
      shooting: req.body.shooting ? Number(req.body.shooting) : null,
      passing: req.body.passing ? Number(req.body.passing) : null,
      dribbling: req.body.dribbling ? Number(req.body.dribbling) : null,
      defending: req.body.defending ? Number(req.body.defending) : null,
      stamina: req.body.stamina ? Number(req.body.stamina) : null,
    };

    // 3. 验证数值范围
    if (isNaN(playerData.height) || playerData.height < 100 || playerData.height > 250) {
      return res.status(400).json({ code: 1, msg: '身高必须在100-250cm之间' });
    }
    if (isNaN(playerData.weight) || playerData.weight < 30 || playerData.weight > 150) {
      return res.status(400).json({ code: 1, msg: '体重必须在30-150kg之间' });
    }
    if (playerData.rating && (playerData.rating < 1 || playerData.rating > 5)) {
      return res.status(400).json({ code: 1, msg: '评级必须为1-5之间的整数' });
    }

    // 六项能力统一验证
    const skills = ['speed','shooting','passing','dribbling','defending','stamina'];
    for (const key of skills) {
      const val = playerData[key];
      if (val !== null && (isNaN(val) || val < 1 || val > 100)) {
        return res.status(400).json({ code: 1, msg: `${key} 必须为1-100之间的整数` });
      }
    }

    // 4. 验证球员属于该团队
    const checkSql = `SELECT 1 FROM players WHERE id = ? AND team_id = ? LIMIT 1`;
    const checkResult = await db.startQuery(checkSql, [playerId, user.team_id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ code: 1, msg: '球员不存在或不属于你的团队' });
    }

    // 5. 执行更新
    const updateSql = `
      UPDATE players SET 
        player_number = ?,
        dominant_foot = ?,
        height = ?,
        weight = ?,
        age = ?,
        health = ?,
        position = ?,
        rating = ?,
        speed = ?,
        shooting = ?,
        passing = ?,
        dribbling = ?,
        defending = ?,
        stamina = ?
      WHERE id = ?
    `;
    await db.startQuery(updateSql, [
      playerData.player_number,
      playerData.dominant_foot,
      playerData.height,
      playerData.weight,
      playerData.age,
      playerData.health,
      playerData.position,
      playerData.rating,
      playerData.speed,
      playerData.shooting,
      playerData.passing,
      playerData.dribbling,
      playerData.defending,
      playerData.stamina,
      playerId
    ]);

    res.json({ code: 0, msg: '球员信息更新成功' });
  } catch (err) {
    console.error('更新球员错误:', err);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


exports.deleteuser = async (req, res,next) => {
  try {
    const userId = req.params.id;
    const user = req.user;
    // 删除 user 表的记录（外键自动删除子表）
    await db.startQuery(`DELETE FROM users WHERE id = ${db.escape(userId)} AND team_id = ${db.escape(user.team_id)}`);

    res.json({ code: 0, message: '用户删除成功' });
  } catch (err) {
    next(err);
  }
};

exports.transferCoach = async (req, res, next) => {
  try {
    const userid = req.params.id.trim(); 
    const currentUser = req.user;

    if (currentUser.type !== 'coach') {
      return res.status(403).json({ code: 1, msg: '只有教练才能转让教练身份' });
    }

    // 查询目标用户，限制同队
    const [targetUser] = await db.startQuery(
      `SELECT * FROM users WHERE id = ? AND team_id = ?`,
      [userid, currentUser.team_id]
    );

    if (!targetUser) {
      return res.status(404).json({ code: 1, msg: '目标用户不存在或不属于该团队' });
    }

    // 获取当前教练头像
    const [currentCoachData] = await db.startQuery(
      `SELECT avatar FROM users WHERE id = ?`,
      [currentUser.id]
    );
    const currentCoachAvatar = currentCoachData?.avatar || null;

    // 如果目标用户是球员，则先从 players 表中移除
    if (targetUser.type === 'player') {
      await db.startQuery(`DELETE FROM players WHERE user_id = ?`, [targetUser.id]);
    }

    // 更新目标用户为新教练，同时继承旧教练头像
    await db.startQuery(
      `UPDATE users SET type = 'coach', avatar = ? WHERE id = ?`,
      [currentCoachAvatar, targetUser.id]
    );

    // 原教练变为球迷
    await db.startQuery(
      `UPDATE users SET type = 'fan' WHERE id = ?`,
      [currentUser.id]
    );

    res.json({ code: 0, msg: '教练身份转让成功' });
  } catch (err) {
    console.error('转让教练错误:', err);
    next(err);
  }
};

// 获取当前登录球员的统计数据
exports.getPlayerStats = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 验证用户类型
    if (currentUser.type !== 'player') {
      return res.status(403).json({ code: 1, msg: '只有球员可以查看个人统计数据' });
    }

    // 获取球员基本信息
    const [player] = await db.startQuery(
      `SELECT * FROM players WHERE user_id = ?`,
      [currentUser.id]
    );

    if (!player) {
      return res.status(404).json({ code: 1, msg: '未找到该球员信息' });
    }

    // 获取球员比赛统计数据
    // 出场次数：统计该球员参与的比赛数量
    const [appearancesResult] = await db.startQuery(`
      SELECT COUNT(DISTINCT m.id) as appearances
      FROM match_event_log e
      JOIN match_schedule m ON e.match_id = m.id
      JOIN schedule s ON m.schedule_id = s.id
      LEFT JOIN match_goals g ON g.event_id = e.id AND (g.scorer_id = ? OR g.assist_id = ?)
      LEFT JOIN match_substitutions sub ON sub.event_id = e.id AND (sub.sub_in_id = ? OR sub.sub_out_id = ?)
      LEFT JOIN match_cards c ON c.event_id = e.id AND c.player_id = ?
      LEFT JOIN match_penalties p ON p.event_id = e.id AND p.player_id = ?
      WHERE s.team_id = ? 
        AND (e.event_type = 'goal' OR e.event_type = 'substitution' OR e.event_type = 'card' OR e.event_type = 'penalty')
        AND (g.event_id IS NOT NULL OR sub.event_id IS NOT NULL OR c.event_id IS NOT NULL OR p.event_id IS NOT NULL)
    `, [currentUser.id, currentUser.id, currentUser.id, currentUser.id, currentUser.id, currentUser.id, currentUser.team_id]);

    // 进球数：统计该球员的进球
    const [goalsResult] = await db.startQuery(`
      SELECT COUNT(*) as goals
      FROM match_goals g
      JOIN match_event_log e ON g.event_id = e.id
      WHERE g.scorer_id = ?
    `, [currentUser.id]);

    // 助攻数：统计该球员的助攻
    const [assistsResult] = await db.startQuery(`
      SELECT COUNT(*) as assists
      FROM match_goals g
      JOIN match_event_log e ON g.event_id = e.id
      WHERE g.assist_id = ?
    `, [currentUser.id]);

    // 构建返回数据
    const stats = {
      // 基本信息
      height: player.height || 0,
      weight: player.weight || 0,
      age: player.age || 0,
      dominant_foot: player.dominant_foot || '右脚',
      position: player.position || '守门员',
      
      // 比赛数据
      appearances: appearancesResult?.appearances || 0,
      goals: goalsResult?.goals || 0,
      assists: assistsResult?.assists || 0,
      rating: player.rating || 0,
      
      // 技术统计
      speed: player.speed || 0,
      shooting: player.shooting || 0,
      passing: player.passing || 0,
      dribbling: player.dribbling || 0,
      defending: player.defending || 0,
      stamina: player.stamina || 0
    };

    res.json({ code: 0, msg: '获取球员统计数据成功', stats });
  } catch (err) {
    console.error('获取球员统计数据错误:', err);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
};

