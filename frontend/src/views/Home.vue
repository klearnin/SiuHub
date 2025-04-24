<template>
  <div class="home-wrapper" @mousemove="handleMouseMove">
    <div class="animated-bg" :style="circleStyle"></div>

    <div class="content-box">
      <el-card class="welcome-card">
        <h1>欢迎来到 <span class="brand">SiuHub ⚽</span></h1>
        <p>业余球队智能管理系统</p>

        <el-button type="primary" size="large" round @click="goLogin">开始登录</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";


const router = useRouter();
const goLogin = () => {
  router.push("/login");
};

// 鼠标圆形背景动画
const circleX = ref(0);
const circleY = ref(0);

const handleMouseMove = (e) => {
  circleX.value = e.clientX;
  circleY.value = e.clientY;
};

const circleStyle = computed(() => ({
  left: `${circleX.value - 100}px`,
  top: `${circleY.value - 100}px`,
}));
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap');

.home-wrapper {
  height: 100vh;
  background: linear-gradient(to bottom right, #f0f4ff, #e0f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rubik', sans-serif;
  overflow: hidden;
  position: relative;
}

.animated-bg {
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(64,158,255,0.3) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.15s ease-out;
}

.content-box {
  position: relative;
  z-index: 2;
}

.welcome-card {
  padding: 40px 60px;
  text-align: center;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  background-color: white;
}

h1 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
}

.brand {
  color: #409eff;
}

p {
  margin-bottom: 30px;
  color: #666;
  font-size: 16px;
}
</style>
