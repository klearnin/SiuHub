const express = require('express');
const router = express.Router();
const tacticsController = require('../controllers/tactics');
const auth = require("../middleware/auth"); 

router.get('/list', auth,tacticsController.getplayerlist);

module.exports = router;
