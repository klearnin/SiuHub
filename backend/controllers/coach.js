const db = require("../database");
const { nanoid } = import("nanoid");

exports.getMyInviteCode = async (req, res, next) => {
    try {
      const user = req.user;
  
      // 判断身份
      if (user.type !== "coach") {
        return res.status(403).json({ message: "只有教练可以查看邀请码" });
      }
  
      const sql = `
        SELECT invite_code FROM teams
        WHERE creator_id = ${db.escape(user.id)}
        LIMIT 1
      `;
  
      const result = await db.startQuery(sql);
  
      if (!result[0]) {
        return res.status(404).json({ message: "未找到球队信息" });
      }
  
      res.status(200).json({
        inviteCode: result[0].invite_code,
      });
    } catch (err) {
      next(err);
    }
  };

exports.updateMyInviteCode = async (req, res, next) => {
  try {
    const user = req.user;

    // 只有教练才能更新
    if (user.type !== "coach") {
      return res.status(403).json({ message: "只有教练可以更新邀请码" });
    }

    // 生成新的邀请码（8位）
    const newInviteCode = nanoid(8);

    // 更新数据库中该教练所属球队的邀请码
    const updateSql = `
      UPDATE teams 
      SET invite_code = ${db.escape(newInviteCode)} 
      WHERE creator_id = ${db.escape(user.id)}
    `;

    const result = await db.startQuery(updateSql);

    // 如果没有更新任何行，说明该教练没有球队
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到该教练的球队，无法更新邀请码" });
    }

    res.status(200).json({
      message: "邀请码更新成功",
      inviteCode: newInviteCode
    });

  } catch (err) {
    next(err);
  }
};
