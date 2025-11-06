const db = require('../database');

// 添加球队荣誉
exports.addTeamHonor = async (req, res, next) => {
    try {
      const { title, description, honor_date } = req.body;
      const user = req.user;
  
      if (!user.team_id || !title || !honor_date) {
        return res.status(400).json({ msg: "缺少必要信息" });
      }
      
      const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (honor_date > today) {
        return res.status(400).json({ msg: "荣誉日期不能是未来时间" });
      }
      await db.startQuery(`
        INSERT INTO team_honors (team_id, title, description, honor_date)
        VALUES (?, ?, ?, ?)`,
        [user.team_id, title, description || null, honor_date]
      );
  
      res.json({ code: 0, msg: "球队荣誉添加成功" });
    } catch (err) {
      next(err);
    }
};
  
// 获取本队所有球员（用于录入荣誉信息下拉）
exports.getPlayersByManager = async (req, res, next) => {
    try {
      const manager = req.user;
  
      // 校验用户类型
      if (manager.type !== 'manager') {
        return res.status(403).json({ code: 1, msg: "只有经理可查看球员列表" });
      }
  
      const team_id = manager.team_id;
      if (!team_id) {
        return res.status(400).json({ code: 1, msg: "当前经理未绑定球队" });
      }
  
      // 查询该球队的所有已通过审核的球员
      const players = await db.startQuery(
        `SELECT id, name, avatar FROM users WHERE team_id = ? AND type = 'player' AND status = 'approved'`,
        [team_id]
      );
  
      res.json({ code: 0, msg: "球员获取成功", data: players });
    } catch (err) {
      next(err);
    }
};

// 添加个人荣誉
exports.addPersonalHonor = async (req, res, next) => {
  try {
    const { title, description, honor_date, user_id } = req.body;

    if (!user_id || !title || !honor_date) {
      return res.status(400).json({ msg: "缺少必要信息" });
    }

    const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
    if (honor_date > today) {
      return res.status(400).json({ msg: "荣誉日期不能是未来时间" });
    }

    await db.startQuery(`
      INSERT INTO personal_honors (user_id, title, description, honor_date)
      VALUES (?, ?, ?, ?)`,
      [user_id, title, description || null, honor_date]
    );

    res.json({ code: 0, msg: "个人荣誉添加成功" });
  } catch (err) {
    next(err);
  }
};

// 删除荣誉（通用，指定表与ID）
exports.deleteHonor = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    let table;
    if (type === 'team') table = 'team_honors';
    else if (type === 'personal') table = 'personal_honors';
    else return res.status(400).json({ msg: "类型错误" });

    await db.startQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);

    res.json({ code: 0, msg: "荣誉删除成功" });
  } catch (err) {
    next(err);
  }
};

// 获取球队荣誉
exports.getTeamHonors = async (req, res, next) => {
    try {
      const { team_id } = req.user;
  
      if (!team_id) {
        return res.status(400).json({ msg: "当前用户无绑定球队" });
      }
  
      const result = await db.startQuery(
        `SELECT * FROM team_honors WHERE team_id = ? ORDER BY honor_date DESC`,
        [team_id]
      );
  
      res.json({ code: 0, data: result });
    } catch (err) {
      next(err);
    }
};

// 获取某球员所有个人荣誉
exports.getPersonalHonors = async (req, res, next) => {
  try {
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ msg: "缺少用户ID" });

    const result = await db.startQuery(
      `SELECT * FROM personal_honors WHERE user_id = ? ORDER BY honor_date DESC`,
      [user_id]
    );

    res.json({ code: 0, data: result });
  } catch (err) {
    next(err);
  }
};

// 更新球队荣誉
exports.updateTeamHonor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, honor_date } = req.body;
      const user = req.user;
      
      const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (honor_date > today) {
        return res.status(400).json({ msg: "荣誉日期不能是未来时间" });
      }

      const result = await db.startQuery(
        `UPDATE team_honors
         SET title = ?, description = ?, honor_date = ?
         WHERE id = ? AND team_id = ?`,
        [title, description, honor_date, id, user.team_id]
      );
  
      res.json({ code: 0, msg: "球队荣誉更新成功" });
    } catch (err) {
      next(err);
    }
};

// 更新个人荣誉
exports.updatePersonalHonor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, honor_date, user_id } = req.body;
  
      if (!user_id) {
        return res.status(400).json({ code: 1, msg: "缺少 user_id 参数" });
      }
      
      const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (honor_date > today) {
        return res.status(400).json({ msg: "荣誉日期不能是未来时间" });
      }
      
      const result = await db.startQuery(
        `UPDATE personal_honors
         SET title = ?, description = ?, honor_date = ?
         WHERE id = ? AND user_id = ?`,
        [title, description, honor_date, id, user_id]
      );
  
      res.json({ code: 0, msg: "个人荣誉更新成功" });
    } catch (err) {
      next(err);
    }
};

// 获取本队所有球员的荣誉总览
exports.getTeamPersonalHonors = async (req, res, next) => {
    try {
      const { team_id } = req.user;
  
      const result = await db.startQuery(`
        SELECT ph.id AS id, u.id AS user_id, u.name AS user_name, ph.title, ph.description, ph.honor_date
        FROM personal_honors ph
        JOIN users u ON ph.user_id = u.id
        WHERE u.team_id = ?
        ORDER BY ph.honor_date DESC
      `, [team_id]);
  
      res.json({ code: 0, msg: "球队成员荣誉获取成功", data: result });
    } catch (err) {
      next(err);
    }
};
