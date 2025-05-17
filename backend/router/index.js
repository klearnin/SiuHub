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


module.exports = router