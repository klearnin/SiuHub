<template>
    <div class="coach-page">
      <!-- 顶部导航栏 -->
      <div class="nav-bar">
        <router-link to="/forum" class="nav-item">论坛</router-link>
        <router-link to="/teamstats" class="nav-item">主队查看</router-link>
        <router-link to="/Cschedule" class="nav-item">球队日程</router-link>
  
        <!-- 公告下拉 -->
        <div 
          class="nav-item dropdown-wrapper"
          @mouseenter="showNoticeDropdown = true"
          @mouseleave="showNoticeDropdown = false"
        >
          <div class="dropdown-trigger">
            公告
          </div>
          <transition name="fade-slide">
            <div v-if="showNoticeDropdown" class="dropdown-menu">
              <router-link to="/dnotice" class="dropdown-item">发布公告</router-link>
              <router-link to="/dnotice_del" class="dropdown-item">查看公告</router-link>
            </div>
          </transition>
        </div>
  
        <!-- 伤病管理 -->
        <router-link to="/injury" class="nav-item">伤病管理</router-link>
      </div>
  
      <!-- 右上角头像 -->
      <div class="top-bar">
        <div class="avatar-wrapper" @click="toggleDropdown">
          <img :src="avatarUrl" alt="头像" class="avatar" />
          <div v-if="dropdownVisible" class="dropdown">
            <ul>
              <li @click="logout">退出登录</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import axios from "axios";
  import { ElMessage } from "element-plus";
  
  const router = useRouter();
  const avatarUrl = ref(null);
  const dropdownVisible = ref(false);
  const showNoticeDropdown = ref(false);
  
  onMounted(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userType = payload.type;
      console.log(`👨‍⚕️ 页面内部检查身份: ${userType}`);
      if (userType !== "medic") {
        ElMessage.error("无权访问该页面");
        router.replace("/login");
      }
    } else {
      ElMessage.error("请先登录");
      router.replace("/login");
    }
  });
  
  onMounted(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/user/my-avatar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      avatarUrl.value = `http://localhost:5000${res.data.avatar}`;
    } catch (err) {
      console.error("获取头像失败", err);
    }
  });
  
  const toggleDropdown = () => {
    dropdownVisible.value = !dropdownVisible.value;
  };
  
  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };
  </script>
  
  <style scoped>
  /* 和之前一致的样式 */
  .coach-page {
    position: relative;
    min-height: 100vh;
    background: #f5f7fa;
  }
  
  .nav-bar {
    display: flex;
    align-items: center;
    gap: 70px;
    padding: 10px 40px;
    background: linear-gradient(to right, #0154A0 0%, #0e5292 70%, #eaeced 100%);
    position: relative;
    overflow: visible;
  }
  
  .nav-bar::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 70%;
    right: 0;
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0) 0px,
      rgba(255, 255, 255, 0) 40px,
      rgba(255, 255, 255, 0.15) 40px,
      rgba(255, 255, 255, 0.15) 80px
    );
    z-index: 1;
    pointer-events: none;
  }
  
  .nav-item,
  .dropdown-wrapper {
    position: relative;
    z-index: 2;
    color: white;
    text-decoration: none;
    font-size: 18px;
    padding: 10px;
    transition: color 0.3s;
  }
  
  .nav-item:hover {
    color: #00bcd4;
  }
  
  .dropdown-wrapper {
    position: relative;
    cursor: pointer;
    display: inline-block;
    padding-bottom: 10px;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0f74d2;
    border-radius: 8px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    min-width: 180px;
    z-index: 100;
    transition: all 0.3s ease;
  }
  
  .dropdown-item {
    display: block;
    color: white;
    padding: 12px 20px;
    text-decoration: none;
    font-size: 16px;
    background: none;
    transition: background-color 0.3s;
    text-align: center;
  }
  
  .dropdown-item:hover {
    background-color: #133f67;
  }
  
  .top-bar {
    position: absolute;
    top: 9px;
    right: 80px;
    z-index: 2;
  }
  
  .avatar-wrapper {
    position: relative;
    cursor: pointer;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #eee;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  
  .dropdown {
    position: absolute;
    top: 60px;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    z-index: 20;
    min-width: 120px;
  }
  
  .dropdown ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .dropdown li {
    padding: 10px;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .dropdown li:hover {
    background-color: #f0f0f0;
  }
  
  .dropdown-trigger {
    padding: 10px;
    cursor: pointer;
    font-size: 18px;
    color: white;
    transition: color 0.3s;
  }
  
  .dropdown-trigger:hover {
    color: #00bcd4;
  }
  
  /* 动画 */
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.3s ease;
  }
  .fade-slide-enter-from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  .fade-slide-enter-to {
    opacity: 1;
    transform: translate(-50%, 0px);
  }
  .fade-slide-leave-from {
    opacity: 1;
    transform: translate(-50%, 0px);
  }
  .fade-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  </style>
  