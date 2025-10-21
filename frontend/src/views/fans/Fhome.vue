<template>
  <div class="fan-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <router-link to="/forum" class="nav-item">论坛</router-link>
      <router-link to="/teamstats" class="nav-item">主队查看</router-link>
      <router-link to="/fnotice" class="nav-item">查看公告</router-link>
    </div>

    <!-- 右上角头像（绝对定位，但仍放在 fan-page 内） -->
    <div class="top-bar">
      <div class="avatar-wrapper" @click="toggleDropdown">
        <img :src="avatarUrl" alt="头像" class="avatar" />
        <div class="dropdown">
          <ul>
            <li @click="logout">退出登录</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 中央内容区：把 Announcement + 赛程卡片 放在 fan-page 内 -->
    <div class="center">
      <Announcement />

      <el-card class="home-card schedule-card" shadow="hover" :loading="loading">
        <template #header>
          <div class="card-header">
            <div class="title">
              <el-icon><Calendar /></el-icon>
              <span>近五场比赛</span>
            </div>
          </div>
        </template>

        <!-- 内部用 v-if/v-else 控制列表/空态，但卡片永远渲染 -->
        <div v-if="fiveMatches.length" class="schedule-list">
          <div
            v-for="(m, idx) in fiveMatches"
            :key="m.id || idx"
            class="schedule-item"
            :class="{ closest: m.__isClosest }"
          >
            <div class="when">
              <div class="date">{{ formatDate(m._dt) }}</div>
              <div class="time">{{ formatTime(m._dt) }}</div>
            </div>

            <div class="vs">
              <div class="teams">
                <span class="team">{{ m.team1 }}</span>
                <span class="sep">vs</span>
                <span class="team">{{ m.team2 }}</span>
              </div>
              <div class="meta">
                <el-tag size="small" type="info">{{ m.location || '待定球场' }}</el-tag>
                <el-tag
                  size="small"
                  :type="m.type === 'past_match' ? 'success' : (m.type === 'match' ? 'warning' : '')"
                  class="ml8"
                >
                  {{ m.type === 'past_match' ? '已结束' : (m.type === 'match' ? '未开始' : m.type) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无赛程数据" />
      </el-card>
    </div>
  </div>
</template>
  
<script setup>
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import axios from "axios";
  import { ElMessage } from "element-plus";
  import Announcement from "@/components/Announcement.vue";
  import { Calendar } from "@element-plus/icons-vue";

  const router = useRouter();
  const avatarUrl = ref(null);
  const dropdownVisible = ref(false);

  // ===== 调试与请求头 =====
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ===== 赛程状态 =====
  const teamInfo = ref({});
  const allSchedules = ref([]);
  const fiveMatches = ref([]);
  const loading = ref(false);
  let booted = false; // 防止重复 mounted

  // ===== 时间格式化（展示用）=====
  function pad(n) {
    return n < 10 ? `0${n}` : `${n}`;
  }
  function formatDate(dt) {
    const w = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
      dt.getDate()
    )} 周${w}`;
  }
  function formatTime(dt) {
    return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  // ===== API：只返回/抛错，不在内部弹 Message =====
  async function fetchTeamInfoApi() {
    const res = await axios.get("http://localhost:5000/api/team/info", {
      headers,
    });
    return res.data?.data || {};
  }

  async function fetchMatchesApi() {
    const res = await axios.get("http://localhost:5000/api/team/matches", {
      headers,
    });
    return res.data?.data || [];
  }

  // ===== 组装赛程 =====
  function buildSchedules(raw) {
    const selfNames = new Set(
      [teamInfo.value?.name, teamInfo.value?.team_name, teamInfo.value?.abbr]
        .filter(Boolean)
        .map((s) => s.trim())
    );

    const filtered = raw.filter(
      (m) =>
        selfNames.has(String(m.team1 || "").trim()) ||
        selfNames.has(String(m.team2 || "").trim())
    );

    const list = filtered
      .map((match) => {
        // 兼容 datetime 或 date + match_time
        let iso = match.datetime;
        if (!iso) {
          const date = (match.date || "").trim();
          const time = (match.match_time || "00:00:00").trim();
          if (date) iso = `${date}T${time}`;
        }
        const _dt = new Date(String(iso).replace(" ", "T"));

        const isTeam1Self = selfNames.has(String(match.team1 || "").trim());
        const opponent = isTeam1Self ? match.team2 : match.team1;
        const oppLogoRaw = isTeam1Self ? match.team2_logo : match.team1_logo;

        let result = "VS";
        if (match.score) {
          const selfKey = [...selfNames].find((n) => match.score[n]);
          const self = (selfKey && match.score[selfKey]) || {
            goal: 0,
            penalty: 0,
          };
          const opp = (opponent && match.score[opponent]) || {
            goal: 0,
            penalty: 0,
          };
          const normal = `${self.goal ?? 0} - ${opp.goal ?? 0}`;
          const hasPen =
            (self.penalty ?? 0) > 0 || (opp.penalty ?? 0) > 0;
          result = hasPen
            ? `${normal}（${self.penalty ?? 0} - ${opp.penalty ?? 0}）`
            : normal;
        }

        return {
          id: match.match_id ?? match.id,
          team1: match.team1,
          team2: match.team2,
          location: match.location,
          type: match.type,
          _dt,
          opponent,
          opponentLogo: oppLogoRaw
            ? `http://localhost:5000${oppLogoRaw}`
            : null,
          field: match.location,
          result,
        };
      })
      .filter((m) => m._dt && !Number.isNaN(m._dt.getTime()))
      .sort((a, b) => a._dt - b._dt);

    allSchedules.value = list;
    fiveMatches.value = pickFiveWindow(list, new Date());
  }

  // ===== 选“最近的一场”为中心，取前2后2（等距优先过去）=====
  function pickFiveWindow(list, now = new Date()) {
    if (!list.length) return [];
    const nowTs = now.getTime();

    let center = 0,
      best = Infinity;
    for (let i = 0; i < list.length; i++) {
      const d = Math.abs(list[i]._dt.getTime() - nowTs);
      if (d < best) {
        best = d;
        center = i;
      } else if (d === best) {
        const curPast = list[i]._dt.getTime() <= nowTs;
        const prevPast = list[center]._dt.getTime() <= nowTs;
        if (curPast && !prevPast) center = i;
      }
    }

    const start = Math.max(0, center - 2);
    const end = Math.min(list.length, center + 3);
    const win = list.slice(start, end);

    win.forEach((m) => (m.__isClosest = false));
    const centerItem = list[center];
    const inWin = win.find((m) => m === centerItem);
    if (inWin) inWin.__isClosest = true;

    return win;
  }

  // ===== 只保留这一个 onMounted =====
  onMounted(async () => {
    if (booted) return;
    booted = true;

    // 1) 鉴权与角色校验
    const t = localStorage.getItem("token");
    if (!t) {
      ElMessage.error("请先登录");
      return router.replace("/login");
    }
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.type !== "fan") {
        ElMessage.error("无权访问该页面");
        return router.replace("/login");
      }
    } catch {
      ElMessage.error("登录状态无效，请重新登录");
      return router.replace("/login");
    }

    // 2) 加载数据
    loading.value = true;
    try {
      teamInfo.value = await fetchTeamInfoApi();
      const raw = await fetchMatchesApi();
      buildSchedules(raw);
    } catch (e) {
      console.error(
        "[Fhome] load error:",
        e?.response?.status,
        e?.response?.data || e
      );
      const code = e?.response?.status;
      ElMessage.error(
        code === 401 ? "登录过期，请重新登录" : "赛程加载失败"
      );
    } finally {
      loading.value = false;
    }

    // 3) 获取头像
    try {
      const res = await axios.get("http://localhost:5000/api/user/my-avatar", {
        headers: { Authorization: `Bearer ${t}` },
      });
      avatarUrl.value = `http://localhost:5000${res.data.avatar}`;
    } catch (err) {
      console.warn("获取头像失败", err);
    }
  });

  // ===== 头像下拉与登出 =====
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

  .schedule-card {
    /* 让它位于中部主列，和 mhome 风格一致的留白与圆角 */
    border-radius: 16px;
  }

  .card-header .title {
    display: flex; align-items: center; gap: 8px;
    font-weight: 600; font-size: 16px;
  }

  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .schedule-item {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    transition: transform .15s ease, background-color .15s ease, border-color .15s;
  }

  .schedule-item:hover {
    transform: translateY(-1px);
    border-color: var(--el-color-primary-light-5);
  }

  .schedule-item.closest {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  .when .date {
    font-weight: 600; line-height: 1.3;
  }
  .when .time {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .vs .teams {
    font-size: 15px;
    font-weight: 600;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .vs .sep { opacity: .7; }
  .vs .team { white-space: nowrap; }

  .vs .meta { margin-top: 6px; display: flex; gap: 8px; align-items: center; }
  .ml8 { margin-left: 8px; }

  .center {
  max-width: 980px;
  margin: 24px auto 40px; /* 居中 */
  padding: 0 16px;
}

  </style>
  