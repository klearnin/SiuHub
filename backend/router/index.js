const express = require("express");
const router = express.Router();

const userRouter = require("./user");
router.use("/user", userRouter);

const noticeRouter=require("./notice");
router.use("/notice",noticeRouter);

module.exports = router;
