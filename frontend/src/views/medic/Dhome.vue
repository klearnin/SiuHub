<template>
    <div class="coach-page">
      <!-- 顶部导航栏 -->
      <div class="nav-bar">
        <router-link to="/forum" class="nav-item">论坛</router-link>
        <router-link to="/teamstats" class="nav-item">主队查看</router-link>
       
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
              <router-link to="/medic/ai-health" class="dropdown-item">AI球员分析</router-link>
              <router-link to="/ai/qa" class="dropdown-item">AI问答中心</router-link>
            </div>
          </transition>
        </div>
      </div>
  
      <!-- 右上角头像 -->
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
    <!-- 中央内容区 -->
    <div class="center">
      <Announcement />

      <!-- 球队概况栏 -->
      <div class="team-info-box">
        <img class="team-logo" :src="formatLogo(teamInfo.logo_path)" alt="球队logo" />
        <div class="team-info-right">
          <div class="team-meta">
            <h2 class="team-name">{{ teamInfo.name }}</h2>
            <div class="team-abbr">{{ teamInfo.abbr }}</div>
            <div class="injury-count">
              <span class="injury-count-label">当前伤病人数：</span>
              <span class="injury-count-number">{{ injuredPlayers.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 左右两栏容器 -->
      <div class="content-grid">
        <!-- 左栏：近五场比赛卡片 -->
        <div class="left-col">
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
                  <div class="pair">
                    <!-- 左队徽 + 队名 -->
                    <div class="team-left">
                      <img v-if="m.team1Logo" :src="m.team1Logo" alt="" class="logo" />
                      <span class="team-name text-ellipsis">{{ m.team1 }}</span>
                    </div>
                    <div class="mid">
                      <template v-if="m.type === 'past_match' && m.result && m.result !== 'VS'">
                        <div class="score-main">{{ formatMainScore(m.result) }}</div>
                        <div
                          v-if="formatPenaltyScore(m.result)"
                          class="score-penalty"
                        >
                          （{{ formatPenaltyScore(m.result) }}）
                        </div>
                      </template>
                      <template v-else>
                        <div class="score-main">vs</div>
                      </template>
                    </div>
                    <!-- 右队名 + 队徽 -->
                    <div class="team-right">
                      <span class="team-name text-ellipsis">{{ m.team2 }}</span>
                      <img v-if="m.team2Logo" :src="m.team2Logo" alt="" class="logo" />
                    </div>
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

        <!-- 右栏：球员列表 -->
        <div class="right-col">
          <el-card class="home-card players-side" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="title">伤病球员列表</div>
              </div>
            </template>

            <!-- 受伤球员列表 -->
            <div v-if="injuredPlayers.length" class="injured-players-list">
              <div v-for="p in injuredPlayers" :key="p.id" class="injured-player-card">
                <div class="ipc-header">
                  <el-avatar :src="p.avatar" :size="64" shape="circle">{{ p.name?.slice(0,1) }}</el-avatar>
                  <div class="ipc-meta">
                    <div class="ipc-name" :title="p.name">{{ p.name }}</div>
                    <div class="ipc-tags">
                      <span class="ipc-tag injury-status">受伤</span>
                      <span v-if="p.number!==null && p.number!==undefined" class="ipc-tag">#{{ p.number }}</span>
                    </div>
                  </div>
                </div>
                <div class="ipc-injury-info">
                  <div class="injury-name">
                    <strong>伤病名称：</strong>{{ p.injury_name }}
                  </div>
                  <div class="injury-description">
                    <strong>伤情描述：</strong>{{ p.injury_description }}
                  </div>
                  <div v-if="p.injury_date" class="injury-date">
                    <strong>受伤日期：</strong>{{ formatInjuryDate(p.injury_date) }}
                  </div>
                  <div class="expected-recovery">
                    <strong>预计康复时间：</strong>{{ p.expected_recovery }}
                  </div>
                  <div v-if="p.expected_recovery_date" class="expected-recovery-date">
                    <strong>预期康复日期：</strong>{{ formatExpectedRecoveryDate(p.expected_recovery_date) }}
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无受伤球员" />
          </el-card>
        </div>
      </div>
    </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  import { useRouter } from "vue-router";
  import axios from "axios";
  import { ElMessage } from "element-plus";
  import Announcement from '@/components/Announcement.vue'
  import { Calendar } from "@element-plus/icons-vue";

  const router = useRouter();
  const avatarUrl = ref(null);
  const dropdownVisible = ref(false);
  const showNoticeDropdown = ref(false);
  const showAiDropdown = ref(false);

  // ===== 调试与请求头 =====
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ===== 赛程状态 =====
  const teamInfo = ref({});
  const allSchedules = ref([]);
  const fiveMatches = ref([]);
  const loading = ref(false);
  let booted = false; // 防止重复 mounted

  const BASE = "http://localhost:5000";
  const toFullUrl = (p) => (p ? (p.startsWith("http") ? p : `${BASE}${p}`) : null);
  // 本队队徽（来自 teamInfo.logo_path）
  const myTeamLogo = computed(() => toFullUrl(teamInfo.value?.logo_path || null));

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

  // 格式化受伤日期
  function formatInjuryDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  }

  // 格式化预期康复日期
  function formatExpectedRecoveryDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN');
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

  // 提取主比分（2：1）
  function formatMainScore(result) {
    if (!result) return '';
    const m = String(result).match(/(\d+)\s*-\s*(\d+)/);
    return m ? `${m[1]}：${m[2]}` : result;
  }

  // 提取点球比分（如果有，如 "（1 - 0）"）
  function formatPenaltyScore(result) {
    if (!result) return '';
    const m = String(result).match(/（\s*(\d+)\s*-\s*(\d+)\s*）/);
    if (m) return `${m[1]}：${m[2]}`;
    return '';
  }

  // ===== 组装赛程 =====
  function buildSchedules(raw) {
    console.table(raw.map(m => ({
      id: m.match_id ?? m.id,
      type: m.type,
      score_type: typeof m.score,
      score_preview: typeof m.score === 'string' ? m.score : JSON.stringify(m.score),
      t1g: m.team1_goal, t2g: m.team2_goal
    })));

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

        // >>> 补丁A开始：计算两侧队徽，并写入返回对象
        // 1) 后端若已回传对手/双方队徽的相对路径（如 /public/team-logos/xxx.png）
        const t1LogoApi = match.team1_logo ? `http://localhost:5000${match.team1_logo}` : null;
        const t2LogoApi = match.team2_logo ? `http://localhost:5000${match.team2_logo}` : null;

        // 2) 哪一侧是自己球队？自己球队优先使用 myTeamLogo（若已拿到）；否则退回接口里的 logo
        const isTeam2Self = selfNames.has(String(match.team2 || "").trim());
        const team1Logo = isTeam1Self ? (myTeamLogo.value || t1LogoApi) : t1LogoApi;
        const team2Logo = isTeam2Self ? (myTeamLogo.value || t2LogoApi) : t2LogoApi;
        // <<< 补丁A结束

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

          // 关键：把队徽挂到条目对象，模板才能 v-if 渲染
          team1Logo,
          team2Logo,
        };
      })
      .filter((m) => m._dt && !Number.isNaN(m._dt.getTime()))
      .sort((a, b) => a._dt - b._dt);

    allSchedules.value = list;
    fiveMatches.value = pickFiveWindow(list, new Date());

    console.table(
      raw.map(m => ({
        id: m.match_id ?? m.id,
        t1: m.team1, t2: m.team2,
        // 如果你已映射成 list 条目对象，就打印 list 里的字段：
        team1Logo_from_api: m.team1_logo,
        team2Logo_from_api: m.team2_logo
      }))
    );
    console.table(
      allSchedules.value.map(m => ({
        id: m.id, t1: m.team1, t2: m.team2,
        team1Logo: m.team1Logo, team2Logo: m.team2Logo
      }))
    );

  }

  // ===== 选"最近的一场"为中心，取前2后2（等距优先过去）=====
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

  // ====== 受伤球员列表 ======
  // 状态
  const injuredPlayers = ref([]);

  // 兼容 logo 路径为相对地址
  const formatLogo = (p) => p ? (p.startsWith("http") ? p : `${BASE}${p}`) : null;

  // 拉取受伤球员信息
  async function fetchInjuredPlayers() {
    try {
      const res = await axios.get("http://localhost:5000/api/injury/players-with-health", { headers });
      // 过滤出受伤的球员
      const allPlayers = res.data?.data || [];
      const injuredOnly = allPlayers.filter(p => p.health === 'injured');

      // 为每个受伤球员获取详细的伤病信息
      const detailedPlayers = await Promise.all(
        injuredOnly.map(async (player) => {
          try {
            // 获取该球员的伤病历史
            const injuryRes = await axios.get(`http://localhost:5000/api/injury/history/${player.id}`, { headers });
            const injuries = injuryRes.data?.data || [];

            // 找到当前进行中的伤病（最晚的未恢复伤病）
            const currentInjury = injuries
              .filter(injury => {
                const injuryDate = new Date(injury.injury_date);
                const recoveryDate = new Date(injuryDate);
                recoveryDate.setDate(recoveryDate.getDate() + injury.recovery_days);
                return recoveryDate > new Date(); // 未恢复
              })
              .sort((a, b) => new Date(b.injury_date) - new Date(a.injury_date))[0]; // 最新的

            // 计算预期康复日期
            let expectedRecoveryDate = null;
            if (currentInjury?.injury_date && currentInjury?.recovery_days) {
              const injuryDate = new Date(currentInjury.injury_date);
              expectedRecoveryDate = new Date(injuryDate);
              expectedRecoveryDate.setDate(expectedRecoveryDate.getDate() + currentInjury.recovery_days);
            }

            return {
              ...player,
              name: player.player_name, // 统一字段名
              avatar: formatLogo(player.avatar),
              number: player.number || null, // 如果有号码信息
              injury_description: currentInjury?.description || '暂无描述',
              expected_recovery: currentInjury ? `${currentInjury.recovery_days}天` : '未知',
              expected_recovery_date: expectedRecoveryDate,
              injury_date: currentInjury?.injury_date || null,
              injury_name: currentInjury?.injury_name || player.injury_name || '未知伤病'
            };
          } catch (err) {
            // 如果获取伤病详情失败，返回基本信息
            return {
              ...player,
              name: player.player_name,
              avatar: formatLogo(player.avatar),
              number: player.number || null,
              injury_description: '暂无描述',
              expected_recovery: '未知',
              injury_date: null,
              injury_name: player.injury_name || '未知伤病'
            };
          }
        })
      );

      injuredPlayers.value = detailedPlayers;
    } catch (e) {
      console.error('获取受伤球员信息失败:', e);
      ElMessage.error("加载受伤球员信息失败");
    }
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
      if (payload.type !== "medic" && userType !== "coach") {
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
      await fetchInjuredPlayers();
    } catch (e) {
      console.error(
        "[Dhome] load error:",
        e?.response?.status,
        e?.response?.data || e
      );
      const code = e?.response?.status;
      ElMessage.error(
        code === 401 ? "登录过期，请重新登录" : "数据加载失败"
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
    transition: color 0.3s, transform 0.2s, background-color 0.3s;
  }
  
  .nav-item:hover {
    color: #00bcd4;
    transform: translateY(-2px);
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

/* ======= 中央内容区 ======= */
.center {
  max-width: 1200px;
  margin: 24px auto 40px;
  padding: 0 16px;
}

.team-info-box {
  display: flex;
  gap: 20px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  transition: box-shadow .15s ease, transform .15s ease;
}

.team-info-box:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.team-logo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ccc;
  background-color: #fff;
}

.team-info-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex: 1;
  min-width: 0;
  padding-right: 200px;
}

.team-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.team-name {
  margin: 0;
  line-height: 1.1;
}

.team-abbr {
  margin-top: 2px;
  font-size: 15px;
  color: #8a93a6;
}

.team-meta h2 {
  margin: 0;
  line-height: 1.2;
  font-size: 20px;
  font-weight: 700;
  word-break: break-word;
}

.injury-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.injury-count-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.injury-count-number {
  font-size: 16px;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #fecaca;
}

/* ======= 两栏布局 ======= */
.content-grid{
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: start;
}
.left-col, .right-col { min-width: 0; }

/* ======= 卡片通用样式 ======= */
.schedule-card, .players-side {
  border-radius: 16px;
}

.card-header .title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 600; font-size: 16px;
}

/* ======= 赛程列表 ======= */
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

/* 三栅格：左队名 | 中间比分/VS | 右队名 */
.pair {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 12px;
  margin-bottom: 4px;
}

.team-left,
.team-right {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  max-width: 100%;
}

.team-left {
  justify-self: start;
  justify-content: flex-start;
  text-align: left;
}

.team-right {
  justify-self: end;
  justify-content: flex-end;
  text-align: right;
}

.team-name {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 队徽统一尺寸 */
.logo {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* 中间的比分或 vs 居中，使用等宽数字便于纵向对齐 */
.mid {
  justify-self: center;
  text-align: center;
  font-variant-numeric: tabular-nums;
  min-width: 44px;
  line-height: 1.1;
}

.score-main {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.score-penalty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.1;
  margin-top: 2px;
}

/* 队名过长时省略（避免挤压中间列） */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ======= 右侧：球员卡片 ======= */
.players-toolbar{ display:flex; align-items:center; }
.ml8{ margin-left:8px; }
.group-header{
  font-size:14px; font-weight:700; color:#374151;
  margin:10px 2px 8px; display:inline-flex; align-items:center; gap:8px;
}
.group-header::before{
  content:''; width:6px; height:6px; border-radius:50%; background:#60a5fa;
}
.players-card-grid{
  display:grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
  gap:12px;
}
.player-card{
  background:#fff; border:1px solid #e6e8eb; border-radius:16px; padding:12px;
  display:flex; flex-direction:column; gap:10px;
  transition: box-shadow .15s ease, transform .15s ease;
}
.player-card:hover{ transform: translateY(-1px); box-shadow:0 6px 18px rgba(0,0,0,.06); }
.pc-header{ display:grid; grid-template-columns:48px 1fr; gap:10px; align-items:center; }
.pc-meta{ min-width:0; }
.pc-name{ font-weight:600; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pc-tags{ display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
.pc-tag{ font-size:12px; padding:2px 8px; border-radius:999px; background:#f3f4f6; color:#4b5563; border:1px solid #e5e7eb; }
.pc-stats{ border-top:1px dashed #e5e7eb; padding-top:8px; }
.pc-stats-head, .pc-stats-body{ display:grid; grid-template-columns:1fr 1fr; }
.pc-stats-head{ font-size:12px; color:#6b7280; margin-bottom:4px; }
.pc-stats-body{ font-size:16px; font-weight:700; color:#111827; }
.pc-stats-body small{ font-size:11px; font-weight:500; color:#6b7280; margin-left:2px; }
.flat-header{ font-size:12px; color:#6b7280; margin:6px 2px 10px; }

/* ======= 受伤球员卡片 ======= */
.injured-players-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.injured-player-card {
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow .15s ease, transform .15s ease;
  min-height: 180px;
}

.injured-player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.ipc-header {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  align-items: center;
}

.ipc-meta {
  min-width: 0;
}

.ipc-name {
  font-weight: 700;
  color: #111827;
  font-size: 18px;
  line-height: 1.2;
  margin-bottom: 8px;
}

.ipc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ipc-tag {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  font-weight: 500;
}

.ipc-tag.injury-status {
  background: #dc2626;
  color: white;
  border: 1px solid #dc2626;
  font-weight: 600;
}

.ipc-injury-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.injury-description,
.expected-recovery,
.expected-recovery-date,
.injury-date {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.injury-name strong,
.injury-description strong,
.expected-recovery strong,
.expected-recovery-date strong,
.injury-date strong {
  color: #1f2937;
  font-weight: 600;
  margin-right: 8px;
}
  </style>
