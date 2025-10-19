const db = require("../database");
const fs = require("fs");
const crypto = require("crypto");

// 创建帖子（已去除 title）
exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const user_id = req.user.id;

    let imagePaths = [];

    // ✅ 将上传的 buffer 存入 public/forum-images 文件夹
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = crypto.randomUUID() + ext;
        const savePath = path.join(__dirname, "../public/forum-images", filename);

        // 写入本地
        fs.writeFileSync(savePath, file.buffer);

        imagePaths.push("/public/forum-images/" + filename);
      }
    }

    await db.startQuery(`
      INSERT INTO forum_posts (user_id, content, images, created_at)
      VALUES (?, ?, ?, NOW())
    `, [user_id, content, JSON.stringify(imagePaths)]);

    res.json({ code: 0, msg: "发帖成功" });
  } catch (err) {
    next(err);
  }
};


// 获取帖子列表及前三条高赞评论
exports.getPosts = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const posts = await db.startQuery(`
      SELECT p.*, u.name AS screen_name, u.avatar,
        (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) AS comment_count
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    let likedSet = new Set();
    if (user_id) {
      const likedRows = await db.startQuery(
        `SELECT post_id FROM forum_post_likes WHERE user_id = ?`,
        [user_id]
      );
      likedSet = new Set(likedRows.map(row => row.post_id));
    }

    for (const post of posts) {
      post.liked = user_id ? likedSet.has(post.id) : false;

      post.images = post.images ? JSON.parse(post.images) : [];

      const topComments = await db.startQuery(`
        SELECT c.*, u.name AS screen_name, u.avatar,
          (SELECT COUNT(*) FROM forum_comment_likes WHERE comment_id = c.id) AS like_count
        FROM forum_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY like_count DESC, c.created_at ASC
        LIMIT 3
      `, [post.id]);

      post.topComments = topComments;
    }

    res.json({ code: 0, msg: "获取成功", data: posts });
  } catch (err) {
    next(err);
  }
};


// 点赞或取消点赞帖子
exports.likePost = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { post_id } = req.body;

    const exists = await db.startQuery(
      "SELECT * FROM forum_post_likes WHERE user_id = ? AND post_id = ?",
      [user_id, post_id]
    );

    if (exists.length > 0) {
      await db.startQuery(
        "DELETE FROM forum_post_likes WHERE user_id = ? AND post_id = ?",
        [user_id, post_id]
      );
      return res.json({ code: 0, msg: "取消点赞成功" });
    }

    await db.startQuery(
      "INSERT INTO forum_post_likes (user_id, post_id, liked_at) VALUES (?, ?, NOW())",
      [user_id, post_id]
    );

    res.json({ code: 0, msg: "点赞成功" });
  } catch (err) {
    next(err);
  }
};

// 创建评论
exports.createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body;
    const user_id = req.user.id;

    await db.startQuery(`
      INSERT INTO forum_comments (post_id, user_id, content, created_at)
      VALUES (?, ?, ?, NOW())
    `, [post_id, user_id, content]);

    res.json({ code: 0, msg: "评论成功" });
  } catch (err) {
    next(err);
  }
};

// 点赞或取消点赞评论
exports.likeComment = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { comment_id } = req.body;

    const exists = await db.startQuery(
      "SELECT * FROM forum_comment_likes WHERE user_id = ? AND comment_id = ?",
      [user_id, comment_id]
    );

    if (exists.length > 0) {
      await db.startQuery(
        "DELETE FROM forum_comment_likes WHERE user_id = ? AND comment_id = ?",
        [user_id, comment_id]
      );
      return res.json({ code: 0, msg: "取消点赞成功" });
    }

    await db.startQuery(
      "INSERT INTO forum_comment_likes (user_id, comment_id, liked_at) VALUES (?, ?, NOW())",
      [user_id, comment_id]
    );

    res.json({ code: 0, msg: "点赞成功" });
  } catch (err) {
    next(err);
  }
};

// 点赞或取消点赞回复
exports.likeReply = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { reply_id } = req.body;

    const exists = await db.startQuery(
      "SELECT * FROM forum_reply_likes WHERE user_id = ? AND reply_id = ?",
      [user_id, reply_id]
    );

    if (exists.length > 0) {
      await db.startQuery(
        "DELETE FROM forum_reply_likes WHERE user_id = ? AND reply_id = ?",
        [user_id, reply_id]
      );
      return res.json({ code: 0, msg: "取消点赞成功" });
    }

    await db.startQuery(
      "INSERT INTO forum_reply_likes (user_id, reply_id, liked_at) VALUES (?, ?, NOW())",
      [user_id, reply_id]
    );

    res.json({ code: 0, msg: "点赞成功" });
  } catch (err) {
    next(err);
  }
};

// 回复评论
exports.replyToComment = async (req, res, next) => {
  try {
    const { comment_id, content } = req.body;
    const user_id = req.user.id;

    await db.startQuery(`
      INSERT INTO forum_comment_replies (comment_id, user_id, content, created_at)
      VALUES (?, ?, ?, NOW())
    `, [comment_id, user_id, content]);

    res.json({ code: 0, msg: "回复成功" });
  } catch (err) {
    next(err);
  }
};

// 获取帖子评论及其回复，评论按点赞数/时间排序（时间为最新的在最前面）
exports.getCommentsWithReplies = async (req, res, next) => {
  try {
    const { post_id } = req.query;
    const user_id = req.user.id;

    // 查询当前用户点赞过的评论和回复
    let likedComments = new Set();
    let likedReplies = new Set();
    if (user_id) {
      const commentLikes = await db.startQuery(`SELECT comment_id FROM forum_comment_likes WHERE user_id = ?`, [user_id]);
      const replyLikes = await db.startQuery(`SELECT reply_id FROM forum_reply_likes WHERE user_id = ?`, [user_id]);
      likedComments = new Set(commentLikes.map(row => row.comment_id));
      likedReplies = new Set(replyLikes.map(row => row.reply_id));
    }

    const hotComments = await db.startQuery(`
      SELECT c.*, u.name AS screen_name, u.avatar,
        (SELECT COUNT(*) FROM forum_comment_likes WHERE comment_id = c.id) AS like_count
      FROM forum_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY like_count DESC, c.created_at ASC
    `, [post_id]);

    const latestComments = await db.startQuery(`
      SELECT c.*, u.name AS screen_name, u.avatar,
        (SELECT COUNT(*) FROM forum_comment_likes WHERE comment_id = c.id) AS like_count
      FROM forum_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [post_id]);

    const addRepliesToComments = async (commentList) => {
      for (const comment of commentList) {
        comment.liked = likedComments.has(comment.id); // ✅ 评论点赞状态
        const replies = await db.startQuery(`
          SELECT r.*, u.name AS screen_name, u.avatar,
            (SELECT COUNT(*) FROM forum_reply_likes WHERE reply_id = r.id) AS like_count
          FROM forum_comment_replies r
          JOIN users u ON r.user_id = u.id
          WHERE r.comment_id = ?
          ORDER BY like_count DESC, r.created_at ASC
        `, [comment.id]);
        for (const reply of replies) {
          reply.liked = likedReplies.has(reply.id); // ✅ 回复点赞状态
        }
        comment.replies = replies;
      }
    };

    await addRepliesToComments(hotComments);
    await addRepliesToComments(latestComments);

    res.json({
      code: 0,
      msg: "评论获取成功",
      data: {
        hotComments,
        latestComments
      }
    });
  } catch (err) {
    next(err);
  }
};

