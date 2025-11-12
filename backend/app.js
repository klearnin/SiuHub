// app.js —— 在旧版基础上的最小增补版
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const router = require('./router'); // 总路由
const errorHandler = require('./middleware/error-handler');
const fs = require("fs");
const openaiService = require('./services/openaiService');
const listEndpoints = require('express-list-endpoints');

// ① 确保静态资源目录存在（新增 videos）
const folders = ["public/avatars", "public/team-logos", "public/forum-images", "public/videos"];
folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// 初始化AI分析表
async function initializeApp() {
  try {
    // 创建AI分析结果表
    await openaiService.initAiAnalysisTable();
    console.log('✅ AI分析表初始化成功');
  } catch (error) {
    console.error('⚠️ AI分析表初始化失败:', error);
  }
}

// ② 请求体解析（调大上限，保留你原来的解析顺序与风格）
app.use(express.json({ limit: '2500mb' }));                 // 原先是默认，按你需求调大
app.use(express.urlencoded({ extended: true, limit: '2500mb' }));

// ③ CORS：保留你原来“先 app.use(cors()) 再自定义 allowCors”的结构
//    只做必要补充：允许 PATCH、OPTIONS，并加一个统一的 OPTIONS 预检快速返回
app.use(cors()); // 仍然放在最前

// 你的 auth 路由（保持不变）
const authRoutes = require("./router/auth");
app.use("/api/auth", authRoutes);

// 自定义跨域中间件（保留，但补充 PATCH/OPTIONS，并允许常用请求头）
const allowCors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  // ✅ 补上 PATCH 与 OPTIONS
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Access-Token,Appid,Secret,Authorization,X-Requested-With,Content-Length');
  res.header('Access-Control-Allow-Credentials', 'true');
  // ✅ 预检快速返回，避免进入后续中间件造成 405/鉴权误拦
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
app.use(allowCors);

// ④ 静态资源（支持视频，设置缓存），其余保持你的风格
app.use("/public", express.static(path.join(__dirname, "public"), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4') || filePath.endsWith('.avi') || filePath.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// ⑤ 业务路由（保持不变）
app.use("/api", router);

// ⑥ 健康检查（新增）
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.use(errorHandler());

app.use((req, res) => {
  res.status(404).send(`路径 ${req.originalUrl} 没有对应的接口`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`SiuHub 后端服务已启动，端口号为 ${PORT}`);
  
  // 初始化应用
  await initializeApp();
  
  printRoutes(app);
});

function printRoutes(app) {
  console.log('📋 已注册路由列表：');
  const routes = listEndpoints(app);
  routes.forEach((route) => {
    const methods = route.methods.join(', ');
    console.log(`[路由] ${methods} ${route.path}`);
  });
}

module.exports = app;
