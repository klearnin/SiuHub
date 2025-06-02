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

        <div class="match-schedule">
          <div class="section-title">赛程</div>
          <el-table :data="schedules" border style="width: 100%">
            <el-table-column prop="date" label="时间" width="180" />
            <el-table-column prop="field" label="场地" width="220" />
            <el-table-column prop="opponent" label="对手" width="220" />
            <el-table-column prop="result" label="比分" width="150" />
          </el-table>
        </div>
      </div>

      <!-- 右侧：数据统计 -->
      <div class="right-panel">
        <div class="section-title">球队数据</div>
        <el-tabs tab-position="top" style="height: 100%">
          <el-tab-pane label="射手榜">
            <el-table :data="stats.goals" size="small">
              <el-table-column prop="name" label="球员" width="260" />
              <el-table-column prop="value" label="进球（点球）" width="100" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="助攻榜">
            <el-table :data="stats.assists" size="small">
              <el-table-column prop="name" label="球员" width="260" />
              <el-table-column prop="value" label="助攻" width="80" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="出场次数">
            <el-table :data="stats.appearances" size="small">
              <el-table-column prop="name" label="球员" width="260" />
              <el-table-column prop="value" label="出场" width="80" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

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

const schedules = ref([])

const fetchSchedules = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/matches', { headers })
    const raw = res.data.data || []

  const allMatches = res.data.data || []

  // ✅ 先过滤只包含测试队伍的比赛
  const filtered = allMatches.filter(
    match => match.team1 === teamInfo.value.name || match.team2 === teamInfo.value.name
  )

  // ✅ 然后再 map 显示
  schedules.value = filtered.slice(0, 5).map(match => {
    const isPast = match.type === 'past_match'
    const opponent = match.team1 === teamInfo.value.name ? match.team2 : match.team1
    let result = 'VS'

    if (isPast && match.score) {
      const self = match.score[teamInfo.value.name] || { goal: 0, penalty: 0 }
      const opp = match.score[opponent] || { goal: 0, penalty: 0 }

      const normalScore = `${self.goal} - ${opp.goal}`
      const penaltyScore = `${self.penalty} - ${opp.penalty}`

      const hasPenalty = self.penalty > 0 || opp.penalty > 0

      result = hasPenalty
        ? `${normalScore}（${penaltyScore}）`
        : normalScore
    }

    return {
      date: formatDateTime(match.datetime),
      field: match.location,
      opponent,
      result
    }
  })
  } catch (err) {
    ElMessage.error('加载球队赛程失败')
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
  fetchStats()
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
  object-fit: contain;
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
</style>
