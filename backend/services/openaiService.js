const OpenAI = require('openai');
const db = require('../database');
require('dotenv').config();

// 创建OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3'
});

/**
 * 战术分析服务
 * @param {Object} tacticData - 战术数据
 * @param {Array} players - 球员数据
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeTactic(tacticData, players) {
  try {
    // 构建提示词
    const prompt = `
    作为一名专业的足球战术分析师，请分析以下战术：
    
    战术名称：${tacticData.tactic_name}
    战术风格：${tacticData.style}
    
    球员配置：
    ${players.map(player => 
      `${player.player_name}（${player.player_number}号，${player.position || '未指定位置'}，${player.dominant_foot}）`
    ).join('\n')}
    
    请从以下几个方面进行分析：
    1. 战术阵型的优势和劣势
    2. 球员配置是否合理
    3. 可能的进攻和防守策略
    4. 改进建议
    
    请用中文输出分析结果，保持专业但易懂的语言。
    `;

    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: 'ep-20251012221233-jk4rc',
      messages: [
        { role: 'system', content: '你是一名专业的足球战术分析师。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, // 增加tokens数量以获取更完整的回答
      temperature: 0.7,
      timeout: 300000 // 设置5分钟超时
    });

    const analysisResult = response.choices[0].message.content;

    // 保存分析结果到数据库
    const result = await db.startQuery(
      'INSERT INTO ai_analysis_results (type, target_id, result, created_at) VALUES (?, ?, ?, NOW())',
      ['tactic', tacticData.id, analysisResult]
    );

    return {
      id: result.insertId,
      type: 'tactic',
      target_id: tacticData.id,
      result: analysisResult,
      created_at: new Date()
    };
  } catch (error) {
    console.error('战术分析失败:', error);
    throw error;
  }
}

/**
 * 球员分析服务（包含健康分析和数据能力分析）
 * @param {Object} player - 球员数据
 * @param {Array} injuries - 伤病记录
 * @param {Object} playerStats - 球员统计数据
 * @returns {Promise<Object>} 分析结果
 */
async function analyzePlayerHealth(player, injuries, playerStats = {}) {
  try {
    // 构建提示词
    const prompt = `
    作为一名专业的足球分析师，请对以下球员进行全面分析：
    
    球员信息：
    姓名：${player.player_name}
    年龄：${player.age}岁
    身高：${player.height}cm
    体重：${player.weight}kg
    惯用脚：${player.dominant_foot}
    健康状态：${player.health}
    
    伤病记录：
    ${injuries.length > 0 ? 
      injuries.map(injury => 
        `${injury.injury_name}（受伤日期：${injury.injury_date}，预计恢复天数：${injury.recovery_days}天，描述：${injury.description}）`
      ).join('\n') : '无伤病记录'
    }
    
    球员数据统计：
    总进球数：${playerStats.totalGoals || 0}个
    点球进球：${playerStats.penaltyGoals || 0}个
    总助攻数：${playerStats.totalAssists || 0}个
    
    请从以下几个方面进行分析：
    1. 当前健康状况评估
    2. 伤病风险分析
    3. 训练和恢复建议
    4. 比赛参与建议
    5. 数据能力分析：基于进球和助攻数据评估球员的进攻能力和效率
    
    请用中文输出分析结果，保持专业但易懂的语言。
    `;

    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: 'ep-20251012221233-jk4rc',
      messages: [
        { role: 'system', content: '你是一名专业的足球医疗顾问。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, // 增加tokens数量以获取更完整的回答
      temperature: 0.7,
      timeout: 300000 // 设置5分钟超时
    });

    const analysisResult = response.choices[0].message.content;

    // 保存分析结果到数据库
    const result = await db.startQuery(
      'INSERT INTO ai_analysis_results (type, target_id, result, created_at) VALUES (?, ?, ?, NOW())',
      ['player_health', player.id, analysisResult]
    );

    return {
      id: result.insertId,
      type: 'player_health',
      target_id: player.id,
      result: analysisResult,
      created_at: new Date()
    };
  } catch (error) {
    console.error('球员健康分析失败:', error);
    throw error;
  }
}

/**
 * 初始化AI分析结果表
 */
async function initAiAnalysisTable() {
   try {
     // 检查是否存在ai_analysis_results表
     const tables = await db.startQuery(
       "SHOW TABLES LIKE 'ai_analysis_results'"
     );
 
     if (!tables || tables.length === 0) {
      // 创建ai_analysis_results表
      await db.startQuery(`
        CREATE TABLE ai_analysis_results (
          id INT PRIMARY KEY AUTO_INCREMENT,
          type ENUM('tactic', 'player_health') NOT NULL COMMENT '分析类型',
          target_id INT NOT NULL COMMENT '目标ID（战术ID或球员ID）',
          result TEXT NOT NULL COMMENT '分析结果',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
        )
      `);
      console.log('AI分析结果表创建成功');
    }
  } catch (error) {
    console.error('初始化AI分析表失败:', error);
  }
}

/**
 * 战术问答服务
 * @param {string} question - 用户的问题
 * @param {Object} context - 上下文信息（可选）
 * @returns {Promise<string>} AI的回答
 */
async function answerTacticQuestion(question, context = null) {
  try {
    // 构建提示词
    let prompt = `
    作为一名专业的足球战术分析师，请回答以下问题：
    ${question}
    `;
    
    // 如果有上下文信息，添加到提示词中
    if (context) {
      prompt += `\n\n相关背景信息：\n${JSON.stringify(context)}`;
    }

    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: 'ep-20251012221233-jk4rc',
      messages: [
        { role: 'system', content: '你是一名专业的足球战术分析师，擅长解答各种战术相关问题。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, // 增加tokens数量以获取更完整的回答
      temperature: 0.7,
      timeout: 300000 // 设置5分钟超时
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('战术问答失败:', error);
    throw error;
  }
}

/**
 * 全能型球队管家问答服务
 * @param {string} question - 用户的问题
 * @returns {Promise<string>} AI的回答
 */
async function answerTeamQuestion(question) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${timestamp}] [${requestId}] AI服务层 - 开始处理请求`);
  
  try {
    // 构建提示词
    const prompt = `
    请回答以下关于足球的问题：
    ${question}
    `;

    console.log(`[${timestamp}] [${requestId}] AI服务层 - 构建提示词完成`);
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 调用OpenAI API`);
    
    // 记录API调用开始时间
    const apiStartTime = Date.now();
    
    // 调用OpenAI API，使用更全面的系统提示，设置2分钟超时
    const response = await openai.chat.completions.create({
      model: 'ep-20251012221233-jk4rc',
      messages: [
        {
          role: 'system',
          content: '你是一位全能型的足球球队管家，精通足球战术分析、球员健康管理、足球知识普及等各个方面。你可以回答关于战术布局、阵型分析、球员恢复、伤病预防、足球规则、历史事件、比赛策略等各种足球相关问题。请用专业但易懂的中文回答，保持友好的语气，并尽可能提供详细而准确的信息。'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000, // 增加tokens数量以获取更完整的回答
      temperature: 0.7,
      timeout: 300000 // 设置5分钟超时，给复杂问题留出足够的处理时间
    });
    
    // 记录API调用结束时间
    const apiEndTime = Date.now();
    const apiDuration = apiEndTime - apiStartTime;
    
    console.log(`[${timestamp}] [${requestId}] AI服务层 - OpenAI API调用完成，耗时: ${apiDuration}ms`);
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 响应tokens: ${response.usage?.total_tokens || '未知'}`);
    
    const answer = response.choices[0].message.content;
    
    // 记录完整服务处理时间
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 处理完成`);
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 回答类型: ${typeof answer}`);
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 回答长度: ${answer.length} 字符`);
    console.log(`[${timestamp}] [${requestId}] AI服务层 - 总处理耗时: ${totalDuration}ms`);
    
    return answer;
  } catch (error) {
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.error(`[${timestamp}] [${requestId}] AI服务层 - 处理失败`);
    console.error(`[${timestamp}] [${requestId}] AI服务层 - 错误类型: ${error.name || '未知错误'}`);
    console.error(`[${timestamp}] [${requestId}] AI服务层 - 错误消息: ${error.message}`);
    
    // 记录详细的错误信息
    if (error.response) {
      console.error(`[${timestamp}] [${requestId}] AI服务层 - API响应状态: ${error.response.status}`);
      console.error(`[${timestamp}] [${requestId}] AI服务层 - API响应数据:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error(`[${timestamp}] [${requestId}] AI服务层 - 无响应: 请求已发送但未收到响应`);
    }
    
    console.error(`[${timestamp}] [${requestId}] AI服务层 - 失败耗时: ${totalDuration}ms`);
    
    throw error;
  }
}

// 导出服务
exports = module.exports = {
  analyzeTactic,
  analyzePlayerHealth,
  initAiAnalysisTable,
  answerTacticQuestion,
  answerTeamQuestion
};