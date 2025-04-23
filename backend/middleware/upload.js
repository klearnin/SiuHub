const multer = require("multer");
const path = require("path");

// 使用字段名区分头像/队徽上传位置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 判断上传字段名
    if (file.fieldname === "logo") {
      cb(null, path.resolve(__dirname, "../public/team-logos"));
    } else if (file.fieldname === "avatar") {
      cb(null, path.resolve(__dirname, "../public/avatars"));
    } else {
      cb(null, path.resolve(__dirname, "../public/uploads"));
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

module.exports = upload;