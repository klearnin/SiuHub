const db = require("../database");

// 获取今日比赛对阵信息
exports.getTodayMatches = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const matches = await db.startQuery(`
      SELECT 
        m.id,
        s.date AS match_date,
        m.match_time,
        m.location,
        m.team1 AS team1_name,
        m.team2 AS team2_name,
        t1.logo_path AS team1_logo,
        t2.logo_path AS team2_logo
      FROM match_schedule m
      JOIN schedule s ON m.schedule_id = s.id
      LEFT JOIN teams t1 ON m.team1 = t1.name
      LEFT JOIN teams t2 ON m.team2 = t2.name
      WHERE s.date = ?
      ORDER BY m.match_time ASC
    `, [today]);

    res.json({ code: 0, msg: "获取今日比赛成功", data: matches });
  } catch (err) {
    next(err);
  }
};



exports.addGoalEvent = async (req, res, next) => {
    try {
      const {
        match_id, period, event_minute, minute_note, team_name,
        scorer_id, scorer_name, assist_id, assist_name,
        is_penalty
      } = req.body;
  
      if (!match_id || !period || !event_minute || !team_name || !scorer_name) {
        return res.status(400).json({ msg: "缺少必要字段" });
      }
  
      const base = await db.startQuery(`
        INSERT INTO match_event_log (match_id, period, event_minute, minute_note, event_type, team_name)
        VALUES (?, ?, ?, ?, 'goal', ?)
      `, [match_id, period, event_minute, minute_note, team_name]);
  
      await db.startQuery(`
        INSERT INTO match_goals (event_id, scorer_id, scorer_name, assist_id, assist_name, is_penalty)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        base.insertId,
        scorer_id || null,
        scorer_name,
        assist_id || null, // 可以没有助攻人
        assist_name || null,
        !!is_penalty // 确保是布尔类型
      ]);
  
      res.json({ code: 0, msg: "进球事件添加成功" });
    } catch (err) {
      next(err);
    }
};
  

// 添加换人事件
exports.addSubstitutionEvent = async (req, res, next) => {
  try {
    const {
      match_id, period, event_minute, minute_note, team_name,
      sub_in_id, sub_in_name, sub_out_id, sub_out_name
    } = req.body;

    if (!match_id || !period || !event_minute || !team_name || !sub_in_name || !sub_out_name) {
      return res.status(400).json({ msg: "缺少必要字段" });
    }

    const base = await db.startQuery(`
      INSERT INTO match_event_log (match_id, period, event_minute, minute_note, event_type, team_name)
      VALUES (?, ?, ?, ?, 'substitution', ?)
    `, [match_id, period, event_minute, minute_note, team_name]);

    await db.startQuery(`
      INSERT INTO match_substitutions (event_id, sub_in_id, sub_in_name, sub_out_id, sub_out_name)
      VALUES (?, ?, ?, ?, ?)
    `, [base.insertId, sub_in_id || null, sub_in_name, sub_out_id || null, sub_out_name]);

    res.json({ code: 0, msg: "换人事件添加成功" });
  } catch (err) { next(err); }
};

// 添加红/黄牌事件
exports.addCardEvent = async (req, res, next) => {
  try {
    const {
      match_id, period, event_minute, minute_note, team_name,
      player_id, player_name, card_type
    } = req.body;

    if (!match_id || !period || !event_minute || !team_name || !player_name || !card_type) {
      return res.status(400).json({ msg: "缺少必要字段" });
    }

    const base = await db.startQuery(`
      INSERT INTO match_event_log (match_id, period, event_minute, minute_note, event_type, team_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [match_id, period, event_minute, minute_note, card_type === 'red' ? 'red_card' : 'yellow_card', team_name]);

    await db.startQuery(`
      INSERT INTO match_cards (event_id, player_id, player_name, card_type)
      VALUES (?, ?, ?, ?)
    `, [base.insertId, player_id || null, player_name, card_type]);

    res.json({ code: 0, msg: `${card_type === 'red' ? '红' : '黄'}牌添加成功` });
  } catch (err) { next(err); }
};

// 添加点球事件
exports.addPenaltyEvent = async (req, res, next) => {
  try {
    const {
      match_id, period, event_minute, minute_note, team_name,
      player_id, player_name, result
    } = req.body;

    if (!match_id || !period || !event_minute || !team_name || !player_name || !result) {
      return res.status(400).json({ msg: "缺少必要字段" });
    }

    const base = await db.startQuery(`
      INSERT INTO match_event_log (match_id, period, event_minute, minute_note, event_type, team_name)
      VALUES (?, ?, ?, ?, 'penalty', ?)
    `, [match_id, period, event_minute, minute_note, team_name]);

    await db.startQuery(`
      INSERT INTO match_penalties (event_id, player_id, player_name, result)
      VALUES (?, ?, ?, ?)
    `, [base.insertId, player_id || null, player_name, result]);

    res.json({ code: 0, msg: "点球事件添加成功" });
  } catch (err) { next(err); }
};



// 获取本队所有球员（用于比赛事件录入下拉）
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

  // 获取某场比赛全部事件（前端列表用）
exports.getMatchEvents = async (req, res, next) => {
    try {
      const { match_id } = req.query;
  
      const result = await db.startQuery(`
        SELECT e.id, e.period, e.event_minute, e.minute_note, e.event_type, e.team_name,
          g.scorer_name, g.assist_name,
          s.sub_in_name, s.sub_out_name,
          c.player_name AS card_player, c.card_type,
          p.player_name AS penalty_player, p.result AS penalty_result
        FROM match_event_log e
        LEFT JOIN match_goals g ON e.id = g.event_id
        LEFT JOIN match_substitutions s ON e.id = s.event_id
        LEFT JOIN match_cards c ON e.id = c.event_id
        LEFT JOIN match_penalties p ON e.id = p.event_id
        WHERE e.match_id = ?
        ORDER BY 
          FIELD(e.period, '1H','2H','ET1','ET2','PEN'),
          e.event_minute ASC
      `, [match_id]);
  
      res.json({ code: 0, data: result });
    } catch (err) {
      next(err);
    }
};

// 删除某个比赛事件
exports.deleteMatchEvent = async (req, res, next) => {
    try {
      const { event_id } = req.params;
  
      // 删除顺序：先删子表，后删主表
      await Promise.all([
        db.startQuery("DELETE FROM match_goals WHERE event_id = ?", [event_id]),
        db.startQuery("DELETE FROM match_substitutions WHERE event_id = ?", [event_id]),
        db.startQuery("DELETE FROM match_cards WHERE event_id = ?", [event_id]),
        db.startQuery("DELETE FROM match_penalties WHERE event_id = ?", [event_id]),
      ]);
  
      await db.startQuery("DELETE FROM match_event_log WHERE id = ?", [event_id]);
  
      res.json({ code: 0, msg: "事件删除成功" });
    } catch (err) {
      next(err);
    }
};

// 获取最终比分（含点球，若有）
exports.getFinalMatchScore = async (req, res, next) => {
    try {
      const { match_id } = req.query;
  
      // 常规/加时进球
      const goals = await db.startQuery(`
        SELECT team_name, COUNT(*) AS goal_count
        FROM match_event_log
        WHERE match_id = ? AND event_type = 'goal'
        GROUP BY team_name
      `, [match_id]);
  
      // 点球大战进球（如果有）
      const penalties = await db.startQuery(`
        SELECT team_name, COUNT(*) AS penalty_score
        FROM match_event_log l
        JOIN match_penalties p ON l.id = p.event_id
        WHERE l.match_id = ? AND l.period = 'PEN' AND p.result = 'score'
        GROUP BY l.team_name
      `, [match_id]);
  
      const finalScore = {};
      let hasPenaltyShootout = penalties.length > 0;
  
      // 初始化比分结构
      for (const g of goals) {
        finalScore[g.team_name] = { goal: g.goal_count, penalty: 0 };
      }
  
      for (const p of penalties) {
        if (!finalScore[p.team_name]) {
          finalScore[p.team_name] = { goal: 0, penalty: p.penalty_score };
        } else {
          finalScore[p.team_name].penalty = p.penalty_score;
        }
      }
  
      res.json({
        code: 0,
        data: {
          score: finalScore,
          has_penalty_shootout: hasPenaltyShootout  // 如果hasPenaltyShootout为false，则不用显示点球比分
        }
      });
    } catch (err) {
      next(err);
    }
};
  
