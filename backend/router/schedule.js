const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule');

router.post('/training', scheduleController.createTrainingSchedule);
router.post('/match', scheduleController.createMatchSchedule);
router.get('/list', scheduleController.getScheduleByDate);
router.get('/past/:id', scheduleController.getMatchEvents);
router.delete('/:id', scheduleController.deleteSchedule);
router.get('/training/:id', scheduleController.getScheduleById)


module.exports = router;
