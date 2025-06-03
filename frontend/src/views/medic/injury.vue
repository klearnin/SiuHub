<template>
  <div class="match-today-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
      <h2 class="page-title">伤病管理</h2>
    </div>

    <div v-if="loading" class="loading">正在加载球员伤病数据...</div>

    <div v-else class="event-list">
      <el-button type="primary" @click="openAddDialog" class="mb-4">添加伤病记录</el-button>
      <el-table :data="players" style="width: 100%" @row-click="handleRowClick">
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" shape="circle" size="medium" />
          </template>
        </el-table-column>
        <el-table-column prop="player_name" label="球员" />
        <el-table-column prop="health" label="健康状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.health === 'healthy' ? 'success' : 'danger'">
              {{ row.health === 'healthy' ? '健康' : '受伤' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="injury_name" label="当前伤病" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              type="success"
              @click.stop="recoverPlayer(row.id)"
              v-if="row.health === 'injured'"
            >
              康复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 伤病详情&编辑 -->
    <el-dialog v-model="dialogVisible" width="500px">
      <template #title>
        <span style="color: #0154a0; font-size: 20px; font-weight: bold;">球员详情</span>
      </template>
      <div class="text-center mb-4">
        <el-avatar :src="formatAvatar(selectedPlayer.avatar)" size="large" />
      </div>

      <el-descriptions :column="1" border class="mb-4">
        <el-descriptions-item label="姓名">{{ selectedPlayer.player_name }}</el-descriptions-item>
        <el-descriptions-item label="身高">{{ selectedPlayer.height }} cm</el-descriptions-item>
        <el-descriptions-item label="体重">{{ selectedPlayer.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="selectedPlayer.health === 'healthy' ? 'success' : 'danger'">
            {{ selectedPlayer.health === 'healthy' ? '健康' : '受伤' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <h4 style="color: #0154a0; font-size: 18px; font-weight: bold; margin-top: 20px;">
        伤病记录
      </h4>
      <el-timeline v-if="history.length">
        <el-timeline-item v-for="injury in history" :key="injury.id" :timestamp="formatDate(injury.injury_date)">
          <p><strong>伤病：</strong>{{ injury.injury_name }}</p>
          <p><strong>描述：</strong>{{ injury.description }}</p>
          <p><strong>恢复期：</strong>{{ injury.recovery_days }} 天</p>
          <el-button size="small" type="primary" @click="editInjury(injury)">修改</el-button>
          <el-button size="small" type="danger" @click="deleteInjury(injury.id)">删除</el-button>
        </el-timeline-item>
      </el-timeline>
      <p v-else class="text-gray-500">暂无历史记录</p>
    </el-dialog>

    <!-- 添加/编辑 -->
    <el-dialog v-model="formVisible" :title="form.id ? '修改伤病' : '添加伤病'" width="450px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="球员">
          <el-select v-model="form.player_id" :disabled="form.id" placeholder="选择球员">
            <el-option v-for="p in players" :key="p.id" :label="p.player_name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="伤病名称">
          <el-input v-model="form.injury_name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="受伤日期">
          <el-date-picker v-model="form.injury_date" type="date" disabled/>
        </el-form-item>
        <el-form-item label="恢复天数">
          <el-input-number v-model="form.recovery_days" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const token = localStorage.getItem('token')
const headers = token ? { Authorization: `Bearer ${token}` } : {}

const players = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const formVisible = ref(false)
const selectedPlayer = ref({})
const history = ref([])

const form = ref({
  id: null,
  player_id: '',
  injury_name: '',
  description: '',
  injury_date: '',
  recovery_days: 7
})

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const fetchPlayers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/injury/players-with-health', { headers })
    players.value = (res.data.data || []).map(player => ({
      ...player,
      avatar: player.avatar ? `http://localhost:5000${player.avatar}` : ''
    }))
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const formatAvatar = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `http://localhost:5000${path}`
}
const handleRowClick = async (row) => {
  const [profileRes, injuryRes] = await Promise.all([
    axios.get(`http://localhost:5000/api/injury/player/${row.id}`, { headers }),
    axios.get(`http://localhost:5000/api/injury/history/${row.id}`, { headers })
  ])
  selectedPlayer.value = {
    ...profileRes.data.data,
    avatar: formatAvatar(profileRes.data.data.avatar)
  }
  history.value = injuryRes.data.data
  dialogVisible.value = true
}

const openAddDialog = () => {
  const today = new Date()
  form.value = {
    id: null,
    player_id: '',
    injury_name: '',
    description: '',
    injury_date: today,
    recovery_days: 7
  }
  formVisible.value = true
}

const editInjury = (injury) => {
  form.value = {
    ...injury,
    injury_date: new Date(injury.injury_date) // 保证展示格式正确
  }
  formVisible.value = true
}

const deleteInjury = async (id) => {
  await ElMessageBox.confirm('确认删除该记录？', '警告', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  await axios.delete(`http://localhost:5000/api/injury/delete/${id}`, { headers })
  ElMessage.success('删除成功')
  dialogVisible.value = false
  fetchPlayers()
}

const recoverPlayer = async (playerId) => {
  console.log("正在尝试康复球员 ID:", playerId)

  try {
    await ElMessageBox.confirm(
      '确认将该球员标记为健康吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await axios.patch(`http://localhost:5000/api/injury/recover/${playerId}`, { headers });
    ElMessage.success("球员已标记为康复");
    fetchPlayers(); // 刷新数据
  } catch (err) {
    // 如果用户取消了，不报错；只有真正出错时才报错
    if (err !== 'cancel') {
      ElMessage.error("康复操作失败");
    }
  }
};

const submitForm = async () => {
  const data = { ...form.value }

  // ✅ 格式化日期
  data.injury_date = formatDate(data.injury_date)

  try {
    if (form.value.id) {
      await axios.put(`http://localhost:5000/api/injury/update/${form.value.id}`, data, { headers })
      ElMessage.success('修改成功')
    } else {
      const res = await axios.post('http://localhost:5000/api/injury/add', data, { headers })
      if (res.data.code === 1) return ElMessage.warning(res.data.msg)
      ElMessage.success('添加成功')
    }
    formVisible.value = false
    dialogVisible.value = false
    fetchPlayers()
  } catch {
    ElMessage.error('提交失败')
  }
}


const goBack = () => {
  if (!token) return router.push('/login')
  const type = JSON.parse(atob(token.split('.')[1])).type
  const routeMap = {
    medic: '/dhome'
  }
  router.push(routeMap[type] || '/login')
}

onMounted(() => {
  if (!token) {
    ElMessage.error('请先登录')
    router.replace('/login')
    return
  }
  fetchPlayers()
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
  height: 40px;
}
.back-button {
  position: absolute;
  left: 0;
  top: 0;
  height: 36px;
  padding: 0 14px;
}
.page-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #0154a0;
  margin: 0;
  line-height: 40px;
}
.loading {
  text-align: center;
  font-size: 18px;
  color: #888;
}
.event-list {
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
</style>
