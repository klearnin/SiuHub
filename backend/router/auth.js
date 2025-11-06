const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

router.post("/login", authController.login);
router.post("/register/:type", upload.fields([{ name: "logo", maxCount: 1 },{ name: "avatar", maxCount: 1 },]),authController.register);
router.post("/review-join", auth, authController.reviewJoinRequest);
router.get("/pending-users", auth, authController.getPendingUsers);
router.get("/get-all-teams", authController.getAllTeams);
router.post("/validate-mail", authController.validateMail);

// 新增两个接口（找回密码功能）：
router.post("/send-reset-code", authController.sendResetCode);
router.post("/reset-password", authController.resetPassword);

// 确认公告接口
router.post('/confirm-announcement', auth, authController.confirmAnnouncement);



module.exports = router;
