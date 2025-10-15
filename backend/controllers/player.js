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
          field: field  // 告诉前端具体哪个字段有问题
        });
      }
    }

    // 2. 类型转换和验证
    const playerData = {
      player_number: Number(req.body.player_number),
      height: Number(req.body.height),
      weight: Number(req.body.weight),
      dominant_foot: req.body.dominant_foot || null,
      age: req.body.age ? Number(req.body.age) : null,
      health: req.body.health||null
    };

    // 3. 验证数值范围
    if (isNaN(playerData.height) || playerData.height < 100 || playerData.height > 250) {
      return res.status(400).json({ code: 1, msg: '身高必须在100-250cm之间' });
    }

    // 4. 使用参数化查询（防止SQL注入）
    const checkSql = `
      SELECT 1 FROM players 
      WHERE id = ? AND team_id = ?
      LIMIT 1
    `;
    const checkResult = await db.startQuery(checkSql, [playerId, user.team_id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ code: 1, msg: '球员不存在或不属于你的团队' });
    }

    // 5. 参数化更新
    const updateSql = `
      UPDATE players SET 
        player_number = ?,
        dominant_foot = ?,
        height = ?,
        weight = ?,
        age = ?,
        health = ?
      WHERE id = ?
    `;
    await db.startQuery(updateSql, [
      playerData.player_number,
      playerData.dominant_foot,
      playerData.height,
      playerData.weight,
      playerData.age,
      playerData.health,
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
    const userid  = req.params.id; // 前端传来的目标用户 ID
    const currentUser = req.user; // 当前登录教练

    console.log('接收到的用户ID:', userid);
    console.log('当前用户team_id:', currentUser.team_id);
    console.log('当前用户ID:', currentUser.id);
    console.log('当前用户类型:', currentUser.type);

    // 检查当前用户是否为教练
    if (currentUser.type !== 'coach') {
      return res.status(403).json({ code: 1, msg: '只有教练才能转让教练身份' });
    }
    console.log(userid,currentUser.team_id);

     // 先单独查询目标用户，不限制team_id
     const targetUserWithoutTeam = await db.startQuery(
      `SELECT * FROM users WHERE id = ?`,
      [userid]
    );

    

    console.log('不限制team_id的查询结果:', targetUserWithoutTeam);

    if (!targetUserWithoutTeam) {
      return res.status(404).json({ code: 1, msg: '目标用户不存在' });
    }

    console.log('目标用户的team_id:', targetUserWithoutTeam.team_id);
    console.log('当前用户的team_id:', currentUser.team_id);
    console.log('team_id是否相等:', targetUserWithoutTeam.team_id === currentUser.team_id);

    // 查询目标用户信息
    const [targetUser] = await db.startQuery(
      `SELECT * FROM users WHERE id = ? AND team_id = ?`,
      [userid, currentUser.team_id]
    );

    console.log('带team_id限制的查询结果:', targetUser);
    if (!targetUser) {
      return res.status(404).json({ code: 1, msg: '目标用户不存在或不属于该团队' });
    }

    // 如果目标用户是球员，需要删除其 players 表记录
    if (targetUser.type === 'player') {
      await db.startQuery(
        `DELETE FROM players WHERE user_id = ?`,
        [targetUser.id]
      );
    }

    // 更新目标用户身份为 coach
    await db.startQuery(
      `UPDATE users SET type = 'coach' WHERE id = ?`,
      [targetUser.id]
    );

    // 将当前教练身份改为 fan
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
