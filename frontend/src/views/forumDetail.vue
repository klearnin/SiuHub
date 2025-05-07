<template>
    <div>
      <div class="forum-header">
        <el-button type="primary" plain @click="$router.back()" class="back-button">返回</el-button>
        <h2 class="forum-title">帖子详情</h2>
      </div>
  
      <div class="forum-detail">
        <el-card class="post-card" shadow="hover">
          <div class="post-header">
            <img :src="getAvatar(post.avatar)" class="avatar" @error="setDefaultAvatar($event)" />
            <div class="info">
              <div class="nickname">{{ post.screen_name }}</div>
              <div class="timestamp">{{ formatDate(post.created_at) }}</div>
            </div>
            <el-button type="text" class="like-btn" @click="likePost">
              <el-icon :style="{ color: post.liked ? '#f56c6c' : '#999', fontSize: '18px', marginRight: '4px' }">
                <Pointer />
              </el-icon>
              {{ post.like_count }}
            </el-button>
          </div>
          <div class="post-content">{{ post.content }}</div>
        </el-card>
  
        <div class="comment-section">
          <div class="comment-toolbar">
            <el-radio-group v-model="sortType" @change="fetchComments">
              <el-radio-button label="hot">按热度</el-radio-button>
              <el-radio-button label="latest">按时间</el-radio-button>
            </el-radio-group>
          </div>
  
          <div class="new-comment">
            <el-input
              v-model="newComment"
              type="textarea"
              placeholder="写下你的评论..."
              :rows="3"
            />
            <el-button type="primary" @click="submitComment">发表评论</el-button>
          </div>
          <br>
  
          <el-card v-for="comment in comments" :key="comment.id" class="comment-card">
            <div class="comment-header">
              <img :src="getAvatar(comment.avatar)" class="avatar" @error="setDefaultAvatar($event)" />
              <div class="info">
                <div class="nickname">{{ comment.screen_name }}</div>
                <div class="timestamp">{{ formatDate(comment.created_at) }}</div>
              </div>
              <el-button type="text" class="like-btn" @click="likeComment(comment.id)">
                <el-icon :style="{ color: comment.liked ? '#f56c6c' : '#999', fontSize: '18px', marginRight: '4px' }">
                  <Pointer />
                </el-icon>
                {{ comment.like_count }}
              </el-button>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
  
            <div class="reply-box">
              <el-input
                v-model="replyInputs[comment.id]"
                placeholder="回复内容..."
                size="small"
              />
              <el-button size="small" @click="submitReply(comment.id)">回复</el-button>
            </div>
  
            <div class="reply-list" v-if="comment.replies.length">
              <div class="reply" v-for="reply in comment.replies" :key="reply.id">
                <span class="reply-author">{{ reply.screen_name }}：</span>
                {{ reply.content }}
                <span class="reply-like" @click="likeReply(reply.id)">
                  <el-icon :style="{ color: reply.liked ? '#f56c6c' : '#999', fontSize: '14px', marginRight: '4px' }">
                    <Pointer />
                  </el-icon>
                  {{ reply.like_count }}
                </span>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import { ElMessage } from "element-plus";
  import { Pointer } from '@element-plus/icons-vue';
  
  export default {
    name: "ForumDetail",
    components: {
      Pointer
    },
    data() {
      return {
        post: {},
        comments: [],
        sortType: "hot",
        newComment: "",
        replyInputs: {},
      };
    },
    methods: {
      async fetchPost() {
        const res = await axios.get("http://localhost:5000/api/forum/posts");//, {
        //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        // });
        const postId = this.$route.params.id;
        this.post = res.data.data.find((p) => p.id == postId) || {};
      },
      async fetchComments() {
        const res = await axios.get("http://localhost:5000/api/forum/comments", {
          params: { post_id: this.$route.params.id },
          //headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
  
        const data =
          this.sortType === "hot"
            ? res.data.data.hotComments
            : res.data.data.latestComments;
  
        if (this.sortType === "latest") {
          data.forEach(comment => {
            comment.replies.sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
          });
        }
  
        this.comments = data;
      },
      async likePost() {
        await axios.post(
            "http://localhost:5000/api/forum/post/like",
            { post_id: this.post.id },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.fetchPost();
      },
      async submitComment() {
        if (!this.newComment.trim()) return;
        await axios.post(
          "http://localhost:5000/api/forum/comment",
          {
            post_id: this.post.id,
            content: this.newComment,
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.newComment = "";
        this.fetchComments();
      },
      async likeComment(commentId) {
        await axios.post(
          "http://localhost:5000/api/forum/comment/like",
          { comment_id: commentId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.fetchComments();
      },
      async likeReply(replyId) {
        await axios.post(
          "http://localhost:5000/api/forum/reply/like",
          { reply_id: replyId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.fetchComments();
},

      async submitReply(commentId) {
        const content = this.replyInputs[commentId];
        if (!content) return;
        await axios.post(
          "http://localhost:5000/api/forum/comment/reply",
          {
            comment_id: commentId,
            content,
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.replyInputs[commentId] = "";
        this.fetchComments();
      },
      formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString();
      },
      getAvatar(path) {
        if (!path) return "/default-avatar.png";
        return path.startsWith("http") ? path : `http://localhost:5000${path}`;
      },
      setDefaultAvatar(event) {
        event.target.src = "/default-avatar.png";
      },
    },
    async mounted() {
      await this.fetchPost();
      await this.fetchComments();
    },
  };
  </script>
  
  <style scoped>
  .forum-header {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    border-bottom: 1px solid #eee;
    margin-bottom: 20px;
    padding: 0 20px;
    background-color: #fff;
  }
  
  .forum-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin: 0;
  }
  
  .back-button {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .forum-detail {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .post-card {
    margin-bottom: 30px;
  }
  
  .post-header,
  .comment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  
  .info {
    flex: 1;
    margin-left: 10px;
  }
  
  .nickname {
    font-weight: bold;
  }
  
  .timestamp {
    font-size: 12px;
    color: gray;
  }
  
  .like-btn {
    display: flex;
    align-items: center;
    font-weight: bold;
  }
  
  .post-content,
  .comment-content {
    margin-top: 10px;
    font-size: 16px;
  }
  
  .comment-section {
    margin-top: 30px;
  }
  
  .comment-card {
    margin-bottom: 20px;
  }
  
  .comment-toolbar {
    text-align: right;
    margin-bottom: 20px;
  }
  
  .reply-box {
    margin-top: 10px;
    display: flex;
    gap: 10px;
  }
  
  .reply-list {
    margin-top: 10px;
    font-size: 14px;
    color: #555;
  }
  
  .reply {
    padding: 5px 0;
  }
  
  .reply-author {
    font-weight: bold;
    margin-right: 5px;
  }
  
  .reply-like {
    margin-left: 10px;
    cursor: pointer;
    color: #4b96f0;
    font-weight: bold;
  }
  </style>
  