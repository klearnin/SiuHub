const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const honorController = require("../controllers/honor");


router.post("/team", auth, honorController.addTeamHonor);               // 添加球队荣誉
router.get("/team", auth, honorController.getTeamHonors);              // 获取当前用户所属球队的荣誉
router.put("/team/:id", auth, honorController.updateTeamHonor);        // 更新球队荣誉


router.delete("/:type/:id", honorController.deleteHonor);              // 删除指定类型荣誉（team/personal）


router.post("/personal", honorController.addPersonalHonor);       // 添加个人荣誉
router.get("/personal", honorController.getPersonalHonors);             // 获取某球员个人荣誉（通过 query.user_id）
router.put("/personal/:id", honorController.updatePersonalHonor); // 更新个人荣誉


router.get("/players", auth, honorController.getPlayersByManager);      // 获取本队球员（经理用）
router.get("/team/personal-overview", auth, honorController.getTeamPersonalHonors); // 本队所有球员荣誉

module.exports = router;
