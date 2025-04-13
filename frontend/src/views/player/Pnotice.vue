<template>
  <div class="notice-container">
    <div class="notice-item">
      <div class="notice-header">
        <input type="text" class="notice-title" placeholder="通知标题">
        <span class="notice-time">12:30</span>
      </div>
      <textarea class="notice-content" placeholder="通知内容"></textarea>
    </div>
  </div>
</template>

<style scoped>
.notice-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.notice-item {
  width: 80%;
  max-width: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.notice-title {
  flex: 1;
  padding: 8px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.notice-time {
  margin-left: 15px;
  font-size: 14px;
  color: #666;
  align-self: center;
}

.notice-content {
  width: 100%;
  height: 150px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
}
</style>
