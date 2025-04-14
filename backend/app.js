const express = require("express");
const app = express();
const path = require('path');
const router = require('./router'); // 总路由
const errorHandler = require('./middleware/error-handler');
const cors = require("cors");



// 配置 CORS（允许前端域名、指定方法、允许 Content-Type 头）
app.use(
  cors({
    origin: "http://localhost:5173", // 前端地址
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 允许的 HTTP 方法
    allowedHeaders: ["Content-Type"], // 允许的请求头
  })
);

// ✅ JSON 解析中间件
app.use(express.json());

// ✅ 静态资源访问（如图片、PDF）
app.use("/file", express.static(path.join(__dirname, "public")));

// ✅ 路由挂载
app.use("/api", router);

// ✅ 错误处理（放最后）
app.use(errorHandler());

// ✅ 启动服务
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SiuHub 后端服务已启动，端口号为 ${PORT}`);
  printRoutes(app);
});

app.use((req, res) => {
  res.status(404).send(`路径 ${req.originalUrl} 没有对应的接口`)
})

const listEndpoints = require('express-list-endpoints');

function printRoutes(app) {
  console.log('📋 已注册路由列表：');
  const routes = listEndpoints(app);

  routes.forEach((route) => {
    const methods = route.methods.join(', ');
    console.log(`[路由] ${methods} ${route.path}`);
  });
}
