<template>
  <div class="notice-board">
    <h2 class="board-title">球队公告</h2>
    <div class="notice-list">
      <!-- 使用 template 包裹循环，结合 v-if 过滤 -->
      <template v-for="(notice, index) in notices">
        <!-- 只有 team 类型才会渲染外层容器 -->
        <div 
          v-if="notice.type === 'team'"
          class="notice-title"
          :key="notice.id"
          @click="selectNotice(notice.id, index)"
          :class="{ 'selected': selectedNoticeId === notice.id }"
        >
          <div class="title-wrapper">
            <span>{{ notice.title }}</span>
            <small>{{ formatDate(notice.publish_time) }}</small>
          </div>
          <transition name="fade">
            <div 
              class="notice-content" 
              v-if="activeIndex === index" 
              @click.stop
            >
              <p>{{ notice.content }}</p>
            </div>
          </transition>
        </div>
      </template>
    </div>
    <div class="buttons">
      <button class="button" @click="back">返回</button>
      <button class="button_del" @click="del">删除</button>
    </div>
  </div>
</template>
  
  <script>
  import axios from 'axios';
  import { ElMessage, ElMessageBox } from 'element-plus';
  
  export default {
    data() {
      return {
        notices: [],
        activeIndex: null,
        selectedNoticeId: null // 新增选中ID存储
      };
    },
    created() {
      this.fetchNotices();
    },
    methods: {
      async fetchNotices() {
        try {
          const res = await axios.get("http://localhost:5000/api/notice/list");
          this.notices = res.data.data;
        } catch (error) {
          console.error('获取公告失败:', error);
          this.$message.error('获取公告失败');
        }
      },

      back() {
        this.$router.push('/chome');
      },
  
      // 修改后的删除方法
      async del() {
    if (!this.selectedNoticeId) {
      ElMessage.warning('请先选择要删除的公告');
      return;
    }
  
    try {
      // 弹出确认框，等待用户选择
      await ElMessageBox.confirm('确定删除该公告吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
  
      // 如果用户点击“确定”，执行删除
      const res = await axios.delete(`http://localhost:5000/api/notice/${this.selectedNoticeId}`);
      if (res.data.code === 0) {
        ElMessage.success('删除成功');
        this.selectedNoticeId = null;
        this.activeIndex = null;
        this.fetchNotices();
      } else {
        ElMessage.error('删除失败: ' + (res.data.msg || '未知错误'));
      }
  
    } catch (error) {
      // 用户点击“取消”或者关闭弹窗
      if (error !== 'cancel') {
        console.error('删除公告失败:', error);
        ElMessage.error('删除失败: ' + (error.response?.data?.msg || error.message));
      } else {
        ElMessage.info('已取消删除');
      }
    }
  }
  ,
  
      // 修改后的选择方法
      selectNotice(id, index) {
        this.selectedNoticeId = id;
        this.toggleNotice(index);
      },
  
     
  
      toggleNotice(index) {
        this.activeIndex = this.activeIndex === index ? null : index;
      },
  
      formatDate(datetime) {
        if (!datetime || typeof datetime !== 'string') {
          return 'Invalid date';
        }
        const date = new Date(datetime);
        return isNaN(date) ? 'Invalid date' : date.toLocaleString();
      }
    }
  };
  </script>
  
  <style scoped>
  .notice-board {
    max-width: 500px;
    margin: 0 auto;
    font-family: sans-serif;
  }
  
  .board-title {
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    color: #000000;
    padding: 20px 0;
    background: #31b4d8;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
    transition: all 0.3s;
  }
  .title-wrapper{
    display: flex;           /* 启用 Flex 布局 */
    justify-content: space-between;  /* 标题靠左，时间靠右 */
    align-items: center;     /* 垂直居中 */
    width: 100%;            /* 撑满父容器 */
  }
  
  .notice-title.selected {
    background: #d4edff;
    border-left: 4px solid #31b4d8;
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
  
  .buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
  }
  
  .button {
    width: 150px;
    height: 60px;
    font-size: 18px;
    background-color: #ccc;
    color: #333;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  .button_del{
    width: 150px;
    height: 60px;
    font-size: 18px;
    background-color: #ccc;
    color: #333;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .button:hover:not(:disabled) {
    background-color: #4ddbee;
  }
  .button_del:hover:not(:disabled) {
    background-color: #e67e8d;
  }
  
  
  </style>