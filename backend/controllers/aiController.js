const db = require('../database');
const openaiService = require('../services/openaiService');

/**
 * 战术分析控制器
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.analyzeTactic = async (req, res, next) => {
  try {
    const { question, context } = req.body;
    
    // 验证参数
    if (!question || question.trim() === '') {
      return res.status(400).json({ code: 1, msg: '问题不能为空' });
    }
    
    // 调用OpenAI服务进行问答
    const answer = await openaiService.answerTacticQuestion(question, context);
    
    res.json({
      code: 0,
      msg: '战术问答成功',
      data: {
        question,
        answer
      }
    });
  } catch (err) {
    console.error('战术问答控制器错误:', err);
    next(err);
  }
};

/**
 * 获取分析历史控制器错误:
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.analyzeTactic = async (req, res, next) => {
  try {
    const { tacticId } = req.body;
    const { team_id } = req.user;

    // 验证参数
    if (!tacticId) {
      return res.status(400).json({ code: 1, msg: '战术ID不能为空' });
    }

    // 获取战术数据
    const [tactic] = await db.startQuery(
      'SELECT * FROM tactics WHERE id = ? AND team_id = ?',
      [tacticId, team_id]
    );

    if (!tactic) {
      return res.status(404).json({ code: 1, msg: '未找到指定的战术' });
    }

    // 获取战术中的球员数据
    const tacticPlayers = await db.startQuery(
      `SELECT tp.player_id, p.player_name, p.player_number, p.dominant_foot 
       FROM tactic_player tp 
       JOIN players p ON tp.player_id = p.id 
       WHERE tp.tactic_id = ?`,
      [tacticId]
    );

    // 获取球员的位置信息（从前端存储的位置数据）
    // 注意：实际项目中可能需要调整这部分逻辑，根据实际的数据结构获取位置信息
    const playersWithPositions = tacticPlayers.map(player => ({
      ...player,
      position: getPositionByPlayerNumber(player.player_number) // 辅助函数，根据球衣号码推断位置
    }));

    // 调用OpenAI服务进行战术分析
    const analysisResult = await openaiService.analyzeTactic(tactic, playersWithPositions);

    res.json({
      code: 0,
      msg: '战术分析成功',
      data: analysisResult
    });
  } catch (err) {
    console.error('战术分析控制器错误:', err);
    next(err);
  }
};

/**
 * 球员分析控制器（包含健康分析和数据能力分析）
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.analyzePlayerHealth = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const { team_id } = req.user;

    // 验证参数
    if (!playerId) {
      return res.status(400).json({ code: 1, msg: '球员ID不能为空' });
    }

    // 获取球员数据
    const [player] = await db.startQuery(
      'SELECT * FROM players WHERE id = ? AND team_id = ?',
      [playerId, team_id]
    );

    if (!player) {
      return res.status(404).json({ code: 1, msg: '未找到指定的球员' });
    }

    // 获取球员的伤病记录
    const injuries = await db.startQuery(
      `SELECT * FROM injuries 
       WHERE player_id = ? 
       ORDER BY injury_date DESC`,
      [playerId]
    );

    // 获取球员的进球数据
    const goalsData = await db.startQuery(
      `SELECT 
        COUNT(*) AS total_goals,
        SUM(CASE WHEN g.is_penalty THEN 1 ELSE 0 END) AS penalty_goals
       FROM match_goals g
       JOIN match_event_log e ON g.event_id = e.id
       WHERE g.scorer_id = ?`,
      [playerId]
    );

    // 获取球员的助攻数据
    const assistsData = await db.startQuery(
      `SELECT COUNT(*) AS total_assists
       FROM match_goals g
       JOIN match_event_log e ON g.event_id = e.id
       WHERE g.assist_id = ?`,
      [playerId]
    );

    // 整合数据
    const playerStats = {
      totalGoals: goalsData[0]?.total_goals || 0,
      penaltyGoals: goalsData[0]?.penalty_goals || 0,
      totalAssists: assistsData[0]?.total_assists || 0
    };

    // 调用OpenAI服务进行球员分析（包含健康和数据能力）
    const analysisResult = await openaiService.analyzePlayerHealth(player, injuries, playerStats);

    res.json({
      code: 0,
      msg: '球员健康分析成功',
      data: analysisResult
    });
  } catch (err) {
    console.error('球员健康分析控制器错误:', err);
    next(err);
  }
};

/**
 * 获取历史分析记录
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.getAnalysisHistory = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const { type, limit = 10, offset = 0 } = req.query;

    let query = 'SELECT a.*, ';
    let joinClause = '';
    let whereClause = '';
    const params = [];

    if (type === 'tactic') {
      // 战术分析记录，关联tactics表
      query += 't.tactic_name, t.style FROM ai_analysis_results a ';
      joinClause = 'JOIN tactics t ON a.target_id = t.id ';
      whereClause = 'WHERE a.type = ? AND t.team_id = ? ';
      params.push('tactic', team_id);
    } else if (type === 'player_health') {
      // 球员健康分析记录，关联players表
      query += 'p.player_name, p.player_number FROM ai_analysis_results a ';
      joinClause = 'JOIN players p ON a.target_id = p.id ';
      whereClause = 'WHERE a.type = ? AND p.team_id = ? ';
      params.push('player_health', team_id);
    } else {
      // 所有类型的分析记录
      query += 'a.* FROM ai_analysis_results a ';
      whereClause = 'WHERE EXISTS (SELECT 1 FROM tactics t WHERE a.target_id = t.id AND t.team_id = ?) OR EXISTS (SELECT 1 FROM players p WHERE a.target_id = p.id AND p.team_id = ?) ';
      params.push(team_id, team_id);
    }

    // 添加分页
    query += joinClause + whereClause + 'ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const history = await db.startQuery(query, params);

    res.json({
      code: 0,
      msg: '获取分析历史成功',
      data: history
    });
  } catch (err) {
    console.error('获取分析历史控制器错误:', err);
    next(err);
  }
};

/**
 * 辅助函数：根据球衣号码推断位置
 * 注意：这只是一个简单的推断，实际项目中应该有更准确的位置数据
 * @param {number} number - 球衣号码
 * @returns {string} 位置名称
 */
function getPositionByPlayerNumber(number) {
  if (number === 1) return '守门员';
  if (number >= 2 && number <= 4) return '后卫';
  if (number >= 5 && number <= 8) return '中场';
  if (number >= 9 && number <= 11) return '前锋';
  return '未指定位置';
}
/**
 * 战术问答控制器
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.answerTacticQuestion = async (req, res, next) => {
  try {
    const { question, context } = req.body;
    
    // 验证参数
    if (!question || question.trim() === '') {
      return res.status(400).json({ code: 1, msg: '问题不能为空' });
    }
    
    // 调用OpenAI服务进行问答
    const answer = await openaiService.answerTacticQuestion(question, context);
    
    res.json({
      code: 0,
      msg: '战术问答成功',
      data: {
        question,
        answer
      }
    });
  } catch (err) {
    console.error('战术问答控制器错误:', err);
    next(err);
  }
};

/**
 * 全能型球队管家问答控制器
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {NextFunction} next - Express下一个中间件函数
 */
exports.answerTeamQuestion = async (req, res, next) => {
  // 记录请求开始时间
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const { question } = req.body;
    
    // 验证参数
    if (!question || question.trim() === '') {
      return res.status(400).json({ code: 1, msg: '问题不能为空' });
    }
    
    console.log('----------------------------------------');
    console.log(`[${timestamp}] AI问答请求开始`);
    console.log(`[${timestamp}] 用户问题: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`);
    console.log(`[${timestamp}] 请求ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    // 调用OpenAI服务进行问答
    const answer = await openaiService.answerTeamQuestion(question);
    
    // 记录请求结束时间
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 详细日志输出
    console.log(`[${timestamp}] AI问答请求完成`);
    console.log(`[${timestamp}] 回答长度: ${answer.length} 字符`);
    console.log(`[${timestamp}] 回答内容: ${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}`);
    console.log(`[${timestamp}] 请求耗时: ${duration}ms`);
    console.log(`[${timestamp}] 状态: 成功`);
    console.log('----------------------------------------');
    
    res.json({
      code: 0,
      msg: '球队管家问答成功',
      data: {
        question,
        answer
      }
    });
  } catch (err) {
    // 记录错误信息
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('----------------------------------------');
    console.error(`[${timestamp}] AI问答请求失败`);
    console.error(`[${timestamp}] 错误信息:`, err.message);
    console.error(`[${timestamp}] 请求耗时: ${duration}ms`);
    console.error(`[${timestamp}] 状态: 失败`);
    console.error('----------------------------------------');
    
    next(err);
  }
};