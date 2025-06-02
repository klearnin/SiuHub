const db = require("../database");

// 1. 获取球队信息
exports.getTeamInfo = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const [team] = await db.startQuery(
      `SELECT name, abbr, logo_path FROM teams WHERE id = ?`,
      [team_id]
    );
    res.json({ code: 0, data: team });
  } catch (err) {
    next(err);
  }
};

// 获取球队最近五场比赛的成绩与对手比分差（状态显示在球队信息栏，比分差为+x，则显示红色x高度；比分差为-x，则显示绿色x高度）
exports.getTeamMatchScores = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    // 获取最近的5场已结束比赛（past_match）
    const matches = await db.startQuery(`
      SELECT s.id AS schedule_id, m.id AS match_id, m.team1, m.team2
      FROM schedule s
      JOIN match_schedule m ON s.id = m.schedule_id
      WHERE s.team_id = ? AND s.type = 'past_match'
      ORDER BY s.date DESC, m.match_time DESC
      LIMIT 5
    `, [team_id]);

    // 处理每场比赛，获取比分差
    for (const match of matches) {
      // 获取进球信息
      const goals = await db.startQuery(`
        SELECT team_name, COUNT(*) AS goal_count
        FROM match_event_log
        WHERE match_id = ? AND event_type = 'goal'
        GROUP BY team_name
      `, [match.match_id]);

      // 初始化比分
      let team1_goals = 0;
      let team2_goals = 0;

      // 根据 match_goals 获取进球数
      for (const g of goals) {
        if (g.team_name === match.team1) {
          team1_goals = g.goal_count;
        } else if (g.team_name === match.team2) {
          team2_goals = g.goal_count;
        }
      }

      // 如果进球数相同，检查点球
      if (team1_goals === team2_goals) {
        const penalties = await db.startQuery(`
          SELECT team_name, COUNT(*) AS penalty_score
          FROM match_event_log l
          JOIN match_penalties p ON l.id = p.event_id
          WHERE l.match_id = ? AND l.period = 'PEN' AND p.result = 'score'
          GROUP BY l.team_name
        `, [match.match_id]);

        let team1_penalty = 0;
        let team2_penalty = 0;

        for (const p of penalties) {
          if (p.team_name === match.team1) {
            team1_penalty = p.penalty_score;
          } else if (p.team_name === match.team2) {
            team2_penalty = p.penalty_score;
          }
        }

        // 设置点球后的比分差
        team1_goals += team1_penalty;
        team2_goals += team2_penalty;
      }

      // 计算比分差（team1 - team2）
      match.score_difference = team1_goals - team2_goals;
    }

    res.json({ code: 0, data: matches });
  } catch (err) {
    next(err);
  }
};

// 2. 获取球队赛程（未来比赛与已结束比赛）
exports.getTeamMatches = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    const matches = await db.startQuery(`
      SELECT s.id AS schedule_id, s.date, s.type, m.id AS match_id,
             m.location, CONCAT(s.date, ' ', m.match_time) AS datetime, m.team1, m.team2,
             t1.logo_path AS team1_logo, t2.logo_path AS team2_logo
      FROM schedule s
      JOIN match_schedule m ON s.id = m.schedule_id
      LEFT JOIN teams t1 ON m.team1 = t1.name
      LEFT JOIN teams t2 ON m.team2 = t2.name
      WHERE s.team_id = ? AND s.type IN ('match', 'past_match')
      ORDER BY s.date DESC, m.match_time DESC
    `, [team_id]);

    // 处理 past_match 结果
    for (const match of matches) {
        if (match.type === 'past_match') {
            // 初始化比分，确保前端不会出错
            match.score = {
            [match.team1]: { goal: 0, penalty: 0 },
            [match.team2]: { goal: 0, penalty: 0 }
            };

            const goals = await db.startQuery(`
            SELECT team_name, COUNT(*) AS goal_count
            FROM match_event_log
            WHERE match_id = ? AND event_type = 'goal'
            GROUP BY team_name
            `, [match.match_id]);

            const penalties = await db.startQuery(`
            SELECT team_name, COUNT(*) AS penalty_score
            FROM match_event_log l
            JOIN match_penalties p ON l.id = p.event_id
            WHERE l.match_id = ? AND l.period = 'PEN' AND p.result = 'score'
            GROUP BY l.team_name
            `, [match.match_id]);

            for (const g of goals) {
            match.score[g.team_name].goal = g.goal_count;
            }

            for (const p of penalties) {
            match.score[p.team_name].penalty = p.penalty_score;
            }
        }
    }


    res.json({ code: 0, data: matches });
  } catch (err) {
    next(err);
  }
};

// 3. 获取射手榜
exports.getTopScorers = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const goals = await db.startQuery(`
      SELECT g.scorer_id, g.scorer_name,
             COUNT(*) AS total_goals,
             SUM(CASE WHEN g.is_penalty THEN 1 ELSE 0 END) AS penalty_goals,
             u.avatar AS scorer_avatar
      FROM match_goals g
      JOIN match_event_log e ON g.event_id = e.id
      JOIN users u ON g.scorer_id = u.id
      WHERE e.team_name = (SELECT name FROM teams WHERE id = ?)
      GROUP BY g.scorer_id, g.scorer_name, u.avatar
      ORDER BY total_goals DESC
    `, [team_id]);

    res.json({ code: 0, data: goals });
  } catch (err) {
    next(err);
  }
};


// 4. 获取助攻榜
exports.getTopAssists = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const assists = await db.startQuery(`
      SELECT g.assist_id, g.assist_name,
             COUNT(*) AS total_assists,
             u.avatar AS assist_avatar
      FROM match_goals g
      JOIN match_event_log e ON g.event_id = e.id
      JOIN users u ON g.assist_id = u.id
      WHERE e.team_name = (SELECT name FROM teams WHERE id = ?)
            AND g.assist_id IS NOT NULL
      GROUP BY g.assist_id, g.assist_name, u.avatar
      ORDER BY total_assists DESC
    `, [team_id]);

    res.json({ code: 0, data: assists });
  } catch (err) {
    next(err);
  }
};


// 获取某场比赛的完整信息（包括比分）
exports.getMatchDetail = async (req, res, next) => {
  try {
    const { match_id } = req.params;

    // 查询比赛与球队基本信息
    const [match] = await db.startQuery(`
      SELECT m.id AS match_id, m.location, m.match_time, m.team1, m.team2,
             t1.logo_path AS team1_logo, t2.logo_path AS team2_logo,
             s.date, s.type
      FROM match_schedule m
      JOIN schedule s ON m.schedule_id = s.id
      LEFT JOIN teams t1 ON m.team1 = t1.name
      LEFT JOIN teams t2 ON m.team2 = t2.name
      WHERE m.id = ?
      LIMIT 1
    `, [match_id]);

    if (!match) {
      return res.status(404).json({ msg: "未找到该比赛" });
    }

    // 如果比赛已结束，附带比分信息
    if (match.type === 'past_match') {
      const goals = await db.startQuery(`
        SELECT team_name, COUNT(*) AS goal_count
        FROM match_event_log
        WHERE match_id = ? AND event_type = 'goal'
        GROUP BY team_name
      `, [match_id]);

      const penalties = await db.startQuery(`
        SELECT team_name, COUNT(*) AS penalty_score
        FROM match_event_log l
        JOIN match_penalties p ON l.id = p.event_id
        WHERE l.match_id = ? AND l.period = 'PEN' AND p.result = 'score'
        GROUP BY l.team_name
      `, [match_id]);

      // 初始化比分（确保前端不报错）
        match.score = {
        [match.team1]: { goal: 0, penalty: 0 },
        [match.team2]: { goal: 0, penalty: 0 }
        };

        // 覆盖真实进球数
        for (const g of goals) {
        match.score[g.team_name].goal = g.goal_count;
        }

        // 覆盖真实点球数
        for (const p of penalties) {
        match.score[p.team_name].penalty = p.penalty_score;
        }
    }

    res.json({ code: 0, data: match });
  } catch (err) {
    next(err);
  }
};

// 获取某一场比赛全部事件
exports.getMatchEvents = async (req, res, next) => {
    try {
      const { match_id } = req.query;
  
      const result = await db.startQuery(`
        SELECT e.id, e.period, e.event_minute, e.minute_note, e.event_type, e.team_name,
          g.scorer_name, g.assist_name, g.is_penalty,
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

// 获取下一场比赛（球迷主界面显示）
exports.getNextSchedule = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    const [nextMatch] = await db.startQuery(`
      SELECT 
        s.id AS schedule_id, s.date, s.type,
        m.id AS match_id, m.match_time, m.location,
        m.team1, m.team2,
        t1.logo_path AS team1_logo,
        t2.logo_path AS team2_logo
      FROM schedule s
      JOIN match_schedule m ON s.id = m.schedule_id
      LEFT JOIN teams t1 ON m.team1 = t1.name
      LEFT JOIN teams t2 ON m.team2 = t2.name
      WHERE s.team_id = ? AND s.date >= CURDATE() AND s.type = 'match'
      ORDER BY s.date ASC, m.match_time ASC
      LIMIT 1
    `, [team_id]);

    res.json({ code: 0, data: nextMatch || null });
  } catch (err) {
    next(err);
  }
};

// 获取球队荣誉
exports.getPublicTeamHonors = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const result = await db.startQuery(`
      SELECT title, description, honor_date
      FROM team_honors
      WHERE team_id = ?
      ORDER BY honor_date DESC
    `, [team_id]);
    res.json({ code: 0, data: result });
  } catch (err) {
    next(err);
  }
};
