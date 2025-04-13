const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");

router.get("/list", userController.getAllUsers);

// 创建公告
router.post('/create', userController.createNotice)

// 获取公告列表
router.get('/list', userController.getNotices)

// 删除公告
router.delete('/:id', userController.deleteNotice)

module.exports = router;
