const express = require('express');
const router = express.Router();
const injuryController = require('../controllers/injury');
const auth = require('../middleware/auth');

// 获取球队所有球员的基本信息和健康状态
router.get('/players-with-health', auth, injuryController.getTeamPlayersWithHealth);

// 获取某个球员的个人信息
router.get('/player/:id', injuryController.getPlayerProfile);

// 获取某个球员的全部伤病记录
router.get('/history/:player_id', injuryController.getPlayerInjuries);

// 新增伤病信息
router.post('/add', injuryController.addInjury);

// 修改某条伤病信息
router.put('/update/:id', injuryController.updateInjury);

// 删除某条伤病记录
router.delete('/delete/:id', injuryController.deleteInjury);

// 一键恢复健康
router.patch("/recover/:player_id", injuryController.markPlayerAsRecovered);

module.exports = router;
