const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const videoController = require('../controllers/video');
const upload = require('../middleware/uploadvideo'); // multer封装单独抽出来

// 上传视频（需要登录验证）
router.post('/upload', auth, upload.single('video'), videoController.uploadVideo);

// 获取视频列表
router.get('/list', auth, videoController.getVideoList);

// 删除视频
router.delete('/:id', auth, videoController.deleteVideo);

// 模糊搜索视频（按标题）
router.get('/search', auth, videoController.searchVideos);
module.exports = router;
