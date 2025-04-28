<template>
  <div class="notice-board">
    <h2 class="board-title">公告管理</h2>

    <div class="notice-list">
      <el-card
        v-for="notice in notices"
        :key="notice.id"
        class="notice-card"
        @click="openNoticeDialog(notice)"
        shadow="hover"
      >
        <div class="card-header">
          <span class="notice-title">{{ notice.title }}</span>
          <el-tag
            :type="notice.type === 'team' ? 'success' : 'info'"
            size="small"
            class="type-tag"
          >
            {{ notice.type === 'team' ? '球队公告' : '球迷公告' }}
          </el-tag>
        </div>
        <div class="card-content">
          <span class="preview-content">{{ getContentPreview(notice.content) }}</span>
        </div>
        <div class="card-time">
          {{ formatDate(notice.publish_time) }}
        </div>
      </el-card>
    </div>

    <el-pagination
      v-if="total > 0"
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      class="pagination"
    />

    <div class="buttons">
      <el-button class="button" @click="back">返回</el-button>
    </div>

    <!-- 公告详情弹窗 -->
    <el-dialog v-model="dialogVisible" :show-close="false" width="500px">
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ selectedNotice?.title }}</span>
        </div>
      </template>

      <div class="dialog-content">
        {{ selectedNotice?.content }}
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">返回</el-button>
          <el-button type="danger" @click="confirmDelete(selectedNotice?.id)">删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  data() {
    return {
      notices: [],
      total: 0,
      currentPage: 1,
      pageSize: 6,
      dialogVisible: false,
      selectedNotice: null,
    };
  },
  created() {
    this.fetchNotices();
  },
  setup() {
    const router = useRouter();

    onMounted(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.type !== "manager") {
          ElMessage.error("无权访问该页面");
          router.replace("/login");
        }
      } else {
        ElMessage.error("请先登录");
        router.replace("/login");
      }
    });

    return { router };
  },
  methods: {
    async fetchNotices() {
      try {
        const res = await axios.get("http://localhost:5000/api/notice/list", {
          params: {
            page: this.currentPage,
            size: this.pageSize,
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        this.notices = res.data.data.notices;
        this.total = res.data.data.total;
      } catch (error) {
        console.error('获取公告失败:', error);
        ElMessage.error('获取公告失败');
      }
    },

    handlePageChange(page) {
      this.currentPage = page;
      this.fetchNotices();
    },

    back() {
      this.$router.push('/mhome');
    },

    openNoticeDialog(notice) {
      this.selectedNotice = notice;
      this.dialogVisible = true;
    },

    async confirmDelete(id) {
      try {
        await ElMessageBox.confirm('确定删除该公告吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });

        const res = await axios.delete(`http://localhost:5000/api/notice/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.data.code === 0) {
          ElMessage.success('删除成功');
          this.dialogVisible = false;
          this.fetchNotices();
        } else {
          ElMessage.error('删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
          ElMessage.error('删除失败');
        } else {
          ElMessage.info('已取消');
        }
      }
    },

    formatDate(datetime) {
      if (!datetime) return '无日期';
      const date = new Date(datetime);
      return isNaN(date) ? '无效日期' : date.toLocaleString();
    },

    getContentPreview(content) {
      if (!content) return '';
      return content.length > 50 ? content.slice(0, 50) + '...' : content;
    },
  },
};
</script>

<style scoped>
.notice-board {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  font-family: sans-serif;
}

.board-title {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 30px;
}

.notice-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.notice-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.notice-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notice-title {
  font-size: 20px;
  font-weight: bold;
  color: #2e72f1;
}

.type-tag {
  margin-left: 10px;
}

.card-content {
  color: #777;
  font-size: 14px;
  margin-top: 5px;
}

.card-time {
  margin-top: 10px;
  font-size: 12px;
  color: #aaa;
  text-align: right;
}

.buttons {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.button {
  width: 200px;
  height: 50px;
  font-size: 18px;
  border-radius: 30px;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}

.dialog-header {
  background: #409EFF;
  padding: 15px;
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  color: white;
  border-radius: 6px 6px 0 0;
}

.dialog-content {
  padding: 20px;
  font-size: 16px;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>
