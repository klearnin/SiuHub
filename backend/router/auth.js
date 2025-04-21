const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

router.post("/login", authController.login);
router.post("/register/:type", upload.single("logo"), authController.register);
router.post("/review-join", auth, authController.reviewJoinRequest);
router.get("/pending-users", auth, authController.getPendingUsers);
router.get("/get-all-teams", authController.getAllTeams);
router.get("/teams", authController.getAllTeams);



module.exports = router;
