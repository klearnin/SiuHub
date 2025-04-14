<template>
  <div class="notice-board">
    <h2 class="board-title">球队公告</h2>
    <div class="notice-list">
      <div
        class="notice-title"
        v-for="(notice, index) in notices"
        :key="notice.id"
        @click="toggleNotice(index)"
      >
        {{ notice.title }}
        <transition name="fade">
          <div class="notice-content" v-if="activeIndex === index" @click.stop>
            <p>{{ notice.content }}</p>
            <small>{{ formatDate(notice.publish_time) }}</small>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      notices: [],
      activeIndex: null,
    };
  },
  created() {
    this.fetchNotices();
  },
  methods: {
    async fetchNotices() {
      try {
        const res = await axios.get("http://localhost:5000/api/user/list");
        this.notices = res.data.data;
      } catch (error) {
        console.error('获取公告失败:', error);
      }
    },
    toggleNotice(index) {
      this.activeIndex = this.activeIndex === index ? null : index;
    },
    formatDate(datetime) {
      if (!datetime || typeof datetime !== 'string') {
        console.error('无效的日期:', datetime);
        return 'Invalid date';
      }
      const formattedDate = datetime.endsWith('Z') ? datetime.slice(0, -1) : datetime;
      const date = new Date(formattedDate);
      if (isNaN(date)) {
        console.error('无效的日期格式:', datetime);
        return 'Invalid date';
      }
      return date.toLocaleString();
    },
  },
};
</script>

<style scoped>
.notice-board {
  max-width: 600px;
  margin: 0 auto;
  font-family: sans-serif;
}

.board-title {
  text-align: center; /* 将标题居中 */
  font-size: 28px; /* 设置字体大小 */
  font-weight: bold; /* 加粗 */
  color: #000000; /* 设置字体颜色 */
  padding: 20px 0; /* 设置上下间距 */
  background: #31b4d8; /* 设置背景色 */
  border-radius: 8px; /* 圆角效果 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 500px;
}

.notice-title {
  background: #f1f1f1;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notice-title:hover {
  background-color: #e0e0e0;
}

.notice-content {
  background: white;
  padding: 10px;
  margin-top: 8px;
  border-left: 3px solid #3498db;
  border-radius: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
