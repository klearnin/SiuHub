const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 使用字段名区分头像/队徽上传位置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetPath;

    // 判断上传字段名
    if (file.fieldname === "logo") {
      targetPath = path.resolve(__dirname, "../public/team-logos");
    } else if (file.fieldname === "avatar") {
      targetPath = path.resolve(__dirname, "../public/avatars");
    } else {
      targetPath = path.resolve(__dirname, "../public/uploads");
    }

    // 如果目录不存在就创建
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true }); // 支持多级创建
    }

    cb(null, targetPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

module.exports = upload;
