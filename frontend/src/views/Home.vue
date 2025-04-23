<template>
  <div class="home-container">
    <h1>欢迎使用 SiuHub</h1>
    <div class="actions">
      <router-link to="/login" class="login-btn">登录</router-link>
    </div>
  </div>
</template>

<script setup>
// 如果需要可以在这里添加逻辑
</script>

<style scoped>
.home-container {
  width: 100%;
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.actions {
  margin-top: 20px;
}

.login-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-size: 16px;
}

.login-btn:hover {
  background-color: #66b1ff;
}
</style>
