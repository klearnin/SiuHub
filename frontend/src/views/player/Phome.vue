<template>
  <div class="player-page">

     <!-- 顶部导航栏 -->
     <div class="nav-buttons">
      <router-link to="/forum" class="nav-button">论坛</router-link>
      <router-link to="/teamstats" class="nav-button">主队查看</router-link>
      <router-link to="/Pschedule" class="nav-button">球队日程</router-link>
      <router-link to="/Pnotice" class="nav-button">球队公告</router-link>
      <router-link to="/ptacticboard" class="nav-button">球队战术</router-link>
      <router-link to="/ai/qa" class="nav-button">AI问答中心</router-link>
    </div>

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
    <!-- 信息展示面板 -->
    <div class="info-panel">
      <!-- 近五场比赛情况 -->
       <!-- 近五场比赛情况 -->
      <div class="info-card recent-matches">
        <div class="card-header">
          <h3>近期比赛</h3>
        </div>
        <div class="card-content">
          <div v-if="recentMatches.length > 0" class="matches-list">
          <div class="match-schedule">
          <div class="section-title with-actions">
            <span>赛程</span>
            <!-- 右上角翻页按钮（按需显示） -->
            <div class="pager-actions">
              <el-button
                v-if="canPrevWindow"
                size="small"
                text
                @click="prevWindow"
              >前三场比赛</el-button>

              <el-button
                v-if="canNextWindow"
                size="small"
                text
                @click="nextWindow"
              >后三场比赛</el-button>
            </div>
          </div>

          <div class="schedule-list">
            <div
              v-for="(row, idx) in windowedSchedules"
              :key="row.id || idx"
              class="schedule-item"
              :class="{
                alt: idx % 2 === 1,
                highlight: row.id === anchorMatchId
              }"
              @click="handleRowClick(row)"
            >
              <!-- 时间 + 场地 -->
              <div class="cell time-field">
                <div class="date">{{ row.date }}</div>
                <div class="field">{{ row.field }}</div>
              </div>

              <!-- 本队队徽 -->
              <div class="cell logo">
                <el-avatar v-if="row.selfLogo" :src="row.selfLogo" shape="circle" :size="36" />
                <el-avatar v-else shape="circle" :size="36">我队</el-avatar>
                <!-- 显示本队名称（模板中 ref 自动解包） -->
                <span class="self-team-name">{{ row.selfName || teamInfo.name }}</span>
              </div>

              <!-- 比分/VS（居中 + 点球置于下一行） -->
              <div class="cell result">
                <div class="result-wrap" :class="{ future: row.isFuture }">
                  <div v-if="!row.isFuture" class="main">{{ row.resultMain }}</div>
                  <div v-if="row.penaltyText" class="penalty">{{ row.penaltyText }}</div>
                  <div v-if="row.isFuture" class="vs">VS</div>
                </div>
              </div>

              <!-- 对手队徽 + 名称 -->
              <div class="cell logo opponent">
                <el-avatar v-if="row.opponentLogo" :src="row.opponentLogo" shape="circle" :size="36" />
                <el-avatar v-else shape="circle" :size="36">对手</el-avatar>
                <span class="opponent-name">{{ row.opponent }}</span>
              </div>
            </div>
          </div>
        </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无比赛记录</p>
          </div>
        </div>
      </div>

      <!-- 下场比赛信息 -->
      <div class="info-card next-match">
        <div class="card-header">
          <h3>下场比赛</h3>
        </div>
        <div class="card-content">
          <div v-if="nextMatch" class="next-match-details">
            <div class="match-teams">
              <div class="team-info">
                <img v-if="teamLogo" :src="teamLogo" alt="主队队徽" class="team-logo" />
                <div v-else class="team-logo-placeholder">主队队徽</div>
                <span class="team-name">{{ teamname || '我的球队' }}</span>
              </div>
              <span class="vs">VS</span>
              <div class="team-info">
                <img v-if="nextMatch && nextMatch.team2logo" :src="nextMatch.team2logo" alt="客队队徽" class="team-logo" />
                <div v-else class="team-logo-placeholder">对手队徽</div>
                <span class="team-name">{{ nextMatch && nextMatch.team2 ? nextMatch.team2 : '对手未设定' }}</span>
              </div>
            </div>
            <div class="match-details">
              <div class="detail-item">
                <span class="label">时间:</span>
                <span class="value">{{ nextMatch && nextMatch.match_time ? nextMatch.match_time : '时间未设定' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">地点:</span>
                <span class="value">{{ nextMatch && nextMatch.location ? nextMatch.location : '地点未设定' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">日期:</span>
                <span class="value">{{ nextMatch && nextMatch.date ? nextMatch.date : '日期未设定' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无即将开始的比赛</p>
          </div>
        </div>
      </div>

      <!-- 个人荣誉 -->
      <div class="info-card personal-honors">
        <div class="card-header">
          <h3>个人荣誉</h3>
        </div>
        <div class="card-content">
          <div v-if="personalHonors.length > 0" class="honors-list">
            <div v-for="honor in personalHonors" :key="honor.id" class="honor-item">
              <div class="honor-title">{{ honor.title }}</div>
              <div class="honor-date">{{ honor.date }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无荣誉记录</p>
          </div>
        </div>
      </div>

      <!-- 球员数据 -->
      <div class="info-card player-stats">
        <div class="card-header">
          <h3>球员数据</h3>
        </div>
        <div class="card-content">
          <div v-if="playerStats" class="player-stats-layout">
            <!-- 左侧：头像、基本信息和比赛数据 -->
            <div class="player-left-section">
             
              
              <!-- 基础数据 -->
              <div class="basic-stats">
                <div class="basic-stat-item">
                  <span class="basic-stat-label">身高:</span>
                  <span class="basic-stat-value">{{ playerStats.height || '0' }}cm</span>
                </div>
                <div class="basic-stat-item">
                  <span class="basic-stat-label">体重:</span>
                  <span class="basic-stat-value">{{ playerStats.weight || '0' }}kg</span>
                </div>
                <div class="basic-stat-item">
                  <span class="basic-stat-label">年龄:</span>
                  <span class="basic-stat-value">{{ playerStats.age || '0' }}岁</span>
                </div>
                <div class="basic-stat-item">
                  <span class="basic-stat-label">惯用脚:</span>
                  <span class="basic-stat-value">{{ playerStats.dominant_foot || '右脚' }}</span>
                </div>
              </div>
              
              <!-- 比赛数据 -->
              <div class="match-stats-section">
                <h4>比赛数据</h4>
                <div class="match-stats-grid">
                  <div class="match-stat-item">
                    <div class="match-stat-value">{{ playerStats.appearances || 0 }}</div>
                    <div class="match-stat-label">出场次数</div>
                  </div>
                  <div class="match-stat-item">
                    <div class="match-stat-value">{{ playerStats.goals || 0 }}</div>
                    <div class="match-stat-label">进球数</div>
                  </div>
                  <div class="match-stat-item">
                    <div class="match-stat-value">{{ playerStats.assists || 0 }}</div>
                    <div class="match-stat-label">助攻数</div>
                  </div>
                  <div class="match-stat-item">
                    <div class="match-stat-value">{{ playerStats.rating || '0.0' }}</div>
                    <div class="match-stat-label">评分</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：技术统计 -->
            <div class="player-right-section">
              <!-- 技术统计 -->
              <div class="skills-section">
                <h4>技术统计</h4>
                <div class="skill-item">
                  <span class="skill-label">速度：{{ playerStats.speed || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.speed || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.speed || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">射门：{{ playerStats.shooting || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.shooting || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.shooting || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">传球：{{ playerStats.passing || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.passing || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.passing || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">盘带：{{ playerStats.dribbling || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.dribbling || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.dribbling || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">防守：{{ playerStats.defending || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.defending || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.defending || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">体能：{{ playerStats.stamina || 0 }}</span>
                  <div class="skill-bar">
                    <div class="skill-progress" :style="{ width: (playerStats.stamina || 0) + '%' }"></div>
                    <span class="skill-value">{{ playerStats.stamina || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无数据记录</p>
          </div>
        </div>
      </div>

      <!-- 最新公告 -->
       <div class="info-card team-notices">
        <div class="card-header">
          <h3>最新公告</h3>
        </div>
        <div class="card-content">
          <div v-if="teamNotices.length > 0" class="notices-list">
            <div v-for="notice in teamNotices" :key="notice.id" class="notice-item">
              <div class="notice-header">
                <div class="notice-title">{{ notice.title }}</div>
                
                 
               
              </div>
              <div class="notice-content">{{ notice.preview }}</div>
              <div class="notice-date">{{ notice.date }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无公告</p>
          </div>
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


const avatarUrl = ref(null);
const dropdownVisible = ref(false);
const router = useRouter();

// 信息模块数据
const recentMatches = ref([]);
const nextMatch = ref(null);
const personalHonors = ref([]);
const playerStats = ref(null);
const teamNotices = ref([]);
const teamname = ref('');
const teamLogo = ref(null);
const teamlist = ref([]);


const formatDateTime = (datetimeStr) => {
  const [datePart, timePart] = datetimeStr.split(' ')
  const [y, m, d] = datePart.split('-')
  const [hh = '12', mm = '00', ss = '00'] = timePart.split(':')

  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))

  if (isNaN(date.getTime())) {
    console.warn('❌ 无效时间:', datetimeStr)
    return '无效时间'
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
const teamInfo = ref({})

const fetchTeamInfo1 = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/info', {headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
    teamInfo.value = res.data.data || {}
  } catch (err) {
    ElMessage.error('加载球队信息失败')
  }
}

const allSchedules = ref([])

const anchorIndex = ref(0)
const anchorMatchId = ref(null)
const windowStart = ref(0)
const startIdx = ref(0)   // 当前窗口起点（含）
const endIdx   = ref(-1)  // 当前窗口终点（含）
const pageSize = 3

const windowedSchedules = computed(() =>
  allSchedules.value.slice(startIdx.value, endIdx.value + 1) // 闭区间
)

const canPrevWindow = computed(() => startIdx.value > 0)
const canNextWindow = computed(() => endIdx.value < allSchedules.value.length - 1)

function initWindowByAnchor(aIdx) {
  const n = allSchedules.value.length
  if (n === 0) { startIdx.value = 0; endIdx.value = -1; return }
  const s = Math.max(0, aIdx - 1)
  const e = Math.min(n - 1, aIdx + 1)
  startIdx.value = s
  endIdx.value = e
  anchorMatchId.value = allSchedules.value[aIdx]?.id ?? null
}

function prevWindow() {
  if (!canPrevWindow.value) return
  const newEnd = startIdx.value - 1
  const newStart = Math.max(0, newEnd - 2) // 往前拿最多 5 条，不足就不足
  startIdx.value = newStart
  endIdx.value = newEnd
}

function nextWindow() {
  if (!canNextWindow.value) return
  const newStart = endIdx.value + 1
  const newEnd = Math.min(allSchedules.value.length - 1, newStart + 2)
  startIdx.value = newStart
  endIdx.value = newEnd
}

const fetchSchedules = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/matches', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
    const allMatches = res.data.data || []

    const filtered = allMatches.filter(
      m => m.team1 === teamInfo.value.name || m.team2 === teamInfo.value.name
    )


    allSchedules.value = filtered
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .map(m => {
        const isTeam1Self = m.team1 === teamInfo.value.name
        const opponent = isTeam1Self ? m.team2 : m.team1
        const opponentLogoRaw = isTeam1Self ? m.team2_logo : m.team1_logo
        const selfLogoRaw     = isTeam1Self ? m.team1_logo : m.team2_logo

        let resultMain = 'VS'
        let penaltyText = null
        const isFuture = m.type !== 'past_match'            // 非 past_match 都视为未来

        if (!isFuture && m.score) {
          const self = m.score[teamInfo.value.value?.name || teamInfo.value.name] || { goal: 0, penalty: 0 }
          const opp  = m.score[opponent] || { goal: 0, penalty: 0 }
          resultMain = `${self.goal} - ${opp.goal}`
          if ((self.penalty ?? 0) > 0 || (opp.penalty ?? 0) > 0) {
            penaltyText = `点球：${self.penalty ?? 0} - ${opp.penalty ?? 0}`
          }
        }

        return {
          id: m.match_id,
          date: formatDateTime(m.datetime),
          field: m.location,
          isFuture,
          opponent,
          // 添加 selfName 字段用于模板显示本队名称
          selfName: teamInfo.value.name || '',
          opponentLogo: opponentLogoRaw ? `http://localhost:5000${opponentLogoRaw}` : null,
          selfLogo: selfLogoRaw ? `http://localhost:5000${selfLogoRaw}` : formatLogo(teamInfo.value.logo_path),
          resultMain,
          penaltyText
        }
      })

    // 选最近一场未来比赛为锚点；没有未来比赛就用最后一场
    const now = new Date()
    let aIdx = allSchedules.value.findIndex(x => x.isFuture && new Date(x.date) >= now)
    if (aIdx === -1) aIdx = Math.max(0, allSchedules.value.length - 1)
    initWindowByAnchor(aIdx)
  } catch (err) {
    console.error('加载球队赛程失败:', err);
    ElMessage.error('加载球队赛程失败')
  }
}



// 获取球队信息
const fetchTeamInfo = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/schedule/team", { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    // 检查响应数据是否存在
    if (res.data && res.data.teamname && res.data.teamname.length > 0) {
      teamname.value = res.data.teamname[0].name;
      
      // 获取主队队徽
      if (res.data.teamlist && res.data.teamlist.length > 0) {
        const myTeam = res.data.teamlist.find(team => team.name === teamname.value);
        if (myTeam && myTeam.logo_path) {
          teamLogo.value = `http://localhost:5000${myTeam.logo_path}`;
        }
      }
      
      teamlist.value = res.data.teamlist || [];
    }
  } catch (error) {
    console.error('获取球队信息失败:', error);
    ElMessage.error('获取球队信息失败');
  }
};

// 获取下场比赛信息
const fetchNextMatch = async () => {
  try {
    // 获取当前月份和下个月的日程
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 获取两个月的日程数据
    const [currentRes, nextRes] = await Promise.all([
      axios.get("http://localhost:5000/api/schedule/list", { 
        params: { month: currentMonth },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }),
      axios.get("http://localhost:5000/api/schedule/list", { 
        params: { month: nextMonth },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    ]);
    
    const allSchedules = [...(currentRes.data || []), ...(nextRes.data || [])];
    
    // 处理日程数据，添加队徽信息
    const processedSchedules = allSchedules.map(schedule => {
      if (schedule.type === 'match' && schedule.team2) {
        // 确保teamlist已经加载
        if (teamlist.value && teamlist.value.length > 0) {
          const team = teamlist.value.find(t => t.name === schedule.team2);
          if (team && team.logo_path) {
            schedule.team2logo = `http://localhost:5000${team.logo_path}`;
          }
        }
      }
      return schedule;
    });
    
    // 找到最近的未来比赛
    const today = new Date().toISOString().split('T')[0];
    const futureMatches = processedSchedules.filter(schedule => 
      schedule.type === 'match' && schedule.date >= today
    );
    
    if (futureMatches.length > 0) {
      // 按日期排序，取最早的一场比赛
      futureMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
      nextMatch.value = futureMatches[0];
    } else {
      nextMatch.value = null;
    }
    
  } catch (error) {
    console.error('获取下场比赛信息失败:', error);
    ElMessage.error('获取下场比赛信息失败');
  }
};

// 获取近五场比赛数据
const fetchRecentMatches = async () => {
  try {
    // 获取当前月份和上个月的日程
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 获取两个月的日程数据
    const [currentRes, prevRes] = await Promise.all([
      axios.get("http://localhost:5000/api/schedule/list", { 
        params: { month: currentMonth },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }),
      axios.get("http://localhost:5000/api/schedule/list", { 
        params: { month: prevMonth },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    ]);
    
    const allSchedules = [...(prevRes.data || []), ...(currentRes.data || [])];
    
    // 过滤出已完成的比赛
    const today = new Date().toISOString().split('T')[0];
    const pastMatches = allSchedules.filter(schedule => 
      schedule.type === 'match' && schedule.date < today
    );
    
    // 按日期倒序排序，取最近的5场比赛
    pastMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentMatches.value = pastMatches.slice(0, 5);
    
  } catch (error) {
    console.error('获取近五场比赛失败:', error);
    ElMessage.error('获取近五场比赛失败');
    recentMatches.value = [];
  }
};

// 获取个人荣誉数据
const fetchPersonalHonors = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/honor/personal", { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
     personalHonors.value = res.data.data || [];
    
  } catch (error) {
    console.error('获取个人荣誉失败:', error);
    ElMessage.error('获取个人荣誉失败');
    personalHonors.value = [];
  }
};

// 获取球员统计数据
const fetchPlayerStats = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/player/stats", { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.data && res.data.stats) {
      playerStats.value = res.data.stats;
    } else {
      playerStats.value = null;
    }
  } catch (error) {
    console.error('获取球员数据失败:', error);
    ElMessage.error('获取球员数据失败');
    playerStats.value = null;
  }
};

// 获取公告数据
const fetchNotices = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/notice/list", {
      params: {
        page: 1,
        size: 10, // 获取更多公告以便过滤
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.data.code === 0 && res.data.data && res.data.data.notices) {
      // 过滤掉球迷公告，只保留球队公告
      const teamNoticesOnly = res.data.data.notices.filter(notice => 
        notice.type === 'team'
      );
      
      // 处理公告数据，格式化日期和内容预览，只取最新的3条球队公告
      teamNotices.value = teamNoticesOnly.slice(0, 3).map(notice => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        preview: getContentPreview(notice.content),
        date: formatNoticeDate(notice.publish_time),
        type: notice.type
      }));
    } else {
      teamNotices.value = [];
    }
  } catch (error) {
    console.error('获取公告失败:', error);
    ElMessage.error('获取公告失败');
    teamNotices.value = [];
  }
};

// 格式化荣誉日期
const formatHonorDate = (dateString) => {
  if (!dateString) return '无日期';
  const date = new Date(dateString);
  return isNaN(date) ? '无效日期' : date.toLocaleDateString('zh-CN');
};

// 格式化公告日期
const formatNoticeDate = (datetime) => {
  if (!datetime) return '无日期';
  const date = new Date(datetime);
  return isNaN(date) ? '无效日期' : date.toLocaleDateString('zh-CN');
};

// 获取内容预览
const getContentPreview = (content) => {
  if (!content) return '';
  return content.length > 30 ? content.slice(0, 30) + '...' : content;
};

// 页面挂载时检查身份并获取数据
onMounted(async () => {
  const token = localStorage.getItem("token");
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userType = payload.type;

    console.log(`👮 页面内部检查身份: ${userType}`);

    if (userType !== "player") {
      ElMessage.error("无权访问该页面");
      router.replace("/login"); // 强制跳回登录
      return;
    }
  } else {
    ElMessage.error("请先登录");
    router.replace("/login");
    return;
  }

  try {
    // 获取用户头像
    const res = await axios.get("http://localhost:5000/api/user/my-avatar", {
      headers: { Authorization: `Bearer ${token}` },
    });
    avatarUrl.value = `http://localhost:5000${res.data.avatar}`;

    // 获取球队信息（需要先获取，因为其他函数依赖teamlist）
    await fetchTeamInfo();
    
    // 并行获取其他数据
    await Promise.all([
      fetchNextMatch(),
      fetchRecentMatches(),
      fetchPersonalHonors(),
      fetchPlayerStats(),
      fetchNotices(),
      fetchTeamInfo1(),
      fetchSchedules(),
    ]);

  } catch (err) {
    console.error("页面初始化失败", err);
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
.schedule-list { display: flex; flex-direction: column; gap: 8px; }
.schedule-item {
  display: grid;
  /* 调整列宽，给两队名称更多空间，避免过早省略 */
  grid-template-columns: 1.4fr 1.0fr 0.8fr 1.8fr; /* 时间场地 | 本队 | 结果 | 对手 */
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  transition: box-shadow .18s ease, transform .12s ease;
  cursor: pointer;
}
.schedule-item.alt { background: #f6f7fb; }
.schedule-item.highlight { outline: 2px solid #409eff44; box-shadow: 0 0 0 3px #409eff22 inset; }
.schedule-item:hover { box-shadow: 0 6px 18px rgba(0,0,0,.06); transform: translateY(-1px); }

/* 把本队（第二列：logo 单元）整体向右移动一点，保持 avatar + 名称 相对位置不变 */
.schedule-item > .logo:nth-child(2) {
  padding-left: 15px; /* 右移量，可按需调整为 10~20px */
}

.schedule-item > .logo:nth-child(4) {
  padding-left: 15px; /* 右移量，可按需调整为 10~20px */
}
/* 增大对手头像与队名之间的空隙（覆盖 .cell 的 gap:10px） */
.schedule-item .opponent {
  justify-content: flex-start;
  gap: 18px; /* 从 10px 增大到 18px，使 avatar 与名字间距更明显 */
}

/* 若需要更精确控制 avatar 本身的外边距（可选） */
.schedule-item .opponent :deep(.el-avatar) {
  /* 确保 avatar 与名字间没有额外负 margin，通常不必改动 */
  margin-right: 0;
}
.cell { display: flex; align-items: center; gap: 10px; min-width: 0; }

/* 时间与场地 */
.time-field { flex-direction: column; align-items: flex-start; gap: 4px; }
.date  { font-weight: 600; color: #111827; }
.field { font-size: 12px; color: #6b7280; }

.logo :deep(.el-avatar) { box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.result { justify-content: center; }
.result { justify-self: center; }                  /* grid 的居中关键 */
.result .result-wrap { text-align: center; }
.result .main { font-weight: 700; letter-spacing: .5px; }
.result .penalty { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.1; }
.result .vs {
  display: inline-block;
  min-width: 56px; padding: 4px 10px; border-radius: 999px;
  background: #fff7ed; color: #b45309; border: 1px dashed #f59e0b; font-weight: 600;
}
.result-badge {
  min-width: 72px;
  text-align: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1f2937;
  font-weight: 600;
}
.result-badge.future {        /* 未来比赛 VS 的样式 */
  background: #fff7ed;
  color: #b45309;
  border: 1px dashed #f59e0b;
}

.opponent { justify-content: flex-start; }
.opponent-name {
  /* 与本队名统一样式：允许最多两行、换行显示并省略溢出 */
  font-weight:600;
  color:#111827;
  font-size:14px;
  line-height:1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.match-schedule {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #0154a0;
  margin-bottom: 10px;
}
.section-title.with-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pager-actions {
  display: flex;
  gap: 8px;
}

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

/* 信息展示面板样式 */
.info-panel {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.info-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 30px;
  margin-top: 20px;
}

/* 差异化卡片布局 */
.recent-matches {
  grid-column: 1 / 3;
  grid-row: 1;
}

.next-match {
  grid-column: 3 / 4;
  grid-row: 1;
}

.personal-honors {
  grid-column: 1 / 2;
  grid-row: 2;
}

.player-stats {
  grid-column: 2 / 3;
  grid-row: 2;
}

.team-notices {
  grid-column: 3 / 4;
  grid-row: 2;
}

.info-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 450px;
}

.info-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
}

/* 差异化头部颜色主题 */
.recent-matches .card-header {
  background: linear-gradient(135deg, #4169E1, #87CEEB);
  border-bottom: 3px solid #1E90FF;
}

.next-match .card-header {
  background: linear-gradient(135deg, #0f5580, #1b96d4);
  border-bottom: 3px solid #0e5071;
}

.personal-honors .card-header {
  background: linear-gradient(135deg, #DAA520, #F0E68C);
  border-bottom: 3px solid #B8860B;
}

.player-stats .card-header {
  background: linear-gradient(135deg, #2E8B57, #66CDAA);
  border-bottom: 3px solid #228B22;
}

.team-notices .card-header {
  background: linear-gradient(135deg, #9370DB, #D8BFD8);
  border-bottom: 3px solid #6A5ACD;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  color: white;
  position: relative;
  overflow: hidden;
}

.card-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.6s ease;
}

.card-header:hover::before {
  transform: rotate(45deg) translateX(100%);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  position: relative;
  z-index: 1;
}

.view-more {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
}

.view-more:hover {
  color: white;
  background: rgba(255,255,255,0.2);
  transform: translateX(4px);
}

.card-content {
  padding: 28px;
  height: calc(100% - 80px);
}

/* 比赛列表样式 */
.matches-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.match-item {
  padding: 16px;
  background: linear-gradient(145deg, #f0f8ff, #e6f3ff);
  border-radius: 12px;
  border-left: 6px solid #1E90FF;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(30, 144, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.match-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.match-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(30, 144, 255, 0.2);
  border-left-color: #4169E1;
}

.match-item:hover::before {
  transform: translateX(100%);
}

.match-teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.team-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
}

.vs {
  color: #7f8c8d;
  font-size: 13px;
  font-weight: 600;
  padding: 0 8px;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(30, 144, 255, 0.2);
}

.match-date {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.match-score {
  font-weight: 800;
  color: #1E90FF;
  font-size: 16px;
}

/* 下场比赛样式 - 优化版 */
.next-match-details {
  text-align: center;
  position: relative;
}

.match-teams {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(145deg, #f0f8ff, #e6f3ff);
  border-radius: 12px;
  border: 2px solid rgba(30, 144, 255, 0.3);
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.team-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1E90FF;
  box-shadow: 0 3px 10px rgba(30, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.team-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(30, 144, 255, 0.4);
}

.team-logo-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 10px;
  border: 2px dashed #ccc;
}

.team-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  text-align: center;
  line-height: 1.2;
}

.vs {
  font-size: 20px;
  font-weight: 900;
  color: #1E90FF;
  text-shadow: 0 2px 4px rgba(30, 144, 255, 0.3);
  padding: 0 12px;
}

.match-details {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  border: 1px solid rgba(30, 144, 255, 0.2);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #1E90FF;
  transition: all 0.3s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.detail-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  border-left-color: #0066CC;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 700;
  color: #2c3e50;
  font-size: 13px;
}

.value {
  color: #1E90FF;
  font-weight: 600;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* 个人荣誉样式 */
.honors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.honor-item {
  padding: 16px;
  background: linear-gradient(145deg, #fff3cd, #ffeaa7);
  border-radius: 12px;
  border-left: 6px solid #ffc107;
  transition: all 0.3s ease;
}

.honor-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
}

.honor-title {
  font-weight: 600;
  color: #856404;
  font-size: 15px;
  margin-bottom: 4px;
}

.honor-date {
  font-size: 13px;
  color: #b08c00;
}

/* 球员数据样式 - 参考ManageTeam弹窗布局 */
.player-stats-layout {
  display: flex;
  gap: 15px;
  height: 100%;
  min-height: 280px;
}

.player-left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 180px;
}

.player-avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.avatar-image-large {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #2E8B57;
  box-shadow: 0 2px 6px rgba(46, 139, 87, 0.2);
}

.player-basic-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-name {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.1;
}

.player-number {
  font-size: 12px;
  font-weight: 600;
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.player-position {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  background: rgba(102, 102, 102, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

.basic-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding:12 px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.basic-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5.5px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.basic-stat-item:last-child {
  border-bottom: none;
}

.basic-stat-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.basic-stat-value {
  font-size: 11px;
  color: #2c3e50;
  font-weight: 600;
}

.match-stats-section {
  padding: 12px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.match-stats-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.match-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.match-stat-item {
  text-align: center;
  padding: 8px 5px;
  background: white;
  border-radius: 5px;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.match-stat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.match-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2E8B57;
  margin-bottom: 2px;
}

.match-stat-label {
  font-size: 10px;
  color: #666;
  font-weight: 500;
}

.player-right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.skills-section {
  flex: 1;
  width: 85%;
  height: 80px;
  padding: 10px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.skills-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.skill-item {
  
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
}

.skill-bar {
  position: relative;
  height: 5px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.skill-progress {
  height: 100%;
  background: linear-gradient(90deg, #2E8B57, #3CB371);
  border-radius: 3px;
  transition: width 0.5s ease;
  position: relative;
}

.skill-progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skill-value {
  font-size: 11px;
  font-weight: 700;
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 20px;
  text-align: center;
  border: 1px solid rgba(46, 139, 87, 0.3);
}

/* 公告列表样式 - 优化版 */
.notices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  padding: 16px;
  background: linear-gradient(145deg, #f8f0ff, #e8d4ff);
  border-radius: 12px;
  border-left: 6px solid #9370DB;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(147, 112, 219, 0.1);
  position: relative;
  overflow: hidden;
}

.notice-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  transition: left 0.6s ease;
}

.notice-item:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 20px rgba(147, 112, 219, 0.25);
  border-left-color: #8A2BE2;
  background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
}

.notice-item:hover::before {
  left: 100%;
}

.notice-title {
  font-weight: 700;
  color: #4B0082;
  font-size: 15px;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  line-height: 1.3;
}

.notice-preview {
  font-size: 13px;
  color: #6A5ACD;
  margin-bottom: 10px;
  line-height: 1.4;
  opacity: 0.9;
}

.notice-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #9370DB;
  border-top: 1px solid rgba(147, 112, 219, 0.3);
  padding-top: 8px;
}

.notice-date {
  font-weight: 600;
  color: #6A5ACD;
}

.notice-category {
  background: linear-gradient(145deg, #9370DB, #8A2BE2);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .recent-matches {
    grid-column: 1 / 3;
    grid-row: 1;
  }
  
  .next-match {
    grid-column: 1 / 2;
    grid-row: 2;
  }
  
  .personal-honors {
    grid-column: 2 / 3;
    grid-row: 2;
  }
  
  .player-stats {
    grid-column: 1 / 2;
    grid-row: 3;
  }
  
  .team-notices {
    grid-column: 2 / 3;
    grid-row: 3;
  }
}

@media (max-width: 768px) {
  .info-panel {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 20px;
  }
  
  .recent-matches,
  .next-match,
  .personal-honors,
  .player-stats,
  .team-notices {
    grid-column: 1 / 2;
    grid-row: auto;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .next-match-teams {
    flex-direction: column;
    gap: 15px;
  }
  
  .info-card {
    height: auto;
    min-height: 300px;
  }
  .type-tag {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
}
</style>

