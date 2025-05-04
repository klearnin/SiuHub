const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const forumController = require("../controllers/forum");

// 帖子相关
router.post("/post", auth, forumController.createPost);
router.get("/posts", forumController.getAllPosts);
router.get("/post/:id", forumController.getPostById);
router.post("/post/:id/like", auth, forumController.likePost);

// 评论相关
router.post("/post/:id/comment", auth, forumController.addComment);
router.post("/comment/:id/like", auth, forumController.likeComment);
router.post("/comment/:id/reply", auth, forumController.replyComment);

module.exports = router;
