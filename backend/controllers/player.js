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
    console.log('API 返回数据:', { userlist: detailedList });
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