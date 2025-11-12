const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

/**
 * AI分析相关路由
 * 所有路由都需要身份验证
 */

// 战术分析接口
// POST /api/ai/analyze-tactic
router.post('/analyze-tactic', auth, aiController.analyzeTactic);

// 球员健康分析接口
// POST /api/ai/analyze-player-health
router.post('/analyze-player-health', auth, aiController.analyzePlayerHealth);

// 获取分析历史记录接口
// GET /api/ai/history
router.get('/history', auth, aiController.getAnalysisHistory);

// 战术问答接口
// POST /api/ai/tactic-question
router.post('/tactic-question', auth, aiController.answerTacticQuestion);

// 全能型球队管家问答接口 - 需要身份验证，仅登录用户可以使用
router.post('/team-question', auth, aiController.answerTeamQuestion);

module.exports = router;