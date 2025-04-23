<template>
  <div class="coach-page">
    <!-- 顶部头像栏 -->
    <div class="top-bar">
      <div class="avatar-wrapper" @click="toggleDropdown">
        <img :src="avatarUrl" alt="头像" class="avatar" />
        <div v-if="dropdownVisible" class="dropdown">
          <ul>
            <li @click="goToReview">审核人员</li>
            <li @click="openInviteDialog">邀请码</li>
            <li @click="logout">退出登录</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 页面主体 -->
    <h1>这是教练主页</h1>

    <!-- 弹窗：邀请码展示 -->
    <el-dialog v-model="inviteVisible" title="我的球队邀请码" width="30%">
      <div style="font-size: 18px; text-align: center; margin-bottom: 20px;">
        当前邀请码：<strong>{{ inviteCode }}</strong>
      </div>
      <div style="text-align: center;">
        <el-button type="primary" @click="copyInviteCode">复制</el-button>
        <el-button @click="updateInviteCode">更新</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";

const avatarUrl = ref(null);
const dropdownVisible = ref(false);
const inviteVisible = ref(false);
const inviteCode = ref("");
const router = useRouter();

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
};

const openInviteDialog = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/coach/my-invite-code", {
      headers: { Authorization: `Bearer ${token}` },
    });
    inviteCode.value = res.data.inviteCode;
    inviteVisible.value = true;
    dropdownVisible.value = false;
  } catch (err) {
    console.error("获取邀请码失败", err);
  }
};

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value);
    ElMessage.success("邀请码已复制到剪贴板！");
  } catch (err) {
    ElMessage.error("复制失败，请手动复制");
  }
};

const updateInviteCode = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post("http://localhost:5000/api/coach/update-invite-code", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    inviteCode.value = res.data.inviteCode;
  } catch (err) {
    console.error("更新邀请码失败", err);
  }
};

const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

const goToReview = () => {
  router.push("/coach/review");
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
.coach-page {
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
  top: 110px;
  right: -10px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  padding: 8px 12px;
  min-width: max-content;
}

.dropdown ul {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  list-style: none;
}

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
