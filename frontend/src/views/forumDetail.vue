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
              <img
                :src="post.liked ? '/picture/full.png' : '/picture/empty.png'"
                alt="like"
                style="width: 20px; height: 20px; margin-right: 6px;"
              />
              {{ post.like_count }}
            </el-button>
          </div>
          <div class="post-content">{{ post.content }}</div>
          <!-- ✅ 图片展示区（与 forum.vue 同款） -->
        <div
          v-if="post.images && post.images.length"
          class="post-images-grid"
          :class="`count-${post.images.length}`"
        >
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="resolveImg(img)"
            :preview-src-list="post.images.map(resolveImg)"
            :initial-index="idx"
            :fit="imgFit(post)"
            :lazy="false"
            class="post-image"
            preview-teleported
            hide-on-click-modal
            @click.stop
            :style="post.images.length === 1 ? 'max-height: 60vh' : ''"
          />
        </div>

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
                <img
                  :src="comment.liked ? '/picture/full.png' : '/picture/empty.png'"
                  alt="like"
                  style="width: 20px; height: 20px; margin-right: 6px;"
                />
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
                <!-- 回复点赞图标 -->
                <span class="reply-like" @click="likeReply(reply.id)">
                  <img
                    :src="reply.liked ? '/picture/full.png' : '/picture/empty.png'"
                    alt="like"
                    style="width: 16px; height: 16px; margin-right: 4px;"
                  />
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
        const res = await axios.get("http://localhost:5000/api/forum/posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const postId = this.$route.params.id;
        this.post = res.data.data.find((p) => p.id == postId) || {};

        if (this.post && typeof this.post.images === 'string') {
          try { this.post.images = JSON.parse(this.post.images) } catch (e) { this.post.images = [] }
        }
      },

      // ✅ 跟 forum.vue 保持一致
      resolveImg(path) {
        if (!path) return '';
        return path.startsWith('http') ? path : `http://localhost:5000${path}`;
      },
      imgFit(post) {
        // 单图“完整显示”(contain)；多图网格铺满(cover)
        return (post?.images?.length === 1) ? 'contain' : 'cover';
      },

      async fetchComments() {
        const res = await axios.get("http://localhost:5000/api/forum/comments", {
          params: { post_id: this.$route.params.id },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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

  /* ======= 帖子内图片网格（与 forum.vue 同步） ======= */
/* 三列网格（与主页一致时可改成一样的列数） */
.post-images-grid {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  grid-template-columns: repeat(3, 1fr);
}
/* 单图按 1 列展示：想让单图也三列可改成 repeat(3, 1fr) */
.post-images-grid.count-1 { grid-template-columns: 1fr; }

/* 只在多图时 -> 正方形小卡片 */
.post-images-grid:not(.count-1) .post-image { 
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f6f6f6;
}

/* 多图时内部图片铺满小卡片 */
:deep(.post-images-grid:not(.count-1) .post-image .el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

  .post-image {
    width: 100%;
    border-radius: 8px;
  }
  </style>
  