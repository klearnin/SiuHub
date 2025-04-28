const db = require("../database");

exports.createNotice = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.type !== "coach") {
      return res.status(403).json({ message: "只有教练可以发布公告" });
    }

    const { title, content, publish_time, type } = req.body;

    const sql = `
      INSERT INTO notices (title, content, publish_time, type, team_id)
      VALUES (
        ${db.escape(title)},
        ${db.escape(content)},
        ${db.escape(publish_time)},
        ${db.escape(type)},
        ${db.escape(user.team_id)}
      )
    `;

    const result = await db.startQuery(sql);
    res.json({ code: 0, msg: '创建成功', data: result });
  } catch (err) {
    next(err);
  }
};

exports.getNotices = async (req, res, next) => {
  try {
    const user = req.user;
    const { page = 1, size = 6, type } = req.query;  // 增加 type
    const offset = (page - 1) * size;

    // 构建基础 where 条件
    let whereClause = `WHERE team_id = ${db.escape(user.team_id)}`;

    // 如果有type参数，则加上类型过滤
    if (type) {
      whereClause += ` AND type = ${db.escape(type)}`;
    }

    // 查询SQL
    const sqlNotices = `
      SELECT * FROM notices
      ${whereClause}
      ORDER BY publish_time DESC
      LIMIT ${parseInt(size)} OFFSET ${parseInt(offset)}
    `;
    const sqlCount = `
      SELECT COUNT(*) AS total FROM notices
      ${whereClause}
    `;

    // 并发执行查询
    const [notices, countResult] = await Promise.all([
      db.startQuery(sqlNotices),
      db.startQuery(sqlCount)
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      code: 0,
      msg: '查询成功',
      data: { notices, total }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotice = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.type !== "coach") {
      return res.status(403).json({ message: "只有教练可以删除公告" });
    }

    const { id } = req.params;

    // 确保只能删除自己球队的公告（安全防止跨球队乱删）
    const sqlCheck = `
      SELECT * FROM notices
      WHERE id = ${db.escape(id)} AND team_id = ${db.escape(user.team_id)}
      LIMIT 1
    `;

    const checkResult = await db.startQuery(sqlCheck);

    if (checkResult.length === 0) {
      return res.status(403).json({ message: "无权删除该公告或公告不存在" });
    }

    const sqlDelete = `DELETE FROM notices WHERE id = ${db.escape(id)}`;
    const result = await db.startQuery(sqlDelete);

    res.send({ code: 0, msg: '删除成功', data: result });
  } catch (err) {
    next(err);
  }
};
