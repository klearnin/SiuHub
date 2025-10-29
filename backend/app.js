const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const router = require('./router'); // 总路由
const errorHandler = require('./middleware/error-handler');
const fs = require("fs");

const folders = ["public/avatars", "public/team-logos", "public/videos"];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// ✅ 增加请求体大小限制 - 修复上传问题
app.use(express.json({ limit: '1000mb' })); // 增加到100MB
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));  // 增加到100MB

// ✅ CORS 配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // 添加多个可能的来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// ✅ 处理预检请求
app.options('*', cors());

// ✅ 自定义跨域中间件（备用）
const allowCors = function (req, res, next) {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Access-Token,Appid,Secret,Authorization,X-Requested-With,Content-Length');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};
app.use(allowCors);

// ✅ 静态资源访问（如图片、PDF、视频）
app.use("/public", express.static(path.join(__dirname, "public"), {
  maxAge: '1d', // 缓存1天
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4') || path.endsWith('.avi') || path.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// 使用multer进行文件上传处理（在各路由中单独使用）
console.log('✅ 文件上传配置已完成（使用multer）');

// ✅ 添加请求日志中间件（用于调试）
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('请求体大小:', req.headers['content-length'], 'bytes');
  }
  next();
});

// ✅ 路由挂载
app.use("/api", router);

// ✅ 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ✅ 错误处理（放最后）
app.use(errorHandler());

// ✅ 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    msg: `路径 ${req.originalUrl} 没有对应的接口`,
    data: null
  });
});

// ✅ 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误捕获:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      code: 413,
      msg: '文件太大，请上传小于100MB的文件',
      data: null
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      code: 413,
      msg: '文件大小超过限制',
      data: null
    });
  }
  
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    data: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// ✅ 启动服务
const PORT = process.env.PORT || 5000;

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到终止信号，正在关闭服务器...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 SiuHub 后端服务已启动，端口号为 ${PORT}`);
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  printRoutes(app);
});

// 路由打印函数
const listEndpoints = require('express-list-endpoints');

function printRoutes(app) {
  console.log('📋 已注册路由列表：');
  const routes = listEndpoints(app);

  routes.forEach((route) => {
    const methods = route.methods.join(', ');
    console.log(`[路由] ${methods} ${route.path}`);
  });
}

module.exports = app;