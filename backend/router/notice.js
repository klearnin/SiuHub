const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice");


// 创建公告
router.post('/create', noticeController.createNotice)

// 获取公告列表
router.get('/list', noticeController.getNotices)

// 删除公告
router.delete('/:id', noticeController.deleteNotice)

module.exports = router;
