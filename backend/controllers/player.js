const db = require("../database");

exports.getplayerlist = async (req, res, next) => {
  try {
    const user = req.user;
    const sql = `
      SELECT * FROM players where team_id = ${db.escape(user.team_id)}
    `;
    const result = await db.startQuery(sql);
   
    res.json({ code: 0, msg: '获取成功', playerlist: result });
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

