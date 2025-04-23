const express = require("express");
const router = express.Router();
const coachController = require("../controllers/coach");
const auth = require("../middleware/auth");

router.get("/my-invite-code", auth, coachController.getMyInviteCode);
router.post("/update-invite-code", auth, coachController.updateMyInviteCode); 

module.exports = router;