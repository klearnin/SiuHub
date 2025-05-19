const express = require('express');
const router = express.Router();
const tacticsController = require('../controllers/tactics');
const auth = require("../middleware/auth"); 

router.get('/list', auth,tacticsController.getplayerlist);
router.post('/create',auth,tacticsController.createTactic);
router.get('/tlist', auth,tacticsController.getTactic);
router.delete('/:id', auth, tacticsController.deleteTactic);
router.put('/:id', auth, tacticsController.updateTactic);

module.exports = router;
