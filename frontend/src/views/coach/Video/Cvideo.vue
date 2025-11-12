<template>
  <div class="video-management-container">
    <!-- 页面标题和搜索 -->
    <div class="header-section">
      <h2 class="page-title">视频管理</h2>
     
      <div class="search-upload-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频标题"
          :prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />
        <el-button type="primary" @click="openUploadDialog" class="upload-btn">
          上传视频
        </el-button>
        <router-link to="/chome" class="nav-item">返回</router-link>
      </div>
    </div>

    <!-- 视频列表 -->
    <div class="video-grid">
      <div
        v-for="video in videoList"
        :key="video.id"
        class="video-card"
        @click="playVideo(video)"
      >
        <div class="video-thumbnail-container">
          <div class="video-thumbnail" :key="video.id">
            <!-- 使用视频元素的poster属性显示封面 -->
            <video 
              :src="getVideoUrl(video.file_path)" 
              :poster="getVideoThumbnail(video)" 
              class="video-poster"
              preload="metadata"
              @loadedmetadata="updateVideoInfo(video)"
            ></video>
            <div class="play-overlay">
              <div class="play-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
          </div>
          <div class="video-actions">
           
          </div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <div class="video-actions">
            <el-button
              type="primary"
              size="small"
              circle
              @click.stop="editVideoTitle(video)"
              class="edit-btn"
              title="编辑标题"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              circle
              @click.stop="deleteVideo(video.id, video.title)"
              class="delete-btn"
              title="删除视频"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div class="video-meta">
            <span class="upload-time">{{ formatDate(video.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="videoList.length === 0" class="empty-state">
      <el-empty description="暂无视频" />
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      title="上传视频"
      v-model="uploadDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="uploadForm"
        :rules="uploadRules"
        ref="uploadFormRef"
        label-width="80px"
      >
        <el-form-item label="视频标题" prop="title">
          <el-input
            v-model="uploadForm.title"
            placeholder="请输入视频标题"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item label="视频文件" prop="video">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            accept=".mp4,.avi,.mov,.wmv,.flv,.mkv"
            :multiple="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 mp4、avi、mov、wmv、flv、mkv 格式，单个文件不超过 2GB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">
            {{ uploading ? '上传中...' : '确定上传' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 视频播放对话框 -->
    <el-dialog
      title="视频播放"
      v-model="playDialogVisible"
      width="800px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <div class="video-player-container" v-if="currentVideo">
        <video
          ref="videoPlayer"
          :src="getVideoUrl(currentVideo.file_path)"
          controls
          class="video-player"
          @timeupdate="updateProgress"
          @loadedmetadata="setVideoDuration"
          @ended="videoEnded"
        >
          您的浏览器不支持HTML5视频播放。
        </video>
        <div class="video-details">
          <h3>{{ currentVideo.title }}</h3>
          <div class="video-stats">
            <span>上传时间：{{ formatDate(currentVideo.created_at) }}</span>
            <span>时长：{{ formatDuration(currentVideo.duration || videoDuration) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑标题对话框 -->
    <el-dialog
      title="编辑视频标题"
      v-model="editDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="editForm"
        :rules="uploadRules"
        ref="editFormRef"
        label-width="80px"
      >
        <el-form-item label="视频标题" prop="title">
          <el-input
            v-model="editForm.title"
            placeholder="请输入新的视频标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitEditTitle" 
            :loading="editing"
          >
            {{ editing ? '保存中...' : '确定保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { 
  UploadFilled, 
  Search, 
  VideoPlay, 
  Delete,
  Edit
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'Cvideo',
  data() {
    return {
      UploadFilled,
      Search,
      VideoPlay,
      Delete,
      videoList: [],
      searchKeyword: '',
      uploadDialogVisible: false,
      playDialogVisible: false,
      currentVideo: null,
      uploadForm: {
        title: ''
      },
      uploadRules: {
        title: [
          { required: true, message: '请输入视频标题', trigger: 'blur' },
          { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
        ]
      },
      fileList: [],
      uploading: false,
      videoDuration: 0,
      // 编辑标题相关
      editDialogVisible: false,
      editForm: {
        title: ''
      },
      editingVideo: null,
      editing: false
    };
  },
  mounted() {
    this.fetchVideoList();
  },
  watch: {
    // 监听播放对话框的显示状态
    playDialogVisible(newVal) {
      if (!newVal) {
        // 当对话框关闭时停止视频播放
        this.stopVideoPlayback();
      }
    }
  },
  methods: {
    // 停止视频播放
    stopVideoPlayback() {
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.pause();
        this.$refs.videoPlayer.currentTime = 0;
      }
    },
    // 获取视频列表
    async fetchVideoList() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/video/list', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.code === 0) {
          this.videoList = response.data.data || [];
          ElMessage.success('视频列表加载成功');
          
          // 视频列表更新后，等待DOM更新完成，然后触发视频元数据加载
          this.$nextTick(() => {
            this.initializeVideoMetadata();
          });
        } else {
          ElMessage.error(response.data.msg || '获取视频列表失败');
        }
      } catch (error) {
        console.error('获取视频列表失败:', error);
        ElMessage.error('获取视频列表失败，请检查网络连接');
      }
    },

    // 搜索视频
    async handleSearch() {
      if (!this.searchKeyword.trim()) {
        this.fetchVideoList();
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/video/search?keyword=${encodeURIComponent(this.searchKeyword)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      this.$nextTick(() => {
            this.initializeVideoMetadata();
          });
        if (response.data.code === 0) {
          this.videoList = response.data.data || [];
          if (this.videoList.length === 0) {
            ElMessage.info('未找到相关视频');
          }
          
          // 搜索结果更新后，等待DOM更新完成，然后触发视频元数据加载
          this.$nextTick(() => {
            this.initializeVideoMetadata();
          });
        } else {
          ElMessage.error(response.data.msg || '搜索失败');
        }
      } catch (error) {
        console.error('搜索视频失败:', error);
        ElMessage.error('搜索失败，请重试');
        this.fetchVideoList();
      }
    },
    
    // 初始化视频元数据
    initializeVideoMetadata() {
      // 1. 先为videoList中的每个视频初始化默认duration属性为0，避免显示undefined
      this.videoList.forEach(video => {
        if (video.duration === undefined) {
          video.duration = 0;
        }
      });
      
      // 2. 等待DOM更新后，处理视频元素的元数据加载
      setTimeout(() => {
        const videoElements = document.querySelectorAll('.video-poster');
        
        // 创建一个映射，便于通过src快速找到对应的视频对象
        const videoMap = new Map();
        this.videoList.forEach(video => {
          const videoUrl = this.getVideoUrl(video.file_path);
          videoMap.set(videoUrl, video);
        });
        
        videoElements.forEach(video => {
          if (video.src) {
            // 获取对应的视频对象
            const videoObj = videoMap.get(video.src);
            
            if (videoObj) {
              // 直接尝试从视频元素获取duration
              if (video.duration > 0) {
                videoObj.duration = video.duration;
              }
              
              // 添加额外的loadeddata事件监听，这通常在loadedmetadata之后触发
              const handleLoadedData = () => {
                if (video.duration > 0) {
                  videoObj.duration = video.duration;
                  // 移除事件监听器避免重复调用
                  video.removeEventListener('loadeddata', handleLoadedData);
                }
              };
              
              video.addEventListener('loadeddata', handleLoadedData);
              
              // 如果视频还未加载元数据，重新加载
              if (video.readyState < 1) {
                video.load();
              }
              // 即使readyState >= 1，也尝试重新加载以确保获取最新的元数据
              else {
                video.load();
              }
            }
          }
        });
      }, 200); // 增加延迟时间，确保DOM完全渲染
    },

    // 打开上传对话框
    openUploadDialog() {
      console.log('打开上传对话框');
      this.uploadForm.title = '';
      this.fileList = [];
      this.uploadDialogVisible = true;
      
      // 下次 DOM 更新后重置表单验证
      this.$nextTick(() => {
        if (this.$refs.uploadFormRef) {
          this.$refs.uploadFormRef.clearValidate();
        }
      });
    },

    // 处理文件变化
    handleFileChange(file, fileList) {
      console.log('文件选择:', file);
      
      // 文件大小验证 (2GB)
      const isLt2G = file.size / 1024 / 1024 / 1024 < 2;
      if (!isLt2G) {
        ElMessage.error('视频大小不能超过 2GB!');
        this.fileList = [];
        return;
      }

      // 文件类型验证
      const allowedTypes = [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-ms-wmv',
        'video/x-flv',
        'video/x-matroska'
      ];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        ElMessage.error('请上传视频文件! 支持格式: mp4, avi, mov, wmv, flv, mkv');
        this.fileList = [];
        return;
      }

      this.fileList = [file];
    },

    // 提交上传
    async submitUpload() {
      console.log('提交上传');
      
      // 表单验证
      try {
        const valid = await this.$refs.uploadFormRef.validate();
        if (!valid) {
          return;
        }
      } catch (error) {
        console.log('表单验证失败:', error);
        return;
      }

      // 文件验证
      if (this.fileList.length === 0) {
        ElMessage.warning('请选择视频文件');
        return;
      }

      this.uploading = true;

      try {
        const formData = new FormData();
        formData.append('title', this.uploadForm.title);
        formData.append('video', this.fileList[0].raw);

        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/api/video/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60秒超时
        });
        
        if (response.data.code === 0) {
          ElMessage.success('视频上传成功');
          this.uploadDialogVisible = false;
          this.fetchVideoList();
        } else {
          ElMessage.error(response.data.msg || '视频上传失败');
        }
      } catch (error) {
        console.error('上传视频失败:', error);
        if (error.code === 'ECONNABORTED') {
          ElMessage.error('上传超时，请重试');
        } else {
          ElMessage.error('视频上传失败');
        }
      } finally {
        this.uploading = false;
      }
    },

    // 编辑视频标题
    editVideoTitle(video) {
      console.log('编辑视频标题:', video);
      this.editingVideo = video;
      this.editForm.title = video.title;
      this.editDialogVisible = true;
      
      // 下次 DOM 更新后聚焦输入框
      this.$nextTick(() => {
        if (this.$refs.editFormRef) {
          this.$refs.editFormRef.clearValidate();
        }
      });
    },

    // 提交编辑标题
    async submitEditTitle() {
      try {
        // 表单验证
        const valid = await this.$refs.editFormRef.validate();
        if (!valid) {
          return;
        }
        
        if (!this.editingVideo) {
          ElMessage.error('未找到要编辑的视频');
          return;
        }

        this.editing = true;

        const token = localStorage.getItem('token');
        const response = await axios.put(
          `http://localhost:5000/api/video/${this.editingVideo.id}/title`,
          { title: this.editForm.title },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.code === 0) {
          ElMessage.success('视频标题修改成功');
          this.editDialogVisible = false;
          
          // 更新本地视频列表中的标题
          const videoIndex = this.videoList.findIndex(v => v.id === this.editingVideo.id);
          if (videoIndex !== -1) {
            this.videoList[videoIndex].title = this.editForm.title;
          }
          
          // 重置表单
          this.editForm.title = '';
          this.editingVideo = null;
        } else {
          ElMessage.error(response.data.msg || '修改标题失败');
        }
      } catch (error) {
        console.error('修改视频标题失败:', error);
        ElMessage.error('修改标题失败，请重试');
      } finally {
        this.editing = false;
      }
    },

    // 播放视频
    playVideo(video) {
      console.log('播放视频:', video);
      this.currentVideo = video;
      this.playDialogVisible = true;
      
      // 下次 DOM 更新后播放视频
      this.$nextTick(() => {
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.play().catch(error => {
            console.error('视频播放失败:', error);
            ElMessage.warning('视频播放失败，请检查视频文件');
          });
        }
      });
    },

    // 获取视频URL
    getVideoUrl(url) {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `http://localhost:5000${url}`;
    },

    // 更新播放进度
    updateProgress(event) {
      // 可以在这里添加自定义进度逻辑
      // console.log('播放进度:', event.target.currentTime);
    },

    // 设置视频时长
    setVideoDuration(event) {
      this.videoDuration = event.target.duration;
    },

    // 视频播放结束
    videoEnded() {
      ElMessage.info('视频播放结束');
    },
    
    // 获取视频缩略图
    getVideoThumbnail(video) {
      // 优先使用存储的缩略图
      if (video.thumbnail) {
        return video.thumbnail;
      }
      
      // 创建一个动态生成的默认封面，使用视频标题的首字母作为占位
      const title = video.title || '视频';
      const initial = title.charAt(0).toUpperCase();
      
      // 使用DataURL创建一个简单的彩色占位图
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      
      // 生成一个基于视频ID的随机但一致的背景色
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
      const colorIndex = (video.id || title.length) % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 添加文字
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initial, canvas.width / 2, canvas.height / 2);
      
      // 添加视频标题
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '14px Arial';
      ctx.fillText(title.length > 15 ? title.substring(0, 15) + '...' : title, canvas.width / 2, canvas.height - 20);
      
      // 存储为视频的临时缩略图
      video.thumbnail = canvas.toDataURL('image/jpeg');
      
      return video.thumbnail;
    },
    
    // 更新视频信息（时长等）
    updateVideoInfo(videoObj) {
      // 找到对应的视频元素
      const videoElements = document.querySelectorAll('.video-poster');
      videoElements.forEach(video => {
        if (video.src === this.getVideoUrl(videoObj.file_path)) {
          // 存储视频时长 - 这是最重要的功能，确保无论如何都能获取时长
          if (video.duration > 0) {
            videoObj.duration = video.duration;
          }
          
          // 尝试捕获一帧作为封面，但要处理跨域安全限制
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            try {
              // 尝试将视频定位到第一帧或第1秒位置
              video.currentTime = 1; // 尝试定位到第1秒，通常能捕获到有意义的帧
              
              // 使用setTimeout确保视频帧已经更新
              setTimeout(() => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  
                  // 绘制视频当前帧到canvas
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // 尝试检查是否为非黑色帧，同时处理可能的跨域错误
                  let isBlackFrame = true;
                  try {
                    // 尝试获取像素数据 - 这可能会抛出跨域错误
                    const imageData = ctx.getImageData(0, 0, 1, 1); // 只检查一个像素以减少性能影响
                    const data = imageData.data;
                    if (data[0] > 10 || data[1] > 10 || data[2] > 10) { // 不是纯黑
                      isBlackFrame = false;
                    }
                  } catch (corsError) {
                    console.warn('跨域限制阻止获取视频帧数据:', corsError);
                    // 跨域情况下，我们仍然尝试生成缩略图，但不进行黑色帧检查
                    isBlackFrame = false;
                  }
                  
                  // 只有当捕获到有效帧或遇到跨域但仍希望尝试生成缩略图时
                  if (!isBlackFrame) {
                    try {
                      // 存储缩略图数据URL
                      videoObj.thumbnail = canvas.toDataURL('image/jpeg');
                      // 更新poster属性
                      video.poster = videoObj.thumbnail;
                    } catch (dataURLError) {
                      console.warn('跨域限制阻止生成数据URL:', dataURLError);
                      // 如果无法生成dataURL，保持使用默认缩略图
                      if (!videoObj.thumbnail) {
                        videoObj.thumbnail = this.getVideoThumbnail(videoObj);
                      }
                    }
                  }
                } catch (error) {
                  console.warn('视频封面生成失败:', error);
                  // 出错时确保有默认缩略图
                  if (!videoObj.thumbnail) {
                    videoObj.thumbnail = this.getVideoThumbnail(videoObj);
                  }
                }
              }, 100); // 短暂延迟确保视频帧已更新
            } catch (error) {
              console.warn('处理视频信息时出错:', error);
              // 确保即使出错也有默认缩略图
              if (!videoObj.thumbnail) {
                videoObj.thumbnail = this.getVideoThumbnail(videoObj);
              }
            }
          }
        }
      });
    },

    // 删除视频
    async deleteVideo(videoId, videoTitle) {
      try {
        await ElMessageBox.confirm(
          `确定要删除视频「${videoTitle}」吗？此操作不可恢复。`,
          '提示',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );

        const token = localStorage.getItem('token');
        const response = await axios.delete(`http://localhost:5000/api/video/${videoId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.code === 0) {
          ElMessage.success('视频删除成功');
          this.fetchVideoList();
        } else {
          ElMessage.error(response.data.msg || '视频删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除视频失败:', error);
          ElMessage.error('视频删除失败');
        }
      }
    },

    // 格式化时长
    formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } catch (error) {
        return dateString;
      }
    }
  }
};
</script>

<style scoped>
.video-management-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%);
  min-height: 100vh;
}

.header-section {
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #2c3e50;
  position: relative;
  display: inline-block;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
}

.search-upload-container {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 320px;
  border-radius: 8px;
}





.upload-btn {
  background: linear-gradient(135deg, #3498db, #2ecc71);
  border: none;
  border-radius: 8px;

  padding: 18px 18px;
  font-style: normal;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.nav-item {
  padding: 10px 20px;
  background: linear-gradient(135deg, #51a6d8, #51a6d8);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(47, 129, 211, 0.3);
}

.nav-item:hover {
  background: linear-gradient(135deg, #54aadc, #54aadc);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.video-card {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  position: relative;
}

.video-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.video-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transform: scaleX(0);
  transition: transform 0.4s ease;
  z-index: 1;
}

.video-card:hover::before {
  transform: scaleX(1);
}

.video-thumbnail-container {
  position: relative;
  overflow: hidden;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.video-poster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.video-card:hover .video-poster {
  transform: scale(1.08);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  width: 70px;
  height: 70px;
 
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3498db;
  font-size: 28px;
  transform: scale(0.8);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.video-card:hover .play-icon {
  transform: scale(1);
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.video-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 2;
}

.video-card:hover .video-actions {
  opacity: 1;
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
 
  width: 35px;
  height: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  transition: all 0.3s ease;
  align-self: flex-end;
  justify-content: center;
  font-size: 16px;
  font-style:normal;
}

.delete-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.delete-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

.delete-btn:hover::before {
  left: 100%;
}

.edit-btn {
  background: linear-gradient(135deg, #3498db, #2ecc71);
  width: 35px;
  height: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  transition: all 0.3s ease;
  align-self: flex-end;
  justify-content: center;
  font-size: 16px;
  font-style: normal;
  margin-right: 8px;
}

.edit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.edit-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6);
}

.edit-btn:hover::before {
  left: 100%;
}

.video-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 20px;
  position: relative;
}

.video-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  justify-content: flex-end;
  flex-shrink: 0;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  min-height: 45px;
  max-height: 45px;
  word-break: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-time {
  font-size: 13px;
  color: #7f8c8d;
}

.empty-state {
  margin-top: 80px;
  text-align: center;
}

.video-player-container {
  padding: 20px 0;
}

.video-player {
  width: 100%;
  max-height: 500px;
  border-radius: 12px;
  background: #000;
  outline: none;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.video-details {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.video-details h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #2c3e50;
  font-weight: 600;
}

.video-stats {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #7f8c8d;
}

/* 上传组件样式调整 */
.upload-demo {
  border: 2px dashed #dcdfe6;
  width: 450px;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-demo:hover {
  border-color: #3498db;
  background: #ecf5ff;
}

.el-upload__tip {
  margin-top: 10px;
  color: #7f8c8d;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-management-container {
    padding: 16px;
  }
  
  .search-upload-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .video-grid {
    grid-template-columns: 1fr;
  }
  
  .video-player {
    height: 300px;
  }
  
  .video-actions {
    opacity: 1; /* 在移动设备上始终显示操作按钮 */
  }
}
</style>