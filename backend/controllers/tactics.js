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