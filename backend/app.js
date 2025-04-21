const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const router = require('./router'); // 总路由
const errorHandler = require('./middleware/error-handler');

app.use(cors()); // ✅ 放在所有 app.use 和 app.get/post 之前
app.use(express.urlencoded({ extended: false }));
const authRoutes = require("./router/auth");
app.use("/api/auth", authRoutes);

// 允许跨域请求
// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));


// ✅ 跨域中间件
const allowCors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Access-Token,Appid,Secret,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};
app.use(allowCors);

// ✅ JSON 解析中间件
app.use(express.json());

// ✅ 静态资源访问（如图片、PDF）
app.use("/public", express.static(path.join(__dirname, "public")));

// ✅ 路由挂载
app.use("/api", router);

// ✅ 错误处理（放最后）
app.use(errorHandler());

// ✅ 启动服务
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SiuHub 后端服务已启动，端口号为 ${PORT}`);
});