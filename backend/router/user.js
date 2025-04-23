const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const auth = require("../middleware/auth");

router.get("/my-logo", auth, userController.getMyTeamLogo);
router.get("/my-avatar", auth, userController.getMyAvatar);

module.exports = router;