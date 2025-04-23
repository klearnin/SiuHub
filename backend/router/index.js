const express = require('express')
const router = express.Router()
router.use('/auth', require('./auth'))
router.use('/user', require('./user'))
router.use('/coach', require('./coach'))

module.exports = router