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
        const [player] = await startQuery(`
          SELECT * FROM players where user_id = ${db.escape(user.id)}
        `);
        if (player) {
          Object.assign(detail, training);
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
    const { player_number, dominant_foot, height, weight, age } = req.body;

    const checkSql = `
          SELECT * FROM players 
          WHERE id = ${db.escape(tacticId)} AND team_id = ${db.escape(user.team_id)}
        `;
        const checkResult = await db.startQuery(checkSql);
    
        if (checkResult.length === 0) {
          return res.status(403).json({ code: 1, msg: '无权限或球员不存在' });
        }

    const updateSql = `
          UPDATE players SET 
            player_number = ${db.escape(player_number)},
            dominant_foot = ${db.escape(dominant_foot)},
            height = ${db.escape(height)},
            weight = ${db.escape(weight)},
            age = ${db.escape(age)}
          WHERE id = ${db.escape(playerId)}
        `;
        await db.startQuery(updateSql);
   
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    next(err);
  }
};

