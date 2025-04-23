const express = require("express");
const router = express.Router();
const teamController = require("../controllers/team");
const auth = require("../middleware/auth");

router.get("/my-logo", auth, teamController.getMyTeamLogo);

module.exports = router;