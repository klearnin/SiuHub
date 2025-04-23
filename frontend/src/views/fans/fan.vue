<template>
  <div class="fan-page">
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
    <h1>这是球迷主页</h1>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const avatarUrl = ref(null);
const dropdownVisible = ref(false);
const router = useRouter();

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
.fan-page {
  text-align: center;
  padding: 100px 0;
  font-size: 24px;
  position: relative;
}

.top-bar {
  position: absolute;
  top: 20px;
  right: 80px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ccc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.dropdown {
  position: absolute;
  top: 110px; /* 向下偏移比头像略多一点 */
  right: -10px; /* 向左对齐大头像的中心位置 */
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  padding: 8px 12px;
  min-width: max-content; /* 自动适配宽度 */
}

/* 让文字横向排列 */
.dropdown ul {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

/* 每一项风格 */
.dropdown li {
  white-space: nowrap;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 16px;
}

.dropdown li:hover {
  background-color: #f0f0f0;
}
</style>
