const express = require("express");
const router = express.Router();
const teamController = require("../controllers/team");
const auth = require("../middleware/auth"); // 确保用户身份校验中间件

router.get("/info", auth, teamController.getTeamInfo);                      // 1. 获取球队信息
router.get("/matches", auth, teamController.getTeamMatches);               // 2. 获取球队赛程
router.get("/scorers", auth, teamController.getTopScorers);               // 3. 获取射手榜
router.get("/assists", auth, teamController.getTopAssists);               // 4. 获取助攻榜
router.get("/match/:match_id", auth, teamController.getMatchDetail);      // 获取比赛详情
router.get("/match-events", auth, teamController.getMatchEvents);         // 获取比赛全部事件（match_id 传 query）
router.get("/next", auth, teamController.getNextSchedule);                // 获取下一场比赛
router.get("/honors", auth, teamController.getPublicTeamHonors);          // 获取球队荣誉
router.get("/team-match-scores", auth, teamController.getTeamMatchScores); // 获取球队最近五场比赛的成绩与比分差

module.exports = router;
