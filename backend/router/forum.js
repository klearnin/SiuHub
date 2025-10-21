const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const forumController = require("../controllers/forum");

// 帖子相关
router.post("/post", auth, upload.array("images", 9), forumController.createPost); // 创建帖子
router.get("/posts", auth, forumController.getPosts); // 获取帖子列表及前三高赞评论
router.post("/post/like", auth, forumController.likePost); // 点赞或取消点赞帖子

// 评论相关
router.post("/comment", auth, forumController.createComment); // 创建评论
router.post("/comment/like", auth, forumController.likeComment); // 点赞或取消点赞评论
router.post("/comment/reply", auth, forumController.replyToComment); // 回复评论
router.post("/reply/like", auth, forumController.likeReply); // 点赞或取消点赞回复
router.get("/comments", auth, forumController.getCommentsWithReplies); // 获取评论及其回复（含头像、点赞数）

module.exports = router;
