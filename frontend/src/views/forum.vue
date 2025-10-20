<template>
    <div class="forum-background">
      <div class="forum-container">
        <div class="forum-header">
          <el-button type="primary" plain @click="$router.back()" class="back-btn">返回</el-button>
          <h2 class="board-title">球队论坛</h2>
        </div>
  
        <div class="forum-board">
          <div class="new-post">
            <el-input v-model="newPostContent" type="textarea" placeholder="分享你的看法..." :rows="3" />
            <el-button type="primary" @click="submitPost" :disabled="!newPostContent">发布帖子</el-button>
          </div>
  
          <!-- 发表区域下方新增 -->
          <div class="sort-bar">
            <el-radio-group v-model="sortMode" size="small" @change="applySort">
              <el-radio-button label="time">按时间</el-radio-button>
              <el-radio-button label="random">随机</el-radio-button>
            </el-radio-group>
            <el-button
              v-if="sortMode==='random'"
              size="small"
              link
              @click="reshuffle"
              style="margin-left:8px;"
            >换一换</el-button>
          </div>

          <div class="post-list">
            <div
              class="click-wrapper"
              v-for="post in displayedPosts"
              :key="post.id"
              @click="goToPostDetail(post.id)"
            >
              <el-card class="post-card" shadow="hover">
                <div class="post-header">
                  <img :src="getAvatar(post.avatar)" class="avatar" @error="setDefaultAvatar($event)" />
                  <div class="info">
                    <div class="nickname">{{ post.screen_name }}</div>
                    <div class="timestamp">{{ formatDate(post.created_at) }}</div>
                  </div>
                  <el-button
                    class="like-btn"
                    type="text"
                    @click.stop="toggleLike(post)"
                  >
                    <img
                      :src="post.liked ? '/picture/full.png' : '/picture/empty.png'"
                      alt="like"
                      style="width: 20px; height: 20px; margin-right: 6px;"
                    />
                    {{ post.like_count }}
                  </el-button>
                </div>
                <div class="post-content">
                  {{ post.content }}
                </div>
                <div class="top-comments" v-if="post.topComments.length">
                  <div class="top-comment" v-for="comment in post.topComments" :key="comment.id">
                    <span class="comment-author">{{ comment.screen_name }}</span><span class="comment-colon">:</span>
                    {{ comment.content }}<!-- （👍{{ comment.like_count }}） -->
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { Pointer } from '@element-plus/icons-vue';

  export default {
    name: "ForumBoard",
    components: {
      Pointer
    },    
    data() {
      return {
        posts: [],
        displayedPosts: [],
        sortMode: 'time',     // 'time' | 'random'
        newPostContent: "",
      };
    },
    methods: {
      async fetchPosts() {
        try {
          const res = await axios.get("http://localhost:5000/api/forum/posts", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });

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
        if (!path) return "/version.png";
        return path.startsWith("http") ? path : `http://localhost:5000${path}`;
      },
      setDefaultAvatar(event) {
        event.target.src = "/version.png";
      },
      applySort() {
        if (this.sortMode === 'random') {
          this.displayedPosts = this._shuffle([...this.posts]);
        } else {
          // 时间倒序（最近在前）
          this.displayedPosts = [...this.posts].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        }
      },
      reshuffle() {
        if (this.sortMode === 'random') {
          this.displayedPosts = this._shuffle([...this.posts]);
        }
      },
      _shuffle(arr) {
        // Fisher–Yates 洗牌算法
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
    },
    mounted() {
      this.fetchPosts();
    },
    watch: {
      posts()    { this.applySort(); },
      sortMode() { this.applySort(); }
    },
  };
  </script>
  
  <style scoped>
  .forum-background {
    background-color: #f5f7fa;
    min-height: 100vh;
    width: 100%;
  }
  
  .forum-container {
    max-width: 1000px;
    margin: 0 auto;
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
  
  /* 新增：让整个卡片可点 */
  .click-wrapper {
    cursor: pointer;
  }
  
  .post-card {
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
    display: flex;
    align-items: center;
    font-weight: bold;
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

  .comment-author {
  font-weight: bold;
  font-family: "SimHei", "Microsoft YaHei", sans-serif;
  color: #333;
  }

  .top-comment {
  margin-bottom: 6px;
  }

  .sort-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 12px 0;
  }

  </style>
  