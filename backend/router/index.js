const express = require('express')
const router = express.Router()
router.use('/auth', require('./auth'))
router.use('/user', require('./user'))
router.use('/coach', require('./coach'))

const noticeRouter=require("./notice");
router.use("/notice",noticeRouter);

const scheduleRouter = require('./schedule');
router.use('/schedule', scheduleRouter);

router.use("/forum", require("./forum"));
router.use("/match", require("./match"));
router.use("/honor", require("./honor"));
router.use("/finance", require("./finance"));
router.use("/tactics", require("./tactics"));
router.use("/team", require("./team"));
router.use("/player", require("./player"));
router.use("/injury", require("./injury"));

module.exports = router