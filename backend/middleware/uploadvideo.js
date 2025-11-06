const multer = require('multer');
const path = require('path');

// 视频存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/videos'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件类型和大小限制
const uploadvideo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mkv', 'video/avi'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('仅支持上传视频文件'));
    }
    cb(null, true);
  }
});

module.exports = uploadvideo;
