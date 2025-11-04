<template>
  <div class="match-today-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
    </div>
    <div v-if="loading" class="loading">正在加载球队数据...</div>
    <div v-else class="team-overview">
      <!-- 左侧：球队信息 + 赛程 -->
      <div class="left-panel">
        <div class="team-info-box">
          <img class="team-logo" :src="formatLogo(teamInfo.logo_path)" alt="球队logo" />
          <!-- 右侧内容区：左边是文字信息，右边是状态条 -->
          <div class="team-info-right">
            <div class="team-meta">
              <h2>{{ teamInfo.name }}</h2>
              <p><strong>简称：</strong>{{ teamInfo.abbr }}</p>
            </div>

            <div class="team-status-inline">
              <span class="status-bar-label">近五场比赛状态：</span>
              <div class="status-bars">
                <el-tooltip
                  v-for="(match, idx) in [...recentMatchStatus].reverse()"
                  :key="idx"
                  :content="`比分差：${match.score_difference}`"
                  placement="top"
                >
                  <div
                    class="status-bar"
                    :class="getBarClass(match.score_difference)"
                    :style="getBarStyle(match.score_difference)"
                  ></div>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>       
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
              >前五场比赛</el-button>

              <el-button
                v-if="canNextWindow"
                size="small"
                text
                @click="nextWindow"
              >后五场比赛</el-button>
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
        <!-- 荣誉卡片 -->
        <div class="honor-card">
          <div class="section-title">球队荣誉</div>
          <div v-if="teamHonors.length === 0" class="honor-empty">暂无记录</div>

          <ul v-else class="honor-list">
            <li v-for="h in teamHonors" :key="h.id" class="honor-item">
              <div class="honor-dot"></div>
              <div class="honor-content">
                <div class="honor-title">
                  {{ h.title }}
                  <span class="honor-date">{{ formatDate(h.honor_date) }}</span>
                </div>
                <div v-if="h.description" class="honor-desc">{{ h.description }}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧：分组球员卡片 + 排序 -->
      <div class="right-panel">
        <!-- 排序工具条 -->
        <div class="players-toolbar">
          <div class="toolbar-left">
            <el-segmented v-model="sortBy" :options="[
              { label: '默认', value: 'none' },
              { label: '按进球', value: 'goals' },
              { label: '按助攻', value: 'assists' },
            ]" />
            <el-segmented
              v-model="sortDir"
              :options="[
                { label: '降序', value: 'desc' },
                { label: '升序', value: 'asc' },
              ]"
              :disabled="sortBy==='none'"
              class="ml8"
            />
          </div>
        </div>

        <!-- 默认：按门将/后卫/中场/前锋分组 -->
        <template v-if="sortBy==='none'">
          <div class="players-group" v-for="group in groupedPlayers" :key="group.key">
            <div class="group-header">{{ group.title }}</div>
            <div class="players-card-grid">
              <div v-for="pl in group.list" :key="pl.id" class="player-card">
                <div class="pc-header">
                  <el-avatar :src="pl.avatar" :size="56" shape="circle" class="pc-avatar">
                    {{ pl.name?.slice(0,1) || '球' }}
                  </el-avatar>
                  <div class="pc-name-line">
                    <div class="pc-name" :title="pl.name">{{ pl.name }}</div>
                    <div class="pc-tags">
                      <span v-if="pl.position" class="pc-tag">{{ pl.position }}</span>
                      <span v-if="pl.number !== null && pl.number !== undefined" class="pc-tag">#{{ pl.number }}</span>
                    </div>
                  </div>
                </div>
                <div class="pc-stats">
                  <div class="pc-stats-head">
                    <span>进球（点球）</span><span>助攻</span>
                  </div>
                  <div class="pc-stats-body">
                    <span class="pc-goals">
                      {{ pl.total_goals || 0 }}<small>（{{ pl.penalty_goals || 0 }}）</small>
                    </span>
                    <span class="pc-assists">{{ pl.total_assists || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 排序：取消分组，按所选字段平铺 -->
        <template v-else>
          <div class="flat-header">
            当前视图：{{ sortBy==='goals' ? '按进球' : '按助攻' }}{{ sortDir==='desc' ? '（高→低）' : '（低→高）' }}
          </div>
          <div class="players-card-grid">
            <div v-for="pl in flatSortedPlayers" :key="pl.id" class="player-card">
              <div class="pc-header">
                <el-avatar :src="pl.avatar" :size="56" shape="circle" class="pc-avatar">
                  {{ pl.name?.slice(0,1) || '球' }}
                </el-avatar>
                <div class="pc-name-line">
                  <div class="pc-name" :title="pl.name">{{ pl.name }}</div>
                  <div class="pc-tags">
                    <span v-if="pl.position" class="pc-tag">{{ pl.position }}</span>
                    <span v-if="pl.number !== null && pl.number !== undefined" class="pc-tag">#{{ pl.number }}</span>
                  </div>
                </div>
              </div>
              <div class="pc-stats">
                <div class="pc-stats-head">
                  <span>进球（点球）</span><span>助攻</span>
                </div>
                <div class="pc-stats-body">
                  <span class="pc-goals">
                    {{ pl.total_goals || 0 }}<small>（{{ pl.penalty_goals || 0 }}）</small>
                  </span>
                  <span class="pc-assists">{{ pl.total_assists || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <el-dialog v-model="showDetail" width="90%">
    <template #header>
      <div class="dialog-header">
        <span>比赛详情</span>
        <span v-if="selectedMatch" class="dialog-sub">地点：{{ selectedMatch.field }}</span>
      </div>
    </template>
    <MatchDetailCard :match-id="matchId" :key="matchId" @close="showDetail = false" />
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed , nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

import MatchDetailCard from './MatchDetail.vue'
const showDetail = ref(false)
const matchId = ref(null)
const teamHonors = ref([])
const fetchHonors = async () => {
  try {
    const teamRes = await axios.get('http://localhost:5000/api/honor/team', { headers })
   
    teamHonors.value = teamRes.data.data
   
  } catch (err) {
    ElMessage.error('加载荣誉失败')
  }
}
const handleHonorClick = (item, type) => {
    
    if (!item.id) {
      ElMessage.error('荣誉ID缺失，无法查看或操作')
      return
    }
    selectedHonor.value = { ...item, type }
    editForm.value = {
      id: item.id || '',
      type,
      title: item.title,
      description: item.description,
      honor_date: new Date(item.honor_date),
      user_id: item.user_id || '',
      user_name: item.user_name || ''
    }
    editMode.value = false
    viewDialogVisible.value = true   // ✅ 使用新的变量
  }
const openMatchDetail = (id) => {
  matchId.value = id
  showDetail.value = true
}

const currentPage = ref(1)

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
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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

const anchorIndex = ref(0)
const anchorMatchId = ref(null)
const windowStart = ref(0)
const startIdx = ref(0)   // 当前窗口起点（含）
const endIdx   = ref(-1)  // 当前窗口终点（含）
const pageSize = 5

const windowedSchedules = computed(() =>
  allSchedules.value.slice(startIdx.value, endIdx.value + 1) // 闭区间
)

const canPrevWindow = computed(() => startIdx.value > 0)
const canNextWindow = computed(() => endIdx.value < allSchedules.value.length - 1)

function initWindowByAnchor(aIdx) {
  const n = allSchedules.value.length
  if (n === 0) { startIdx.value = 0; endIdx.value = -1; return }
  const s = Math.max(0, aIdx - 2)
  const e = Math.min(n - 1, aIdx + 2)
  startIdx.value = s
  endIdx.value = e
  anchorMatchId.value = allSchedules.value[aIdx]?.id ?? null
}

function prevWindow() {
  if (!canPrevWindow.value) return
  const newEnd = startIdx.value - 1
  const newStart = Math.max(0, newEnd - 4) // 往前拿最多 5 条，不足就不足
  startIdx.value = newStart
  endIdx.value = newEnd
}

function nextWindow() {
  if (!canNextWindow.value) return
  const newStart = endIdx.value + 1
  const newEnd = Math.min(allSchedules.value.length - 1, newStart + 4)
  startIdx.value = newStart
  endIdx.value = newEnd
}

const fetchSchedules = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/matches', { headers })
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
    ElMessage.error('加载球队赛程失败')
  }
}

const showMatchDetail = ref(false)
const selectedMatchDetail = ref({})
const matchEvents = ref([])
const selectedMatch = ref(null)

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

const handleRowClick = async (row) => {
  if (!row?.id) return
  selectedMatch.value = row
  showDetail.value = false
  matchId.value = row.id
  await nextTick()
  showDetail.value = true
}

const stats = ref({
  goals: [],
  assists: [],
  appearances: []
})

const players = ref([])

const fetchPlayers = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/team/players-stats", { headers })
    players.value = (res.data?.data || []).map(p => ({
      ...p,
      avatar: formatLogo(p.avatar),
      // 保底 0
      total_goals: Number(p.total_goals) || 0,
      penalty_goals: Number(p.penalty_goals) || 0,
      total_assists: Number(p.total_assists) || 0,
    }))
  } catch (e) {
    ElMessage.error("加载球员统计失败")
  }
}
// 排序状态
const sortBy = ref('none')   // 'none' | 'goals' | 'assists'
const sortDir = ref('desc')  // 'desc' | 'asc'

// 位置 -> 大类映射
const roleBucket = (pos) => {
  if (pos === '守门员') return 'GK';
  if (['左后卫','右后卫','中后卫'].includes(pos)) return 'DEF';
  if (['后腰','中前卫','前腰','左前卫','右前卫'].includes(pos)) return 'MID';
  if (['中锋','影锋','左边锋','右边锋'].includes(pos)) return 'FWD';
  return 'OTH';
};

// 每组的显示标题与顺序
const groupMeta = [
  { key: 'GK',  title: '门将' },
  { key: 'DEF', title: '后卫' },
  { key: 'MID', title: '中场' },
  { key: 'FWD', title: '前锋' },
  { key: 'OTH', title: '其他' },
];

// 通用比较器
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// 根据 sortBy/sortDir 生成组内排序函数
const makeSorter = () => {
  if (sortBy.value === 'goals') {
    // 进球优先，其次点球，最后球衣号（保证稳定视觉）
    return (a, b) => {
      const primary = cmp(a.total_goals, b.total_goals);
      if (primary !== 0) return sortDir.value === 'desc' ? -primary : primary;
      const secondary = cmp(a.penalty_goals, b.penalty_goals);
      if (secondary !== 0) return sortDir.value === 'desc' ? -secondary : secondary;
      return cmp(a.number ?? 999, b.number ?? 999);
    };
  }
  if (sortBy.value === 'assists') {
    // 助攻优先，其次进球，最后球衣号
    return (a, b) => {
      const primary = cmp(a.total_assists, b.total_assists);
      if (primary !== 0) return sortDir.value === 'desc' ? -primary : primary;
      const secondary = cmp(a.total_goals, b.total_goals);
      if (secondary !== 0) return sortDir.value === 'desc' ? -secondary : secondary;
      return cmp(a.number ?? 999, b.number ?? 999);
    };
  }
  // 默认：号码升序（若为空放最后）
  return (a, b) => cmp(a.number ?? 999, b.number ?? 999);
};

// 分组 + 排序（组内）
const groupedPlayers = computed(() => {
  const sorter = makeSorter();

  // 先分桶
  const buckets = {
    GK:  [], DEF: [], MID: [], FWD: [], OTH: [],
  };
  for (const p of players.value) {
    (buckets[roleBucket(p.position)] || buckets.OTH).push(p);
  }

  // 组内排序
  for (const k of Object.keys(buckets)) {
    buckets[k] = buckets[k].slice().sort(sorter);
  }

  // 按固定顺序输出
  return groupMeta
    .filter(g => buckets[g.key]?.length) // 没数据的组不显示
    .map(g => ({ key: g.key, title: g.title, list: buckets[g.key] }));
});

const flatSortedPlayers = computed(() => {
  // 默认模式不需要平铺
  if (sortBy.value === 'none') return [];
  const sorter = makeSorter();

  // 确保缺省值为 0，避免 NaN 干扰排序
  const norm = (p) => ({
    ...p,
    total_goals: Number(p.total_goals || 0),
    penalty_goals: Number(p.penalty_goals || 0),
    total_assists: Number(p.total_assists || 0),
  });

  return players.value.map(norm).sort(sorter);
});


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
  await fetchHonors()
  await fetchPlayers()
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
  display: flex;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 16px;
}
.back-button {
  position: static;
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
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
  align-items: center;
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
  flex: 1;            /* 占满剩余宽度，让右侧能贴右 */
  min-width: 0;
  padding-right: 200px;
}
.team-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* 防止过长名称把右侧挤掉 */
  min-width: 0;
}
.team-meta h2 {
  margin: 0;
  line-height: 1.2;
  font-size: 20px;
  font-weight: 700;
  word-break: break-word;
}
.team-status-inline {
  display: flex;
  align-items: flex-end;  /* 让条和文字基线更舒服 */
  gap: 10px;
  white-space: nowrap;    /* 避免换行 */
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

.status-bar-label {
  font-size: 13px;
  color: #666;
}

.status-bar-wrapper {
  display: flex;
  justify-content: center;    /* ✅ 水平居中 */
  align-items: center;        /* ✅ 垂直居中 */
  height: 80px;               /* ✅ 控制上下间距 */
  margin: 10px 0;
}

/* 还原为紧凑型条，不要左侧大空白 */
.status-bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 28px;           /* 比之前略低，和卡片协调 */
  margin: 0;              /* 关键：不要 margin-left */
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
.schedule-list { display: flex; flex-direction: column; gap: 8px; }
.schedule-item {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr 0.8fr 1.6fr; /* 时间场地 | 本队 | 结果 | 对手 */
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
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #374151;
}
.dialog-header { display: flex; align-items: baseline; gap: 12px; }
.dialog-sub { font-size: 13px; color: #6b7280; }
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
.honor-subtitle {
  color: #000000;
  font-size: 22px;
  margin-bottom: 30px;
  
}
/* 荣誉卡片整体风格与赛程一致 */
.honor-card{
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 10px;
  padding: 16px 18px;
  margin-top: 16px;
}

/* 空状态 */
.honor-empty{
  color: #9aa1ad;
  font-size: 13px;
  padding: 8px 2px;
}

/* 列表样式 */
.honor-list{
  list-style: none;
  margin: 0;
  padding: 4px 2px 2px 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.honor-item{
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background .15s ease;
}
.honor-item:hover{
  background: #f8fafc;
}

/* 左侧小圆点（可替换主色） */
.honor-dot{
  width: 8px; height: 8px; margin-top: 6px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.15);
}

.honor-content{ min-width: 0; }
.honor-title{
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.honor-date{
  font-size: 12px;
  color: #6b7280;
}
.honor-desc{
  margin-top: 2px;
  color: #374151;
  line-height: 1.45;
  word-break: break-word;
}

/* 工具条 */
.players-toolbar{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.toolbar-left{
  display: flex;
  align-items: center;
}
.ml8{ margin-left: 8px; }

/* 分组标题 */
.players-group{ margin-bottom: 16px; }
.group-header{
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  letter-spacing: .02em;
  margin: 10px 2px 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.group-header::before{
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #60a5fa; /* 轻蓝点缀 */
}
/* 右栏卡片网格 */
.players-card-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

/* 单张卡 */
.player-card{
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow .15s ease, transform .15s ease;
}
.player-card:hover{
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
}
.flat-header{
  font-size: 12px;
  color: #6b7280;
  margin: 6px 2px 10px;
}


/* 头像 + 姓名行 */
.pc-header{
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: center;
}
.pc-avatar{
  border: 2px solid #eef1f4;
  background: #f8fafc;
}
.pc-name-line{
  min-width: 0;
}
.pc-name{
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-tags{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.pc-tag{
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

/* 统计区 */
.pc-stats{
  border-top: 1px dashed #e5e7eb;
  padding-top: 8px;
}
.pc-stats-head, .pc-stats-body{
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
}
.pc-stats-head{
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}
.pc-stats-body{
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.pc-stats-body small{
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  margin-left: 2px;
}
.pc-goals, .pc-assists{
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1.1;
}

.el-timeline {
  padding-left: 20px;
  
}

.el-timeline-item__timestamp {
  color: #aaa;
}

.el-timeline-item__content {
  background: #2c3e50;
  color: #ecf0f1;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.el-timeline-item__content strong {
  color: #3498db;
}

.el-timeline-item__tail {
  background-color: #7f8c8d;
}

.el-timeline-item__node {
  background-color: #3498db;
}
.honor{
  height: 100px;

  margin-right: auto;
  padding-left: 2%;
  width:100%;
  height: 50%;
  
  
}
</style>
