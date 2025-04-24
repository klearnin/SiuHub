<template>
  <div class="notice-container">
    <div class="notice-box">
      <NoticeItem type="team" />
      <NoticeItem type="fan" />
    </div>

    <button class="back-button" @click="goBack">返回</button>
  </div>
</template>

<script>
import NoticeItem from './NoticeItem.vue';

export default {
  components: {
    NoticeItem
  },
  methods: {
    goBack() {
      // 返回上一个页面
      this.$router.push('/chome')
    }
  }
};
</script>

<style scoped>
.notice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px;
}

.notice-box {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 新增返回按钮样式 */
.back-button {
  width: 200px;
  height: 60px;
  font-size: 18px;
  background-color: #ccc;
  color: #333;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button:hover {
  width: 200px;
  height: 60px;
  font-size: 18px;
  background-color: #4ddbee;
}
</style>
