const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player');
const auth = require("../middleware/auth"); 

router.get('/list', auth,playerController.getuserlist);
router.put('/:id', auth, playerController.updateplayer);
router.delete('/:id', auth, playerController.deleteuser);
router.put('/transfer/:id', auth, playerController.transferCoach);
router.get('/stats', auth, playerController.getPlayerStats);

module.exports = router;
