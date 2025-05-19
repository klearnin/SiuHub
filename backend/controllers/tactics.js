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

exports.createTactic = async (req, res, next) => {
  try {
    const user = req.user;
    const { tactic_name, style, players, characters } = req.body;

    // 开启事务
    //await db.startQuery('START TRANSACTION');

    // 1. 插入 tactics 表
    const tacticSql = `
      INSERT INTO tactics (tactic_name, style, team_id)
      VALUES (${db.escape(tactic_name)}, ${db.escape(style)}, ${db.escape(user.team_id)})
    `;
    const tacticResult = await db.startQuery(tacticSql);
    const tactic_id = tacticResult.insertId;

    // 2. 插入 tactic_player 表
    for (const player of players) {
      const playerSql = `
        INSERT INTO tactic_player (Xvalue, Yvalue, tactic_id, player_id)
        VALUES (${db.escape(player.Xvalue)}, ${db.escape(player.Yvalue)}, ${db.escape(tactic_id)}, ${db.escape(player.player_id)})
      `;
      await db.startQuery(playerSql);
    }

    // 3. 插入 tactic_characters 表
    const characterSql = `
      INSERT INTO tactic_characters (
        right_corner, left_corner, penalty_kicker,
        short_freekick, long_freekick, captain, tactic_id
      ) VALUES (
        ${db.escape(characters.right_corner)},
        ${db.escape(characters.left_corner)},
        ${db.escape(characters.penalty_kicker)},
        ${db.escape(characters.short_freekick)},
        ${db.escape(characters.long_freekick)},
        ${db.escape(characters.captain)},
        ${db.escape(tactic_id)}
      )
    `;
    await db.startQuery(characterSql);

    // 提交事务
    //await db.startQuery('COMMIT');
    res.json({ code: 0, msg: '创建战术成功', tactic_id });
  } catch (err) {
    // 回滚事务
   // await db.startQuery('ROLLBACK');
    console.error('创建战术失败:', err);
    next(err);
  }
}

exports.getTactic = async (req, res, next) => {
  try {
    const user = req.user;

    // 1. 查询 tactics 表中该 team 的所有战术
    const tacticsSql = `SELECT * FROM tactics WHERE team_id = ${db.escape(user.team_id)}`;
    const tactics = await db.startQuery(tacticsSql);

    // 如果没有战术，直接返回空数组
    if (tactics.length === 0) {
      return res.json({ code: 0, msg: '获取成功', tacticList: [] });
    }

    // 2. 获取所有 tactic_ids
    const tacticIds = tactics.map(t => t.id);

    // 3. 查询所有 tactic_player 数据
    const playerSql = `
      SELECT * FROM tactic_player
      WHERE tactic_id IN (${tacticIds.join(',')})
    `;
    const tacticPlayers = await db.startQuery(playerSql);

    // 4. 查询所有 tactic_characters 数据
    const charactersSql = `
      SELECT * FROM tactic_characters
      WHERE tactic_id IN (${tacticIds.join(',')})
    `;
    const tacticCharacters = await db.startQuery(charactersSql);

    // 5. 将数据组合在一起
    const tacticList = tactics.map(tactic => {
      return {
        ...tactic,
        players: tacticPlayers.filter(p => p.tactic_id === tactic.id),
        characters: tacticCharacters.find(c => c.tactic_id === tactic.id) || null,
      };
    });
    

    res.json({ code: 0, msg: '获取成功', tacticList });
  } catch (err) {
    next(err);
  }
};


exports.deleteTactic = async (req, res, next) => {
  try {
    const tacticId = req.params.id; // 从 URL 中获取 ID
    const user = req.user;

    // 验证战术是否属于该用户所在球队
    const checkSql = `
      SELECT * FROM tactics 
      WHERE id = ${db.escape(tacticId)} AND team_id = ${db.escape(user.team_id)}
    `;
    const result = await db.startQuery(checkSql);

    if (result.length === 0) {
      return res.status(403).json({ code: 1, message: '无权限或战术不存在' });
    }

    // 删除战术（自动级联删除子表）
    const deleteSql = `DELETE FROM tactics WHERE id = ${db.escape(tacticId)}`;
    await db.startQuery(deleteSql);

    res.json({ code: 0, message: '战术删除成功' });
  } catch (err) {
    next(err);
  }
};


exports.updateTactic = async (req, res, next) => {
  try {
    const tacticId = req.params.id;
    const user = req.user;
    const { tactic_name, style, players, characters } = req.body;

    // 权限检查
    const checkSql = `
      SELECT * FROM tactics 
      WHERE id = ${db.escape(tacticId)} AND team_id = ${db.escape(user.team_id)}
    `;
    const checkResult = await db.startQuery(checkSql);

    if (checkResult.length === 0) {
      return res.status(403).json({ code: 1, msg: '无权限或战术不存在' });
    }

    // 开启事务
    //await db.startQuery('START TRANSACTION');

    // 1. 更新 tactics 主表
    const tacticSql = `
      UPDATE tactics 
      SET tactic_name = ${db.escape(tactic_name)}, style = ${db.escape(style)} 
      WHERE id = ${db.escape(tacticId)}
    `;
    await db.startQuery(tacticSql);

    // 2. 清空 tactic_player 并重新插入
    const deletePlayerSql = `
      DELETE FROM tactic_player WHERE tactic_id = ${db.escape(tacticId)}
    `;
    await db.startQuery(deletePlayerSql);

    for (const player of players) {
      const insertPlayerSql = `
        INSERT INTO tactic_player (Xvalue, Yvalue, tactic_id, player_id)
        VALUES (${db.escape(player.Xvalue)}, ${db.escape(player.Yvalue)}, ${db.escape(tacticId)}, ${db.escape(player.player_id)})
      `;
      await db.startQuery(insertPlayerSql);
    }

    // 3. 更新 tactic_characters 表
    const updateCharacterSql = `
      UPDATE tactic_characters SET 
        right_corner = ${db.escape(characters.right_corner)},
        left_corner = ${db.escape(characters.left_corner)},
        penalty_kicker = ${db.escape(characters.penalty_kicker)},
        short_freekick = ${db.escape(characters.short_freekick)},
        long_freekick = ${db.escape(characters.long_freekick)},
        captain = ${db.escape(characters.captain)}
      WHERE tactic_id = ${db.escape(tacticId)}
    `;
    await db.startQuery(updateCharacterSql);

    // 提交事务
    //await db.startQuery('COMMIT');
    res.json({ code: 0, msg: '战术更新成功' });

  } catch (err) {
    // 回滚事务
    //await db.startQuery('ROLLBACK');
    console.error('更新战术失败:', err);
    next(err);
  }
};
