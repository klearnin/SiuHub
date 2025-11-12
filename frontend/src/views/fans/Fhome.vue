<template>
    <div class="fan-page">
      <!-- 顶部导航栏 -->
      <div class="nav-bar">
        <router-link to="/forum" class="nav-item">论坛</router-link>
        <router-link to="/teamstats" class="nav-item">主队查看</router-link>
       
        <router-link to="/fnotice" class="nav-item">查看公告</router-link>
        <router-link to="/ai/qa" class="nav-item">AI问答中心</router-link>
      </div>
  
      <!-- 右上角头像 -->
      <div class="top-bar">
        <div class="avatar-wrapper" @click="toggleDropdown">
          <img :src="avatarUrl" alt="头像" class="avatar" />
          <div  class="dropdown">
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
  
  onMounted(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userType = payload.type;
      console.log(`👤 页面内部检查身份: ${userType}`);
      if (userType !== "fan") {
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
  .fan-page {
    position: relative;
    min-height: 100vh;
    background: #f5f7fa;
  }
  
  /* 顶部导航条背景和教练页面一致 */
  .nav-bar {
    display: flex;
    align-items: center;
    gap: 70px;
    padding: 10px 40px;
    background: linear-gradient(to right, #0154A0 0%, #0e5292 70%, #eaeced 100%);
    position: relative;
    overflow: visible;
    height: 75px;
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
  
  .nav-item {
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
  
  /* 右上角头像 */
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
    transition: all 0.5s ease;
  }
  .avatar:hover{
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
  .dropdown {
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 0;
  z-index: 1000;
  transition: 
    opacity 0.5s ease,
    transform 0.5s ease,
    visibility 0.5s;
}

/* 鼠标悬停时：显示并下移 */
.avatar-wrapper:hover .dropdown {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
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
  </style>
  