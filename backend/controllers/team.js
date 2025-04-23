const db = require("../database");

exports.getMyTeamLogo = async (req, res, next) => {
  try {
    const teamId = req.user.team_id;

    if (!teamId) {
      return res.status(400).json({ message: "该用户尚未绑定球队" });
    }

    const sql = `SELECT logo_path FROM teams WHERE id = ${db.escape(teamId)} LIMIT 1`;
    const result = await db.startQuery(sql);

    if (!result[0]) {
      return res.status(404).json({ message: "未找到该用户所属球队" });
    }

    res.status(200).json({
      logo: result[0].logo_path
    });
  } catch (err) {
    next(err);
  }
};