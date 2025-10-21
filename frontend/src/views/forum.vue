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
              <el-upload
                class="post-uploader"
                list-type="picture-card"
                :auto-upload="false"
                :show-file-list="true"
                :file-list="fileList"
                :limit="maxImages"
                :accept="accept"
                :disabled="fileList.length >= maxImages"
                @change="handleFileChange"
                @remove="handleRemove"
                @preview="handlePreview"
                :preview-teleported="true"
                action="#"
                :http-request="() => {}"
              >
                <el-dialog v-model="previewVisible" width="60%">
                  <img :src="previewUrl" style="width:100%;height:auto;display:block;object-fit:contain;" />
                </el-dialog>
              </el-upload>
              <!-- 你的“格式说明 + 发布按钮”等，放在上传区域下面，不要绝对定位在上面 -->
              <div class="uploader-footer">
                <span class="upload-hint">支持 .png .jpg .jpeg .webp；最多 9 张，单张 ≤ 5MB</span>
                <el-button type="primary" @click="submitPost">发布帖子</el-button>
              </div>            
          </div>
  
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

                <!-- ✅ 图片展示区 -->
                <div v-if="post.images && post.images.length" class="post-images-grid" :class="`count-${post.images.length}`">
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
  import { Pointer, Plus } from '@element-plus/icons-vue';

  export default {
    name: "ForumBoard",
    components: {
      Pointer, Plus
    },    
    data() {
      return {
        posts: [],
        displayedPosts: [],
        sortMode: 'time',     // 'time' | 'random'
        newPostContent: "",

        // Element Plus 的文件列表（仅作选择与预览，不自动上传）
        fileList: [],

        posting: false,       // 发帖中防重复提交
        maxImages: 9,         // 最多 9 张
        maxSizeMB: 5,         // 单张最大 5MB
        accept: '.png,.jpg,.jpeg,.webp',

        previewVisible: false,
        previewUrl: '',
      };
    },
    methods: {
        beforeUpload(file) {
        // 类型校验
        const okType = /\.(png|jpg|jpeg|webp)$/i.test(file.name);
        if (!okType) {
          ElMessage.warning('仅支持 PNG/JPG/JPEG/WEBP 格式');
          return false; // 阻止加入队列
        }
        // 大小校验
        const okSize = file.size / 1024 / 1024 <= this.maxSizeMB;
        if (!okSize) {
          ElMessage.warning(`单张图片不能超过 ${this.maxSizeMB}MB`);
          return false;
        }
        return true; // 允许加入队列
      },

      handleFileChange(uploadFile, uploadFiles) {
        if (uploadFile?.raw && /image\/(png|jpe?g|webp)/i.test(uploadFile.raw.type)) {
          if (!uploadFile.url) uploadFile.url = URL.createObjectURL(uploadFile.raw)
          uploadFile.status = 'success'
          if (!uploadFile.name) uploadFile.name = uploadFile.raw.name || 'image'
        }
        this.fileList = uploadFiles.slice(0, this.maxImages)
      },
      
      handlePreview(file) {
        console.log('preview', file)
        const url = file?.url || (file?.raw ? URL.createObjectURL(file.raw) : '')
        if (!url) return
        this.previewUrl = url
        this.previewVisible = true
      },

      handleRemove(file, files) {
        this.fileList = files
      },
    
      resolveImg(path) {
        if (!path) return '';
        return path.startsWith('http') ? path : `http://localhost:5000${path}`;
      },

      imgFit(post) {
        // 单图：不裁切、完整显示；多图：你想要不裁切就也用 'contain'
        return (post?.images?.length === 1) ? 'contain' : 'cover'; // 或 'cover'
      },

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
        if (!this.newPostContent.trim() && this.fileList.length === 0) {
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
  
          const fd = new FormData();
          fd.append('content', this.newPostContent || '');
  
          // ✅ 关键：字段名必须是 "images"，与后端 upload.array("images", 9) 一致
          for (const f of this.fileList) {
            fd.append('images', f.raw);
          }
  
          const res = await axios.post(
            "http://localhost:5000/api/forum/post",
            // { content: this.newPostContent },
            fd,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
  
          if (res.data.code === 0) {
            ElMessage.success("发布成功");
            this.newPostContent = "";
            this.fileList = [];              // ✅ 受控清空即可
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

  /* ======= 排序条 ======= */
  .sort-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 12px 0;
    gap: 10px;
  }
  .sort-bar :deep(.el-radio-button__inner) {
    font-size: 16px;
    font-weight: 500;
    padding: 6px 14px;
  }
  .sort-bar :deep(.el-button.is-link) {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-color-primary, #409EFF);
    transition: all 0.2s;
  }
  .sort-bar :deep(.el-button.is-link:hover) {
    transform: scale(1.05);
    color: var(--el-color-primary-light-3, #66b1ff);
  }

  /* ======= 上传区 ======= */
  .post-uploader {
    margin-top: 8px;
    position: relative;
    overflow: visible; /* 避免把加号或预览层裁掉 */
  }

  /* 统一卡片与“加号”尺寸，并保证可见性 */
  :deep(.el-upload-list--picture-card) {
    --el-upload-list-picture-card-size: 148px;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
  }
  :deep(.el-upload--picture-card) {
    width: var(--el-upload-list-picture-card-size);
    height: var(--el-upload-list-picture-card-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: var(--el-upload-list-picture-card-size);
    height: var(--el-upload-list-picture-card-size);
  }

  /* 兜底：把操作按钮层的点击开启 & 提高层级，防遮挡 */
  :deep(.el-upload-list__item) { position: relative; }
  :deep(.el-upload-list__item-actions) {
    pointer-events: auto;
    z-index: 5;
  }

  /* 提示语与发布按钮在上传区下方的行内布局 */
  .uploader-footer {
    display: flex;
    justify-content: space-between;   /* 左文字右按钮 */
    align-items: center;
    margin-top: 8px;
    gap: 12px;
  }

  /* 提示文案：变小 + 变灰 */
  .upload-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
    line-height: 1.2;
    white-space: nowrap;       /* 不换行；需要自动换行可删 */
    user-select: none;
    margin-top: 4px;
  }

  /* 若你曾让 .el-upload__tip 绝对定位，会挡点击，这里强制回流布局 */
  :deep(.el-upload__tip) {
    position: static !important;
    pointer-events: none;
  }
  
  /* ======= 帖子内图片网格 ======= */
  .post-images-grid {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    grid-template-columns: repeat(3, 1fr);
  }
  .post-images-grid.count-1 { grid-template-columns: 1fr; }

  .post-image {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: #f6f6f6;
  }

  .post-images-grid.count-2,
  .post-images-grid.count-3,
  .post-images-grid:not(.count-1) {
    grid-template-columns: repeat(3, 1fr);
  }
  .post-images-grid:not(.count-1) .post-image { aspect-ratio: 1 / 1; }
  :deep(.post-images-grid:not(.count-1) .post-image .el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: cover;   /* 多图时铺满格子 */
  }
  </style>
  