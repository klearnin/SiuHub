<template>
  <div class="coach-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <router-link to="/forum" class="nav-item">论坛</router-link>
      <router-link to="/cmanageTeam" class="nav-item">人员管理</router-link>
      <router-link to="/teamstats" class="nav-item">主队查看</router-link>
      <router-link to="/Cschedule" class="nav-item">球队日程</router-link>
      <router-link to="/ctacticcanvas" class="nav-item">战术画板</router-link>
      <router-link to="/cvideo" class="nav-item">视频管理</router-link>
   
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
            <li @click="opentransferCoach">教练转让</li>
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

    <!-- 教练转让弹窗 -->
    <el-dialog v-model="transferVisible" title="教练转让" width="30%">
      <div class="transfer-dialog">
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索人员..."
            prefix-icon="Search"
            clearable
            @input="filterUsers"
          />
        </div>
        
        <div class="user-list">
          <div
            v-for="user in filteredUsers"
            :key="user.uid"
            class="user-item"
            :class="{ 'selected': selectedUser && selectedUser.uid === user.uid }"
            @click="selectUser(user)"
          >
            <div class="user-info">
              <div class="user-name">{{ user.player_name||user.name }}</div>
              <div class="user-role">{{ getUserRole(user) }}</div>
            </div>
            <div class="user-action">
              <el-button
                type="primary"
                size="small"
                @click.stop="transferCoach(user.uid)"
              >
                转让
              </el-button>
            </div>
          </div>
          
          <div v-if="filteredUsers.length === 0" class="empty-state">
            暂无相关人员
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 信息展示面板 -->
    <div class="info-panel">
      <!-- 球队人员概况 -->
      <div class="info-card team-overview">
        <div class="card-header">
          <h3>球队人员概况</h3>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ playerCount }}</div>
              <div class="stat-label">球员</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ managerCount }}</div>
              <div class="stat-label">经理</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ doctorCount }}</div>
              <div class="stat-label">队医</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ coachCount }}</div>
              <div class="stat-label">教练</div>
            </div>
          </div>
          
        </div>
      </div>

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

      <!-- 球队荣誉 -->
      <div class="info-card team-honors">
        <div class="card-header">
          <h3>球队荣誉</h3>
        </div>
        <div class="card-content">
          <div v-if="teamHonors.length > 0" class="honors-list">
            <div v-for="honor in teamHonors" :key="honor.id" class="honor-item">
              <div class="honor-title">{{ honor.title }}</div>
              <div class="honor-date">{{ honor.date }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无荣誉记录</p>
          </div>
        </div>
      </div>

      <!-- 球队公告 -->
      <div class="info-card team-notices">
        <div class="card-header">
          <h3>最新公告</h3>
        </div>
        <div class="card-content">
          <div v-if="teamNotices.length > 0" class="notices-list">
            <div v-for="notice in teamNotices" :key="notice.id" class="notice-item">
              <div class="notice-header">
                <div class="notice-title">{{ notice.title }}</div>
                <el-tag
                  :type="notice.type === 'team' ? 'success' : 'info'"
                  size="small"
                  class="type-tag"
                >
                  {{ notice.type === 'team' ? '球队公告' : '球迷公告' }}
                </el-tag>
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
    
    <!-- 旋转大风车 -->
    <!--<div class="container">
      <div class="item">
        <img src="../../assets/1.jpg" alt="" />
      </div>
      <div class="item">
        <img src="../../assets/2.jpg" alt="" />
      </div>
      <div class="item">
        <img src="../../assets/3.jpg" alt="" />
      </div>
      <div class="item">
        <img src="../../assets/4.jpg" alt="" />
      </div>
      <div class="item-5">
        <img :src="avatarUrl" alt="" />
      </div>
    </div>-->
  </div>
  <Announcement />
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import Announcement from '@/components/Announcement.vue'

const router = useRouter();

// 响应式数据
const avatarUrl = ref(null);
const dropdownVisible = ref(false);
const inviteVisible = ref(false);
const transferVisible = ref(false);
const inviteCode = ref("");
const showNoticeDropdown = ref(false);
const showAiDropdown = ref(false);
const searchKeyword = ref('');
const selectedUser = ref(null);
const users = ref([]); // 修正：确保 users 是响应式数组

// 信息模块数据
const recentMatches = ref([]);
const nextMatch = ref(null);
const teamHonors = ref([]);
const teamNotices = ref([]);
const teamname = ref('');
const teamLogo = ref(null);
const teamlist = ref([]);


function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (err) {
    console.error("Token解析失败", err);
    return {};
  }
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


// 计算属性 - 过滤用户列表
const filteredUsers = computed(() => {
   const token = localStorage.getItem("token");
   let userId=null;
  if (token) {
    const payload = parseJwt(token);
     userId = payload.userId;
  }
 // 首先过滤掉当前用户
 let filtered = users.value.filter(user => user.uid !== userId);
  // 如果没有搜索关键词，返回过滤后的列表
  if (!searchKeyword.value) {
    return filtered;
  }
  
  // 如果有搜索关键词，进一步过滤
  const keyword = searchKeyword.value.toLowerCase();
  return filtered.filter(user => {
    const name = (user.player_name || user.name || '').toLowerCase();
    const role = getUserRole(user).toLowerCase();
    return name.includes(keyword) || role.includes(keyword);
  });
});

// 信息模块计算属性
const playerCount = computed(() => {
  return users.value.filter(user => user.type === 'player').length;
});

const managerCount = computed(() => {
  return users.value.filter(user => user.type === 'manager').length;
});

const doctorCount = computed(() => {
  return users.value.filter(user => user.type === 'medic').length;
});

const coachCount = computed(() => {
  return users.value.filter(user => user.type === 'coach').length;
});

const recentUsers = computed(() => {
  // 返回最近添加的5个用户
  return users.value.slice(0, 5);
});

// 获取用户角色
const getUserRole = (user) => {
  if (user.role) return user.role;
  if (user.player_name) return '球员';
  if (user.type === 'manager') return '经理';
  if (user.type === 'medic') return '队医';
  if(user.type ==='coach') return '教练';
  if(user.type ==='fan') return '球迷';
  return '未知角色';
};

// 获取头像URL
const getAvatarUrl = (user) => {
  // 如果有真实头像URL，返回真实URL
  if (user.avatar) {
    return `http://localhost:5000${user.avatar}`;
  }
  // 否则返回默认头像
  return 'https://via.placeholder.com/40x40?text=' + (user.player_name || user.name || 'U').charAt(0);
};

// 合并的 onMounted
onMounted(async () => {
  // 检查权限
  const token = localStorage.getItem("token");
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userType = payload.type;
    console.log(`👮 页面内部检查身份: ${userType}`);
    if (userType !== "coach") {
      ElMessage.error("无权访问该页面");
      router.replace("/login");
      return;
    }
  } else {
    ElMessage.error("请先登录");
    router.replace("/login");
    return;
  }

  // 获取头像
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

  // 获取用户列表
  await fetchUserList();

  await fetchTeamHonors();
  await fetchTeamInfo1();
  await fetchSchedules()
  await fetchRecentMatchStatus();

  // 获取球队信息和下场比赛数据
  await fetchTeamInfo();
  await fetchNextMatch();
  
  // 获取公告数据
  await fetchNotices();
});

// 获取用户列表
const fetchUserList = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/player/list", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    users.value = response.data.userlist || []; // 修正：使用 users.value
    console.log("获取用户列表成功:", users.value);
  } catch (error) {
    console.error('获取球员列表失败', error);
    ElMessage.error('获取球员列表失败');
  }
};

// 打开邀请码弹窗
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
    ElMessage.error("获取邀请码失败");
  }
};

// 复制邀请码
const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value);
    ElMessage.success("邀请码已复制到剪贴板！");
  } catch (err) {
    ElMessage.error("复制失败，请手动复制");
  }
};

// 更新邀请码
const updateInviteCode = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post("http://localhost:5000/api/coach/update-invite-code", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    inviteCode.value = res.data.inviteCode;
    ElMessage.success("邀请码更新成功");
  } catch (err) {
    console.error("更新邀请码失败", err);
    ElMessage.error("更新邀请码失败");
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

// 跳转到审核页面
const goToReview = () => {
  router.push("/chome/review");
};

// 打开教练转让弹窗
const opentransferCoach = async () => {
  transferVisible.value = true;
  selectedUser.value = null;
  searchKeyword.value = '';
  
  // 如果用户列表为空，则获取用户列表
  if (users.value.length === 0) {
    await fetchUserList();
  }
};

// 选择用户
const selectUser = (user) => {
  selectedUser.value = user;
};

// 过滤用户（计算属性会自动更新，这里保留函数但不做操作）
const filterUsers = () => {
  // 计算属性会自动更新，这里不需要额外操作
};

// 教练转让函数
const transferCoach = async (userId) => {
  if (!userId) {
    ElMessage.warning('请选择要转让的用户');
    return;
  }
  
  try {
    // 确认转让
    await ElMessageBox.confirm(
      '确定要将教练权限转让给该用户吗？此操作不可撤销。',
      '确认转让',
      {
        confirmButtonText: '确定转让',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 执行转让请求 - 修正URL和参数
    const response = await axios.put(
      `http://localhost:5000/api/player/transfer/ ${userId}`,
      {}, // 空请求体，因为用户ID通过URL参数传递
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (response.data.code === 0) {
      ElMessage.success('教练转让成功');
      transferVisible.value = false;
      logout();
      // 转让成功后，可能需要重新登录或刷新页面
      // 因为当前用户的身份已经从 coach 变为 fan
      setTimeout(() => {
        // 可以选择重新加载页面或跳转到登录页
        window.location.reload();
        // 或者：router.push('/login');
      }, 1500);
      
    } else {
      ElMessage.error(response.data.msg || '教练转让失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作，不做任何处理
      return;
    }
    
    console.error('教练转让失败', error);
    
    // 更详细的错误处理
    if (error.response) {
      // 服务器返回错误状态码
      ElMessage.error(error.response.data.msg || `转让失败: ${error.response.status}`);
    } else {
      ElMessage.error('教练转让失败，请稍后重试');
    }
  }
};

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

// 获取球队荣誉
const fetchTeamHonors = async () => {
  try {
    const teamRes = await axios.get('http://localhost:5000/api/honor/team', {  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

    teamHonors.value = teamRes.data.data

  } catch (error) {
    console.error('获取球队荣誉失败:', error);
    ElMessage.error('获取球队荣誉失败');
    teamHonors.value = [];
  }
};

const fetchRecentMatchStatus = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/team/team-match-scores', {  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    recentMatches.value = res.data.data || []
  } catch (err) {
    ElMessage.error('加载比赛状态失败')
  }
}

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

// 获取公告数据
const fetchNotices = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/notice/list", {
      params: {
        page: 1,
        size: 3, // 只获取最新的3条公告
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.data.code === 0 && res.data.data && res.data.data.notices) {
      // 处理公告数据，格式化日期和内容预览
      teamNotices.value = res.data.data.notices.map(notice => ({
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

/* 教练转让弹窗样式 - 新增部分 */
.transfer-dialog {
  padding: 10px 0;
}

.search-section {
  margin-bottom: 20px;
}

.user-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-item.selected {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.user-action {
  margin-left: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

/* 滚动条样式 */
.user-list::-webkit-scrollbar {
  width: 6px;
}

.user-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 信息面板样式 - 优化版 */
.info-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

/* 基础卡片样式 */
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

/* 差异化卡片尺寸 */
.team-overview {
  grid-column: 1 / 2;
  grid-row: 1;
  height: 380px;
}

.next-match {
  grid-column: 1 / 2;
  grid-row: 2;
}

.recent-matches {
  grid-column: 2 / 4;
  grid-row: 1;
  height: 380px;
}

.team-honors {
  grid-column: 2 / 3;
  grid-row: 2;
}

.team-notices {
  grid-column: 3 / 4;
  grid-row: 2;
}

/* 差异化头部颜色主题 */
.team-overview .card-header {
  background: linear-gradient(135deg, #2E8B57, #66CDAA);
  border-bottom: 3px solid #228B22;
}

.recent-matches .card-header {
  background: linear-gradient(135deg, #4169E1, #87CEEB);
  border-bottom: 3px solid #1E90FF;
}

.next-match .card-header {
  background: linear-gradient(135deg, #0f5580, #1b96d4);
  border-bottom: 3px solid #0e5071;
}

.team-honors .card-header {
  background: linear-gradient(135deg, #DAA520, #F0E68C);
  border-bottom: 3px solid #B8860B;
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
  height: 80%;
  padding: 28px;
}

/* 球队人员概况样式 - 优化版 */
.stats-grid {
  height: 80%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px 12px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s ease;
}

.stat-item:hover {
  background: linear-gradient(145deg, #e9ecef, #dee2e6);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-item:hover::before {
  left: 100%;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #2E8B57;
  margin-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.stat-label {
  font-size: 14px;
  color: #495057;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.recent-users h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #495057;
  font-weight: 600;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.user-item:hover {
  background: #f8f9fa;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e9ecef;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: #6c757d;
}

/* 比赛信息样式 - 优化版 */
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

.match-score {
  font-weight: 800;
  color: #1E90FF;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.match-date {
  font-size: 13px;
  color: #7f8c8d;
  font-weight: 500;
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

/* 荣誉和公告样式 - 优化版 */
.honors-list,
.notices-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.honor-item {
  padding: 16px;
  background: linear-gradient(145deg, #fffaf0, #ffe8cc);
  border-radius: 12px;
  border-left: 6px solid #DAA520;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(218, 165, 32, 0.1);
  position: relative;
  overflow: hidden;
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

.honor-item::before,
.notice-item::before {
  content: '';
  position: absolute;
  top: 0;
  right: -50%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: skewX(-15deg);
  transition: right 0.6s ease;
}

.honor-item:hover,
.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.honor-item:hover::before,
.notice-item:hover::before {
  right: 150%;
}

.honor-item:hover {
  border-left-color: #B8860B;
  box-shadow: 0 4px 20px rgba(218, 165, 32, 0.2);
}

.notice-item:hover {
  border-left-color: #6A5ACD;
  box-shadow: 0 4px 20px rgba(147, 112, 219, 0.2);
}

.honor-title,
.notice-title {
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
  line-height: 1.4;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.notice-title {
  flex: 1;
  margin-bottom: 0;
}

.type-tag {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.notice-content {
  font-size: 13px;
  color: #5a6c7d;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.honor-date,
.notice-date {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 14px;
}

.empty-state p {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .info-panel {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto auto auto;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
  }
  
  .team-overview {
    grid-column: 1 / 2;
    grid-row: 1;
  }
  
  .next-match {
    grid-column: 1 / 2;
    grid-row: 2;
  }
  
  .recent-matches {
    grid-column: 2 / 3;
    grid-row: 1;
  }
  
  .team-honors {
    grid-column: 2 / 3;
    grid-row: 2;
  }
  
  .team-notices {
    grid-column: 1 / 3;
    grid-row: 3;
  }
}

@media (max-width: 768px) {
  .info-panel {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    padding: 16px;
    gap: 16px;
    max-width: 100%;
  }
  
  .team-overview,
  .next-match,
  .recent-matches,
  .team-honors,
  .team-notices {
    grid-column: 1 / 2;
    grid-row: auto;
    min-height: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-header {
    padding: 16px 20px;
  }
  
  .card-header h3 {
    font-size: 18px;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .match-teams {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .team-info {
    min-width: auto;
  }
  
  .team-logo {
    width: 60px;
    height: 60px;
  }
  
  .team-logo-placeholder {
    width: 60px;
    height: 60px;
  }
  
  .vs {
    font-size: 20px;
    padding: 8px 0;
  }
}
</style>




