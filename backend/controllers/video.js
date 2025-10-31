const db = require('../database');
const path = require('path');
const fs = require('fs');

// 上传视频
exports.uploadVideo = async (req, res, next) => {
  try {
    const { title } = req.body;
    const user = req.user;
    const videoPath = `/public/videos/${req.file.filename}`;

    if (!title) {
      return res.status(400).json({ code: 1, msg: '视频标题不能为空' });
    }

    const sql = `
      INSERT INTO videos (title, file_path, uploader_id, uploader_name, team_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.startQuery(sql, [
      title,
      videoPath,
      user.id,
      user.name,
      user.team_id
    ]);

    res.json({ code: 0, msg: '视频上传成功', path: videoPath });
  } catch (err) {
    console.error('上传视频错误:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
    next(err);
  }
};

// 获取视频列表
exports.getVideoList = async (req, res, next) => {
  try {
    const user = req.user;
    const sql = `SELECT * FROM videos WHERE team_id = ? ORDER BY created_at DESC`;
    const videos = await db.startQuery(sql, [user.team_id]);

    res.json({ code: 0, msg: '获取成功', data: videos });
  } catch (err) {
    console.error('获取视频列表错误:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
    next(err);
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const user = req.user;
    const videoId = req.params.id;

    // 查找视频信息
    const [video] = await db.startQuery(`SELECT * FROM videos WHERE id = ? AND team_id = ?`, [videoId, user.team_id]);
    if (!video) {
      return res.status(404).json({ code: 1, msg: '视频不存在或不属于你的球队' });
    }

    // 删除视频文件
    const filePath = path.join(__dirname, `..${video.file_path}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await db.startQuery(`DELETE FROM videos WHERE id = ?`, [videoId]);

    res.json({ code: 0, msg: '视频删除成功' });
  } catch (err) {
    console.error('删除视频错误:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
};

// 按标题模糊查询视频
exports.searchVideos = async (req, res) => {
  try {
    const user = req.user;
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ code: 1, msg: '请输入搜索关键词' });
    }

    const sql = `
      SELECT * FROM videos
      WHERE team_id = ? AND title LIKE ?
      ORDER BY created_at DESC
    `;
    const videos = await db.startQuery(sql, [user.team_id, `%${keyword}%`]);

    res.json({ code: 0, data: videos });
  } catch (err) {
    console.error('搜索视频错误:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
};