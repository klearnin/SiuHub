<template>
  <div class="player-page">

     <!-- 顶部导航栏 -->
     <div class="nav-buttons">
      <router-link to="/forum" class="nav-button">论坛</router-link>
      <router-link to="/teamstats" class="nav-button">主队查看</router-link>
      <router-link to="/Pschedule" class="nav-button">球队日程</router-link>
      <router-link to="/Pnotice" class="nav-button">球队公告</router-link>
      <router-link to="/ptacticboard" class="nav-button">球队战术</router-link>
    </div>

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


const avatarUrl = ref(null);
const dropdownVisible = ref(false);
const router = useRouter();

// 页面挂载时检查身份
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userType = payload.type;

    console.log(`👮 页面内部检查身份: ${userType}`);

    if (userType !== "player") {
      ElMessage.error("无权访问该页面");
      router.replace("/login"); // 强制跳回登录
    }
  } else {
    ElMessage.error("请先登录");
    router.replace("/login");
  }
});

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
};

const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

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
</script>

<style scoped>
.player-page {
  position: relative;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部导航条 */
.nav-buttons {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 10px 40px;
  background: linear-gradient(to right, #0154A0 0%, #0e5292 70%, #eaeced 100%);
  position: relative;
  overflow: visible;
}

/* 斜纹遮罩 */
.nav-buttons::after {
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

/* 导航按钮 */
.nav-button {
  position: relative;
  z-index: 2; /* 保证在斜纹遮罩之上 */
  display: inline-block;
  min-width: 150px;
  height: 60px;
  text-align: center;
  padding: 12px 24px;
  background: none;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 18px;
  transition: color 0.3s, transform 0.2s, background-color 0.3s;
}

.nav-button:hover {
  color: #00bcd4;
  transform: translateY(-2px);
}

/* 顶部右上角头像栏 */
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
</style>

