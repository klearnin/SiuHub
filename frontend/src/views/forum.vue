<template>
    <div class="forum-container">
      <div class="forum-header">
        <el-button type="primary" plain @click="$router.back()" class="back-btn">返回</el-button>
        <h2 class="board-title">球迷论坛</h2>
      </div>
  
      <div class="forum-board">
        <div class="new-post">
          <el-input v-model="newPostContent" type="textarea" placeholder="分享你的看法..." :rows="3" />
          <el-button type="primary" @click="submitPost" :disabled="!newPostContent">发布帖子</el-button>
        </div>
  
        <div class="post-list">
          <el-card v-for="post in posts" :key="post.id" class="post-card" shadow="hover">
            <div class="post-header">
              <img :src="getAvatar(post.avatar)" class="avatar" @error="setDefaultAvatar($event)" />
              <div class="info">
                <div class="nickname">{{ post.screen_name }}</div>
                <div class="timestamp">{{ formatDate(post.created_at) }}</div>
              </div>
              <el-button
                class="like-btn"
                type="text"
                @click="toggleLike(post)"
              >
                👍 {{ post.like_count }}
              </el-button>
            </div>
            <div class="post-content" @click="goToPostDetail(post.id)">
              {{ post.content }}
            </div>
            <div class="top-comments" v-if="post.topComments.length">
              <div class="top-comment" v-for="comment in post.topComments" :key="comment.id">
                <span class="comment-author">{{ comment.screen_name }}：</span>
                {{ comment.content }}（👍{{ comment.like_count }}）
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import { ElMessage, ElMessageBox } from "element-plus";
  
  export default {
    name: "ForumBoard",
    data() {
      return {
        posts: [],
        newPostContent: "",
      };
    },
    methods: {
      async fetchPosts() {
        try {
          const res = await axios.get("http://localhost:5000/api/forum/posts");
          this.posts = res.data.data;
        } catch (err) {
          ElMessage.error("帖子加载失败");
        }
      },
      async submitPost() {
        if (!this.newPostContent.trim()) {
          ElMessage.warning("请输入内容");
          return;
        }
  
        try {
          await ElMessageBox.confirm(
            '确认要发布该帖子吗？',
            '提示',
            {
              confirmButtonText: '确认发布',
              cancelButtonText: '取消',
              type: 'info',
            }
          );
  
          const res = await axios.post(
            "http://localhost:5000/api/forum/post",
            { content: this.newPostContent },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
  
          if (res.data.code === 0) {
            ElMessage.success("发布成功");
            this.newPostContent = "";
            this.fetchPosts();
          } else {
            ElMessage.error("发布失败");
          }
        } catch (err) {
          if (err !== 'cancel') {
            console.error("发布失败：", err);
            ElMessage.error("发布失败");
          } else {
            ElMessage.info("已取消发布");
          }
        }
      },
      async toggleLike(post) {
        try {
          await axios.post(
            "http://localhost:5000/api/forum/post/like",
            { post_id: post.id },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          this.fetchPosts();
        } catch {
          ElMessage.error("点赞失败");
        }
      },
      goToPostDetail(id) {
        this.$router.push(`/forum/${id}`);
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
    mounted() {
      this.fetchPosts();
    },
  };
  </script>
  
  <style scoped>
  .forum-container {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .forum-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 20px;
  }
  
  .back-btn {
    position: absolute;
    left: 0;
  }
  
  .board-title {
    font-size: 32px;
    font-weight: bold;
    margin: 0;
  }
  
  .new-post {
    margin-bottom: 30px;
  }
  
  .post-list {
    display: grid;
    gap: 20px;
  }
  
  .post-card {
    cursor: pointer;
    transition: box-shadow 0.3s;
  }
  
  .post-header {
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
    font-size: 14px;
    color: #f56c6c;
  }
  
  .post-content {
    margin: 10px 0;
    font-size: 16px;
  }
  
  .top-comments {
    margin-top: 10px;
    font-size: 14px;
    color: #555;
  }
  </style>
  