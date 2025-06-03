<template>
  <div class="match-today-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
      <h2 class="page-title">球队主页</h2>
    </div>

    <div v-if="loading" class="loading">正在加载球队数据...</div>
    <div v-else class="team-overview">
      <!-- 左侧：球队信息 + 赛程 -->
      <div class="left-panel">
        <div class="team-info-box">
          <img class="team-logo" :src="formatLogo(teamInfo.logo_path)" alt="球队logo" />
          <div class="team-meta">
            <h2>{{ teamInfo.name }}</h2>
            <p><strong>简称：</strong>{{ teamInfo.abbr }}</p>
          </div>
        </div>
        <div class="status-bar-section">
          <div class="status-bar-row">
            <span class="status-bar-label">近五场比赛状态：</span>
            <div class="status-bars">
              <div
                v-for="(match, idx) in recentMatchStatus"
                :key="idx"
                class="status-bar"
                :class="getBarClass(match.score_difference)"
                :style="getBarStyle(match.score_difference)"
              ></div>
            </div>
          </div>
        </div>
        <div class="match-schedule">
          <div class="section-title">赛程</div>
          <el-table
            :data="pagedSchedules"
            border
            style="width: 100%"
            @row-click="handleRowClick"
          >
            <el-table-column prop="date" label="时间" width="180" />
            <el-table-column prop="field" label="场地" width="200" />
            <el-table-column prop="result" label="比分" width="150" />
            <el-table-column label="对手" width="260">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <el-avatar
                    v-if="row.opponentLogo"
                    :src="row.opponentLogo"
                    shape="circle"
                    :size="32"
                  />
                  <el-avatar
                    v-else
                    shape="circle"
                    :size="32"
                    style="background-color: #ccc; color: white; font-size: 12px;"
                  >
                    队徽
                  </el-avatar>
                  <span>{{ row.opponent }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <!--比赛详情-->
          <div class="pagination-controls" style="margin-top: 16px; display: flex; justify-content: center; gap: 16px;">
            <el-button :disabled="currentPage === 1" @click="prevPage">上一页</el-button>
            <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
            <el-button :disabled="currentPage === totalPages" @click="nextPage">下一页</el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：数据统计 -->
      <div class="right-panel">
        <el-tabs tab-position="top" style="height: 100%">
          <el-tab-pane label="射手榜" class="custom-tab-title">
            <el-table :data="stats.goals" size="small">
              <el-table-column prop="name" label="球员" width="260" />
              <el-table-column prop="value" label="进球（点球）" width="100" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="助攻榜" class="custom-tab-title">
            <el-table :data="stats.assists" size="small">
              <el-table-column prop="name" label="球员" width="260" />
              <el-table-column prop="value" label="助攻" width="80" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  <el-dialog v-model="showDetail" width="90%" title="比赛详情">
    <MatchDetailCard :match-id="matchId" @close="showDetail = false" />
  </el-dialog>

</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

import MatchDetailCard from './MatchDetail.vue'
const showDetail = ref(false)
const matchId = ref(null)

const openMatchDetail = (id) => {
  matchId.value = id
  showDetail.value = true
}

const currentPage = ref(1)
const pageSize = 5

const pagedSchedules = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return allSchedules.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(allSchedules.value.length / pageSize))

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

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

const router = useRouter()
const token = localStorage.getItem('token')
const headers = token ? { Authorization: `Bearer ${token}` } : {}

const loading = ref(true)

const teamInfo = ref({})

const fetchTeamInfo = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/info', { headers })
    teamInfo.value = res.data.data || {}
  } catch (err) {
    ElMessage.error('加载球队信息失败')
  }
}

const allSchedules = ref([])

const findClosestPage = () => {
  const today = new Date()
  let closestIndex = 0
  let minDiff = Infinity

  allSchedules.value.forEach((item, idx) => {
    const date = new Date(item.date)
    const diff = Math.abs(date - today)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = idx
    }
  })

  return Math.floor(closestIndex / pageSize) + 1
}

const fetchSchedules = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/matches', { headers })

  const allMatches = res.data.data || []

  // ✅ 先过滤只包含测试队伍的比赛
  const filtered = allMatches.filter(
    match => match.team1 === teamInfo.value.name || match.team2 === teamInfo.value.name
  )

  // ✅ 然后再 map 显示
allSchedules.value = filtered
  .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))  // 按时间升序
  .map(match => {
    const isPast = match.type === 'past_match'
    const isTeam1Self = match.team1 === teamInfo.value.name
    const opponent = isTeam1Self ? match.team2 : match.team1
    const opponentLogoRaw = isTeam1Self ? match.team2_logo : match.team1_logo

    const result = isPast && match.score
      ? (() => {
          const self = match.score[teamInfo.value.name] || { goal: 0, penalty: 0 }
          const opp = match.score[opponent] || { goal: 0, penalty: 0 }
          const normalScore = `${self.goal} - ${opp.goal}`
          const penaltyScore = `${self.penalty} - ${opp.penalty}`
          const hasPenalty = self.penalty > 0 || opp.penalty > 0
          return hasPenalty ? `${normalScore}（${penaltyScore}）` : normalScore
        })()
      : 'VS'

    return {
      id: match.match_id,
      date: formatDateTime(match.datetime),
      field: match.location,
      opponent,
      opponentLogo: opponentLogoRaw ? `http://localhost:5000${opponentLogoRaw}` : null,
      result
    }
  })
  } catch (err) {
    ElMessage.error('加载球队赛程失败')
  }
}

const showMatchDetail = ref(false)
const selectedMatchDetail = ref({})
const matchEvents = ref([])

const hasPenalty = computed(() => {
  const score = selectedMatchDetail.value.score || {}
  return (
    score?.[selectedMatchDetail.value.team1]?.penalty > 0 ||
    score?.[selectedMatchDetail.value.team2]?.penalty > 0
  )
})

const fetchMatchDetailInline = async (match_id) => {
  try {
    const [matchRes, eventRes] = await Promise.all([
      axios.get(`http://localhost:5000/api/team/match/${match_id}`, { headers }),
      axios.get(`http://localhost:5000/api/team/match-events`, { params: { match_id }, headers })
    ])

    selectedMatchDetail.value = matchRes.data.data
    matchEvents.value = eventRes.data.data
    showMatchDetail.value = true
  } catch (e) {
    ElMessage.error('加载比赛详情失败')
  }
}

const handleRowClick = (row) => {
  console.log("点击了比赛行", row.id)
  if (row.id) {
    matchId.value = row.id
    showDetail.value = true
  }
}

const stats = ref({
  goals: [],
  assists: [],
  appearances: []
})

const fetchStats = async () => {
  try {
    const [scorerRes, assistRes] = await Promise.all([
      axios.get("http://localhost:5000/api/team/scorers", { headers }),
      axios.get("http://localhost:5000/api/team/assists", { headers })
    ])

    stats.value.goals = scorerRes.data.data.map(item => {
      const value = item.penalty_goals > 0
        ? `${item.total_goals}（${item.penalty_goals}）`
        : `${item.total_goals}`

      return {
        name: item.scorer_name,
        value,
        avatar: item.scorer_avatar
      }
    })

    stats.value.assists = assistRes.data.data.map(item => ({
      name: item.assist_name,
      value: item.total_assists,
      avatar: item.assist_avatar
    }))

    stats.value.appearances = [] // 如果没有接口可用，暂设为空数组
  } catch (err) {
    ElMessage.error("加载统计数据失败")
  } finally {
    loading.value = false
  }
}

const formatLogo = (path) => {
  return path?.startsWith('/public') ? `http://localhost:5000${path}` : path
}

const recentMatchStatus = ref([])

const fetchRecentMatchStatus = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/team-match-scores', { headers })
    recentMatchStatus.value = res.data.data || []
  } catch (err) {
    ElMessage.error('加载比赛状态失败')
  }
}

const getBarClass = (diff) => {
  if (diff > 0) return 'win'
  if (diff < 0) return 'lose'
  return 'draw'
}

const getBarStyle = (diff) => {
  const maxHeight = 50
  const unit = 10
  const height = Math.min(Math.abs(diff) * unit, maxHeight)
  return { '--bar-height': `${height}px` }
}

const goBack = () => {
  const payload = JSON.parse(atob(token.split('.')[1]))
  switch (payload.type) {
    case 'coach':
      router.push('/chome')
      break
    case 'manager':
      router.push('/mhome')
      break
    case 'player':
      router.push('/phome')
      break
    case 'fan':
      router.push('/fhome')
      break
    case 'medic':
      router.push('/dhome')
      break
    default:
      router.push('/login')
  }
}

onMounted(async () => {
  await fetchTeamInfo()
  await fetchSchedules()
  currentPage.value = findClosestPage()
  fetchStats()
  fetchRecentMatchStatus()
})
</script>

<style scoped>
.match-today-page {
  max-width: 100%;
  padding: 30px 40px;
  background: #f5f7fa;
}
.top-bar {
  position: relative;
  margin-bottom: 20px;
}
.back-button {
  position: absolute;
  left: 0;
  top: 0;
}
.page-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #0154a0;
}
.team-overview {
  display: flex;
  gap: 20px;
}
.left-panel {
  flex: 2;
  max-width: 1800px;
}
.right-panel {
  flex: 1.5;
}
.team-info-box {
  display: flex;
  gap: 20px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}
.team-logo {
  width: 100px;
  height: 100px;
  border-radius: 50%;         /* 圆形 */
  object-fit: cover;          /* 裁剪填满 */
  border: 2px solid #ccc;     /* 可选边框 */
  background-color: #fff;     /* 可选背景色，防止图片加载失败时露底色 */
}
.team-meta p {
  margin: 2px 0;
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
.status-bar-section {
  margin: -8px 0 48px 20px; /* ✅ 往上挪一点 + 左对齐 */
}

.status-bar-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}

.status-bar-wrapper {
  display: flex;
  justify-content: center;    /* ✅ 水平居中 */
  align-items: center;        /* ✅ 垂直居中 */
  height: 80px;               /* ✅ 控制上下间距 */
  margin: 10px 0;
}

.status-bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  justify-content: flex-start;
  margin-top: 10px;
  margin-left: 120px;
  height: 30px;
  
}

.status-bar-row {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px; /* ✅ 控制字与条之间的间距 */
  padding-left: 20px;
  margin-bottom: 4px;
}

.status-bar {
  width: 12px;
  border-radius: 2px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.status-bar.win::before {
  content: '';
  width: 100%;
  background-color: #67c23a;
  border-radius: 2px;
  height: var(--bar-height);
}

.status-bar.win {
  background-color: #67c23a;
}

.status-bar.lose {
  background-color: #f56c6c;
  transform: translateY(100%) scaleY(-1);
  transform-origin: top;
}

.status-bar.lose::before {
  content: '';
  width: 100%;
  background-color: #f56c6c;
  border-radius: 2px;
  height: var(--bar-height);
  position: absolute;
  bottom: 0;
}

.status-bar.draw::before {
  content: '';
  width: 100%;
  height: 2px;
  background-color: #909399;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.team-logo-small {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  object-fit: cover;
  border: solid 1px #cdd0d2;
  padding: 1px;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 20px;
  font-weight: 600;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.match_center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 100px;
}

.score {
  font-size: 28px;
  font-weight: bold;
  color: #c51c36;
}

.score-penalty {
  font-size: 14px;
  color: #605d5e;
}

.timeline-container {
  width: 100%;
  margin-top: 20px;
}

.timeline {
  position: relative;
  margin: 40px auto;
  padding: 0;
  width: 80%;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  background-color: #4caf50;
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  width: 50%;
  padding: 10px 20px;
  box-sizing: border-box;
}

.timeline-item.left {
  left: 0;
  text-align: right;
}

.timeline-item.right {
  left: 50%;
  text-align: left;
}

.timeline-item .content {
  background: #e8f5e9;
  padding: 10px;
  border-radius: 8px;
  max-width: 200px;
  word-break: break-word;
}

.timeline-item .minute {
  font-weight: bold;
  margin-bottom: 4px;
}

.timeline-item .dot {
  position: absolute;
  top: 20px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border-radius: 50%;
  z-index: 1;
}

.timeline-item.left .dot {
  right: -6px;
}

.timeline-item.right .dot {
  left: -6px;
}

::v-deep(.el-tabs__item) {
  font-size: 20px;
  font-weight: bold;
}

</style>
