const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule');
const auth = require("../middleware/auth"); 

router.post('/training', auth, scheduleController.createTrainingSchedule);
router.post('/match', auth, scheduleController.createMatchSchedule);
router.post('/else', auth, scheduleController.createElseSchedule);
router.get('/list', auth, scheduleController.getScheduleByDate);
router.get('/past/:id', scheduleController.getMatchEvents);
router.delete('/:id', auth, scheduleController.deleteSchedule);
router.get('/schedule/:id', auth, scheduleController.getScheduleById)
router.put('/schedule/:id', scheduleController.updateSchedule);


module.exports = router;
