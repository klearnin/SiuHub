const db = require("../database");

// 获取所有球员的基本信息&伤病信息
exports.getTeamPlayersWithHealth = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    const players = await db.startQuery(`
      SELECT p.id, p.player_name, p.avatar, p.health, i.injury_name
      FROM players p
      LEFT JOIN injuries i 
        ON p.id = i.player_id 
        AND DATE_ADD(i.injury_date, INTERVAL i.recovery_days DAY) > CURDATE()
      WHERE p.team_id = ?
    `, [team_id]);

    res.json({ code: 0, data: players });
  } catch (err) {
    next(err);
  }
};

// 点击后显示某个球员的基本信息
exports.getPlayerProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // player_id

    const [player] = await db.startQuery(`
      SELECT id, player_name, avatar, height, weight, health
      FROM players
      WHERE id = ?
    `, [id]);

    res.json({ code: 0, data: player });
  } catch (err) {
    next(err);
  }
};

// 录入伤病信息（注意一个人只能有一个伤病信息，有多个病，直接在伤病那里写两个即可（例如：臀部拉伤，半月板磨损），不分两个伤病记录）
exports.addInjury = async (req, res, next) => {
  try {
    const { player_id, injury_name, description, injury_date, recovery_days } = req.body;

    const [exist] = await db.startQuery(`
    SELECT id FROM injuries
    WHERE player_id = ? AND DATE_ADD(injury_date, INTERVAL recovery_days DAY) > CURDATE()
    `, [player_id]);

    if (exist) {
    return res.status(200).json({ code: 1, msg: "该球员已有进行中的伤病记录" });
    }

    await db.startQuery(`
      INSERT INTO injuries (player_id, injury_name, description, injury_date, recovery_days)
      VALUES (?, ?, ?, ?, ?)
    `, [player_id, injury_name, description, injury_date, recovery_days]);

    // 同步更新 player 状态为 injured
    await db.startQuery(`UPDATE players SET health = 'injured' WHERE id = ?`, [player_id]);

    res.json({ code: 0, msg: "伤病信息添加成功" });
  } catch (err) {
    next(err);
  }
};

// 修改伤病信息
exports.updateInjury = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { injury_name, description, recovery_days } = req.body;

    await db.startQuery(`
      UPDATE injuries
      SET injury_name = ?, description = ?, recovery_days = ?
      WHERE id = ?
    `, [injury_name, description, recovery_days, id]);

    res.json({ code: 0, msg: "伤病信息更新成功" });
  } catch (err) {
    next(err);
  }
};

// 删除伤病信息
exports.deleteInjury = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 先获取该伤病记录对应的球员 ID
    const [injury] = await db.startQuery(
      `SELECT player_id FROM injuries WHERE id = ?`,
      [id]
    );

    if (!injury) {
      return res.status(404).json({ msg: "未找到该伤病记录" });
    }

    const playerId = injury.player_id;

    // 删除伤病记录
    await db.startQuery(`DELETE FROM injuries WHERE id = ?`, [id]);

    // 检查该球员是否还有其他伤病
    const [otherInjuries] = await db.startQuery(
      `SELECT COUNT(*) AS count FROM injuries WHERE player_id = ?`,
      [playerId]
    );

    if (otherInjuries.count === 0) {
      // 没有其他伤病，更新为健康
      await db.startQuery(
        `UPDATE players SET health = 'healthy' WHERE id = ?`,
        [playerId]
      );
    }

    res.json({ code: 0, msg: "伤病记录删除成功" });
  } catch (err) {
    next(err);
  }
};

// 查看某球员的过往伤病史
exports.getPlayerInjuries = async (req, res, next) => {
  try {
    const { player_id } = req.params;

    const result = await db.startQuery(`
      SELECT id, injury_name, description, injury_date, recovery_days
      FROM injuries
      WHERE player_id = ?
      ORDER BY injury_date DESC
    `, [player_id]);

    res.json({ code: 0, data: result });
  } catch (err) {
    next(err);
  }
};


// 自动更新健康状态
exports.autoUpdateHealthStatus = async () => {
  await db.startQuery(`
    UPDATE players p
    SET p.health = 'healthy'
    WHERE p.health = 'injured'
      AND NOT EXISTS (
        SELECT 1 FROM injuries i
        WHERE i.player_id = p.id
          AND DATE_ADD(i.injury_date, INTERVAL i.recovery_days DAY) > CURDATE()
      )
  `);
};
