const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player');
const auth = require("../middleware/auth"); 

router.get('/list', auth,playerController.getplayerlist);
router.put('/:id', auth, playerController.updateplayer);

module.exports = router;
