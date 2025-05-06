// controllers/schedule.js
const { startQuery, escape } = require('../database/index');

exports.createTrainingSchedule = async (req, res) => {
  try {
    const user = req.user;
    const { date,training_time, team_training, personal_training } = req.body;

    // 插入主 schedule 表
    const result = await startQuery(`INSERT INTO schedule (date, type, team_id) VALUES (${escape(date)}, 'training', ${escape(user.team_id)})`);
    const scheduleId = result.insertId;

    // 插入 training_schedule 表
    await startQuery(`INSERT INTO training_schedule (schedule_id, training_time, team_training, personal_training)
                      VALUES (${scheduleId}, ${escape(training_time)} ,${escape(team_training)}, ${escape(personal_training)})`);

    res.json({ code: 0, message: '训练日程创建成功', scheduleId });
  } catch (err) {
    res.status(500).json({ error: '创建训练日程失败' });
  }
};

exports.createElseSchedule = async (req, res) => {
  try {
    const user = req.user;
    const { date,else_time, content} = req.body;

    // 插入主 schedule 表
    const result = await startQuery(`INSERT INTO schedule (date, type, team_id) VALUES (${escape(date)}, 'else', ${escape(user.team_id)})`);
    const scheduleId = result.insertId;

    // 插入 else_schedule 表
    await startQuery(`INSERT INTO else_schedule (schedule_id, else_time, content)
                      VALUES (${scheduleId}, ${escape(else_time)} ,${escape(content)})`);

    res.json({ code: 0, message: '其他日程创建成功', scheduleId });
  } catch (err) {
    res.status(500).json({ error: '创建其他日程失败' });
  }
};

exports.createMatchSchedule = async (req, res) => {
  try {
    const user = req.user;
    const { date, type, location, match_time, team1, team2, events } = req.body;

    if (!['match', 'past_match'].includes(type)) {
      return res.status(400).json({ error: '比赛类型不合法' });
    }

    // 插入 schedule 表
    const result = await startQuery(`INSERT INTO schedule (date, type, team_id) VALUES (${escape(date)}, ${escape(type)}, ${escape(user.team_id)})`);
    const scheduleId = result.insertId;

    // 插入 match_schedule 表
    const matchRes = await startQuery(`INSERT INTO match_schedule (schedule_id, location, match_time, team1, team2)
                                       VALUES (${scheduleId}, ${escape(location)}, ${escape(match_time)}, ${escape(team1)}, ${escape(team2)})`);
    const matchScheduleId = matchRes.insertId;

    // 如果是过去比赛，再插入 match_event 表
    if (type === 'past_match' && Array.isArray(events)) {
      for (const event of events) {
        await startQuery(`INSERT INTO match_event (match_schedule_id, event_time, description)
                          VALUES (${matchScheduleId}, ${escape(event.event_time)}, ${escape(event.description)})`);
      }
    }

    res.json({code: 0,  message: '比赛日程创建成功', scheduleId });
  } catch (err) {
    res.status(500).json({ error: '创建比赛日程失败' });
  }
};


exports.getScheduleByDate = async (req, res) => {
  try {
    const user = req.user;
    const { date, month } = req.query;

    // 查询schedule时，直接格式化date成字符串，避免带时分秒
    let sql = `
      SELECT id, DATE_FORMAT(date, '%Y-%m-%d') AS date, type, created_at
      FROM schedule WHERE team_id = ${escape(user.team_id)}
    `;

    if (date) {
      sql += ` AND date = ${escape(date)}`;
    } else if (month) {
      sql += ` AND DATE_FORMAT(date, '%Y-%m') = ${escape(month)}`;
    }

    const scheduleList = await startQuery(sql);

    const detailedList = [];

    for (const schedule of scheduleList) {
      const detail = { ...schedule };

      if (schedule.type === 'training') {
        const [training] = await startQuery(`
          SELECT training_time, team_training, personal_training
          FROM training_schedule
          WHERE schedule_id = ${escape(schedule.id)}
        `);
        if (training) {
          Object.assign(detail, training);
        }
      }
      else if (schedule.type === 'else') {
        const [else_schedule] = await startQuery(`
          SELECT else_time, content
          FROM else_schedule
          WHERE schedule_id = ${escape(schedule.id)}
        `);
        if (else_schedule) {
          Object.assign(detail, else_schedule);
        }
      }
       else if (schedule.type === 'match' || schedule.type === 'past_match') {
        const [match] = await startQuery(`
          SELECT location, match_time, team1, team2
          FROM match_schedule
          WHERE schedule_id = ${escape(schedule.id)}
        `);
        if (match) {
          Object.assign(detail, match);

          if (schedule.type === 'past_match') {
            const events = await startQuery(`
              SELECT * FROM match_event
              WHERE match_schedule_id = ${escape(match.id)}
            `);
            detail.events = events;
          }
        }
      }

      detailedList.push(detail);
    }

    res.json(detailedList);
  } catch (err) {
    console.error('获取日程失败：', err);
    res.status(500).json({ error: '获取日程失败' });
  }
};


exports.getMatchEvents = async (req, res) => {
  try {
    const matchScheduleId = req.params.id;

    const matchInfo = await startQuery(`SELECT * FROM match_schedule WHERE id = ${escape(matchScheduleId)}`);
    const events = await startQuery(`SELECT * FROM match_event WHERE match_schedule_id = ${escape(matchScheduleId)}`);

    res.json({ match: matchInfo[0], events });
  } catch (err) {
    res.status(500).json({ error: '获取比赛详情失败' });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const user = req.user;
    // 删除 schedule 表的记录（外键自动删除子表）
    await startQuery(`DELETE FROM schedule WHERE id = ${escape(scheduleId)} AND team_id = ${escape(user.team_id)}`);

    res.json({ code: 0, message: '日程删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除日程失败' });
  }
};


exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    // 先查 schedule 表，判断类型
    const scheduleRows = await startQuery(`SELECT * FROM schedule WHERE id = ${escape(id)} AND team_id = ${escape(user.team_id)}`);
    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: '未找到对应日程' });
    }

    const schedule = scheduleRows[0];

    let detail = { ...schedule };

    if (schedule.type === 'training') {
      const trainingRows = await startQuery(`SELECT * FROM training_schedule WHERE schedule_id = ${escape(id)}`);
      if (trainingRows.length > 0) {
        Object.assign(detail, trainingRows[0]);
      }
    }
    else if (schedule.type === 'else') {
      const elseRows = await startQuery(`SELECT * FROM else_schedule WHERE schedule_id = ${escape(id)}`);
      if (elseRows.length > 0) {
        Object.assign(detail, elseRows[0]);
      }
    }
     else if (schedule.type === 'match' || schedule.type === 'past_match') {
      const matchRows = await startQuery(`SELECT * FROM match_schedule WHERE schedule_id = ${escape(id)}`);
      if (matchRows.length > 0) {
        const match = matchRows[0];
        Object.assign(detail, match);

        if (schedule.type === 'past_match') {
          const events = await startQuery(`SELECT * FROM match_event WHERE match_schedule_id = ${escape(match.id)}`);
          detail.events = events;
        }
      }
    }

    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: '获取日程详情失败' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params; // schedule.id
    const { date, type } = req.body;

    // 更新 schedule 表中的日期
    await startQuery(`UPDATE schedule SET date = ${escape(date)} WHERE id = ${escape(id)}`);

    if (type === 'training') {
      const { training_time, team_training, personal_training } = req.body;

      await startQuery(`UPDATE training_schedule
                        SET training_time = ${escape(training_time)},
                            team_training = ${escape(team_training)},
                            personal_training = ${escape(personal_training)}
                        WHERE schedule_id = ${escape(id)}`);

      res.json({ message: '训练日程更新成功' });
    }
    else if (type === 'else') {
      const { else_time, content} = req.body;

      await startQuery(`UPDATE else_schedule
                        SET else_time = ${escape(else_time)},
                            content = ${escape(content)}
                        WHERE schedule_id = ${escape(id)}`);

      res.json({ message: '其他日程更新成功' });
    }
     else if (type === 'match' || type === 'past_match') {
      const { location, match_time, team1, team2 } = req.body;

      await startQuery(`UPDATE match_schedule
                        SET location = ${escape(location)},
                            match_time = ${escape(match_time)},
                            team1 = ${escape(team1)},
                            team2 = ${escape(team2)}
                        WHERE schedule_id = ${escape(id)}`);

      res.json({ code: 0, message: '比赛日程更新成功' });
    } else {
      res.status(400).json({ error: '未知的日程类型' });
    }
  } catch (err) {
    res.status(500).json({ error: '更新日程失败' });
  }
};

exports.getTeamnameandlist = async (req, res) => {
  try {
    const user = req.user;
    const result = await startQuery(`SELECT name FROM teams WHERE id = ${escape(user.team_id)}`);
    const teamlist= await startQuery(`SELECT name FROM teams`);
    res.json({ code: 0, message: '球队名称获取成功', teamname:result ,teamlist:teamlist});
  } catch (err) {
    res.status(500).json({ error: '球队名称获取失败' });
  }
};