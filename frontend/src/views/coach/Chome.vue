<template>
  <div class="coach-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <router-link to="/forum" class="nav-item">论坛</router-link>
    

      <router-link to="/cmanageTeam" class="nav-item">人员管理</router-link>
      <router-link to="/teamstats" class="nav-item">主队查看</router-link>
      <router-link to="/Cschedule" class="nav-item">球队日程</router-link>
      <router-link to="/ctacticcanvas" class="nav-item">战术画板</router-link>
     
      <!-- 修改后 -->
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
            <router-link to="/cnotice" class="dropdown-item">发布公告</router-link>
            <router-link to="/cnotice_del" class="dropdown-item">查看公告</router-link>
          </div>
        </transition>
      </div>




      <router-link to="/ctacticboard" class="nav-item">球队战术</router-link>
      <div 
        class="nav-item dropdown-wrapper"
        @mouseenter="showAiDropdown = true"
        @mouseleave="showAiDropdown = false"
      >
        <div class="dropdown-trigger">
          AI入口
        </div>
        <transition name="fade-slide">
          <div v-if="showAiDropdown" class="dropdown-menu">
            <router-link to="/coach/ai-tactic" class="dropdown-item">AI战术分析</router-link>
            <router-link to="/medic/ai-health" class="dropdown-item">AI球员分析</router-link>
            <router-link to="/ai/qa" class="dropdown-item">AI问答中心</router-link>
          </div>
        </transition>
      </div>
    </div>

    <!-- 右上角头像 -->
    <div class="top-bar">
  <div class="avatar-wrapper">
    <img :src="avatarUrl" alt="头像" class="avatar" />
    <div class="dropdown">
      <ul>
        <li @click="goToReview">审核人员</li>
        <li @click="openInviteDialog">邀请码</li>
        <li @click="logout">退出登录</li>
      </ul>
    </div>
  </div>
</div>
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
    
    <div class="container">
    <div class="item">
      <img src="../../assets/1.jpg" alt="" />
    </div>
    <div class="item">
      <img src="../../assets/2.jpg" alt="" />
    </div> <div class="item">
      <img src="../../assets/3.jpg" alt="" />
    </div> <div class="item">
      <img src="../../assets/4.jpg" alt="" />
    </div> <div class="item-5">
      <img :src=" avatarUrl" alt="" />
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
const inviteVisible = ref(false);
const inviteCode = ref("");
const showNoticeDropdown = ref(false);
const showAiDropdown = ref(false);

onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userType = payload.type;
    console.log(`👮 页面内部检查身份: ${userType}`);
    if (userType !== "coach") {
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
    console.log("头像地址：", res.data.avatar);
    avatarUrl.value = `http://localhost:5000${res.data.avatar}`;
  } catch (err) {
    console.error("获取头像失败", err);
  }
  fetchUserList();
});





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
let users = ref([]);
const fetchUserList = async()=>{
      try {
            const response = await axios.get("http://localhost:5000/api/player/list", { 
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            users = response.data.userlist;
         
           
          } catch (error) {
            console.error('获取球员列表失败', error);
            ElMessage.error('获取球员列表失败');
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
  router.push("/chome/review");
};
</script>

<style scoped>
.coach-page {
  position: relative;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部导航条：左边纯色，右边斜纹 */
.nav-bar {
  display: flex;
  align-items: center;
  gap: 70px; /* 间距从30px加大到50px */
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

/* 保证文字在遮罩上方 */
.nav-item{
  position: relative;
  z-index: 2; /* 保证在斜纹遮罩之上 */
  display: inline-block;
  min-width: 40px;
  height: 60px;
  text-align: center;
  padding: 12px 10px;
  background: none;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 18px;
  transition: color 0.3s, transform 0.2s, background-color 0.3s;
}
.nav-item:hover {
  color: #00bcd4;
  transform: translateY(-2px);
}
.dropdown-wrapper {
  position: relative;
  z-index: 2;
  color: white;
  text-decoration: none;
  font-size: 18px;
  padding: 8px;
  transition: color 0.3s, transform 0.2s, background-color 0.3s;
 
}



/* 公告下拉菜单 */
.dropdown-wrapper {
  position: relative;
  cursor: pointer;
  display: inline-block;
  padding-bottom: 10px; /* ✅ 增加包裹区域高度，防止空隙 */
}


/* 修改公告下拉栏样式 */
.dropdown-menu {
  position: absolute;
  top: 100%; /* 刚好在 trigger 文字下面 */
  left: 50%; /* 先以trigger为基准 */
  transform: translateX(-50%); /* 水平居中对齐 */
  background-color: #0f74d2;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  min-width: 180px;
  z-index: 100;
  transition: all 0.3s ease;
}

/* 下拉子项 */
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

/* 顶部右侧头像 */
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
  padding: 4px;
  size: 100%;
  cursor: pointer;
  font-size: 18px;
  color: white;
  
}

.dropdown-trigger:hover {
  color: #00bcd4;
  

}

/* 新增下拉动效 fade+slide */
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
.container{
  width:350px;
  height:350px;
  margin: 0 auto;
  margin-top: 100px;
  display: grid;
  grid-template-rows: repeat(3,1fr);
  grid-template-columns: repeat(3,1fr);
  gap:10px;
  grid-template: 
  'A A B'
  'C D B'
  'C E E'; 
}
.item:nth-child(1){
  grid-area: A;
}
.item:nth-child(2){
  grid-area: B; 
} 
.item:nth-child(3){
  grid-area: C;
}
.item:nth-child(5){
  grid-area: D; 
}
.item:nth-child(4){
  grid-area: E; 
}
.item{
  overflow: hidden;
  border: solid 1px #000;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
}
.item-5{
  overflow: hidden;
  border: solid 1px #000;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
}
.item-5 img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持图片比例 */
}
.item img {
  width: 230%;
  height: 320%;
  object-fit: cover; /* 保持图片比例 */
}
.container{
  animation: rotation 12s infinite linear;
}
.item img{
  animation: rotation 12s infinite linear reverse;
}
.item-5 img{
  animation: rotation 12s infinite linear reverse;
}
@keyframes rotation{
  to{
    transform: rotate(360deg);
  }
}
/* 初始隐藏下拉菜单 */
/* 初始状态：透明且上移 */
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

</style>




