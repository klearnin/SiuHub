<template>
  <div class="coach-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <router-link to="/forum" class="nav-item">论坛</router-link>
      <router-link to="/team" class="nav-item">主队查看</router-link>
     
      <!-- 公告下拉 -->
      <div 
        class="nav-item dropdown-wrapper"
        @mouseenter="showNoticeDropdown = true"
        @mouseleave="showNoticeDropdown = false"
      >
        <div class="dropdown-trigger">公告</div>

        <transition name="fade-slide">
          <div v-if="showNoticeDropdown" class="dropdown-menu">
            <router-link to="/mnotice" class="dropdown-item">发布公告</router-link>
            <router-link to="/mnotice_del" class="dropdown-item">管理公告</router-link>
          </div>
        </transition>
      </div>

      <router-link to="/tactics" class="nav-item">球队战术</router-link>
      <router-link to="/finance" class="nav-item">财政管理</router-link>
      <router-link to="/history" class="nav-item">球队历史</router-link>
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

    <!-- 今日比赛展示区 -->
    <div class="today-match-section">
      <h2>今日比赛</h2>

      <div v-if="matches.length === 0" class="no-match">今天没有比赛安排。</div>

      <ul class="match-list">
        <li
          v-for="match in matches"
          :key="match.id"
          class="match-item clickable"
          @click="goMatchToday(match.id)"
        >
          <div class="match-top-row">
            <img :src="fullImageUrl(match.homeLogo)" class="team-logo-lg" alt="主队徽" />
            <span class="team-name">{{ match.homeTeam }}</span>
            <span class="vs">vs</span>
            <span class="team-name">{{ match.awayTeam }}</span>
            <template v-if="!errorLogos[`${match.id}-away`] && match.awayLogo">
              <img
                :src="fullImageUrl(match.awayLogo)"
                class="team-logo-lg"
                alt="客队徽"
                @error="handleLogoError(match.id, 'away')"
              />
            </template>
            <template v-else>
              <div class="team-logo-placeholder">对手队徽</div>
            </template>
          </div>
          <div class="match-bottom-row">
            {{ formatTime(match.time) }} ｜ {{ match.venue }}
          </div>
        </li>
      </ul>
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

  const matches = ref([]);

  const errorLogos = ref({});

  const handleLogoError = (matchId, team) => {
    errorLogos.value[`${matchId}-${team}`] = true;
  };


  onMounted(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userType = payload.type;
      if (userType !== "manager") {
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

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/match/today-matches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      matches.value = res.data.data.map((match) => ({
        id: match.id,
        time: match.match_time,
        homeTeam: match.team1_name || "未知主队",
        awayTeam: match.team2_name || "未知客队",
        homeLogo: match.team1_logo || "",
        awayLogo: match.team2_logo || "",
        venue: match.location || "未知场地",
      }));
    } catch (err) {
      console.error("加载比赛信息失败", err);
    }
  });

  const toggleDropdown = () => {
    dropdownVisible.value = !dropdownVisible.value;
  };

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const formatTime = (timeStr) => {
    if (typeof timeStr === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const [hour, minute] = timeStr.split(":");
      return `${hour}:${minute}`;
    }
    return "无效时间";
  };

  const fullImageUrl = (path) => {
    if (!path) return "";
    const cleanPath = path.replace(/^\/+/, "");
    return path.startsWith("http") ? path : `http://localhost:5000/${cleanPath}`;
  };

  const goMatchToday = (id) => {
    if (id) {
      router.push(`/matchToday?id=${id}`);
    } else {
      router.push("/matchToday");
    }
  };

</script>
  
  <style scoped>
  /* 完全沿用Chome.vue的样式，不变 */
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
  .match-today-wrapper {
    width: 200px;
    height: 80px;
    line-height: 80px;
    background: #00bcd4;
    color: white;
    font-size: 24px;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 188, 212, 0.6);
    text-align: center;
    cursor: pointer;
    margin: 120px auto; /* 上下居中距离，左右居中 */
    user-select: none;
    transition: background-color 0.3s;
  }

  .match-today-wrapper:hover {
    background: #0097a7;
  }
    
  .today-match-section {
    max-width: 800px;
    margin: 100px auto 40px;
    padding: 30px 20px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    text-align: center;
  }

  .today-match-section h2 {
    font-size: 24px;
    font-weight: bold;
    color: #0154a0;
    margin-bottom: 20px;
  }

  .match-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .match-item {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }

  .match-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .match-time {
    font-weight: bold;
    color: #555;
    width: 60px;
    text-align: right;
  }

  .match-venue {
    font-size: 14px;
    color: #999;
    margin-left: auto;
  }

  .team-logo {
    width: 28px;
    height: 28px;
    object-fit: cover;
    border-radius: 50%;
  }

  .team-name {
    font-weight: 600;
    font-size: 16px;
  }

  .vs {
    font-size: 14px;
    color: #888;
  }

  .clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

  .clickable:hover {
    background-color: #eef8ff;
  }

  .match-item {
    padding: 16px 12px;
    border-bottom: 1px solid #eee;
    text-align: center;
  }

  .match-top-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  .match-bottom-row {
    font-size: 14px;
    color: #666;
  }

  .team-logo-lg {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
  }

  .team-name {
    font-weight: 600;
    font-size: 16px;
  }

  .vs {
    font-size: 16px;
    font-weight: bold;
    color: #0154a0;
  }

  .team-logo-placeholder {
    width: 80px;
    height: 80px;
    background-color: #f0f0f0; /* ✅ 更浅灰 */
    border-radius: 50%;
    color: #666;               /* 更柔和的文字色 */
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }

</style>  