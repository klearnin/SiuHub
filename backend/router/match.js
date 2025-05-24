const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // 需要身份验证中间件
const matchController = require("../controllers/match");

// 获取今日比赛对阵信息
router.get("/today-matches", matchController.getTodayMatches);

// 添加比赛事件
router.post("/event/goal", matchController.addGoalEvent);
router.post("/event/substitution", matchController.addSubstitutionEvent);
router.post("/event/card", matchController.addCardEvent);
router.post("/event/penalty", matchController.addPenaltyEvent);

// 获取本队球员（经理身份验证）
router.get("/players/by-manager", auth, matchController.getPlayersByManager);

// 获取某场比赛所有事件（用于实时列表）
router.get("/events", matchController.getMatchEvents);

// 删除比赛事件
router.delete("/event/:event_id", matchController.deleteMatchEvent);

// 获取最终比分（含点球，若有）
router.get("/final-score", matchController.getFinalMatchScore);

router.patch('/mark-finished/:match_id',  matchController.markMatchAsFinished);


module.exports = router;
