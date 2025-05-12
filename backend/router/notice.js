const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice");
const auth = require("../middleware/auth"); 

// 创建公告
router.post('/create', auth, noticeController.createNotice);

// 获取公告列表
router.get('/list', auth, noticeController.getNotices);

// 删除公告
router.delete('/:id', auth, noticeController.deleteNotice);

module.exports = router;
