<template>
  <div class="match-today-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
      <h2 class="page-title">伤病管理</h2>
    </div>

    <div v-if="loading" class="loading">正在加载球员伤病数据...</div>

    <div v-else class="event-list">
      <el-table :data="players" style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="player_name" label="球员" />
        <el-table-column prop="injury_days" label="伤病天数" width="120" />
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="修改伤病信息" width="400px">
      <el-form label-width="80px">
        <el-form-item label="球员">
          <el-input v-model="selectedPlayer.player_name" disabled />
        </el-form-item>
        <el-form-item label="伤病天数">
          <el-input-number v-model="selectedPlayer.injury_days" :min="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveInjury">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const token = localStorage.getItem('token')
const headers = token ? { Authorization: `Bearer ${token}` } : {}

const loading = ref(true)
const players = ref([])
const dialogVisible = ref(false)
const selectedPlayer = ref({})

const fetchPlayers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/injury/list', { headers })
    players.value = res.data.data || []
  } catch (err) {
    ElMessage.error('加载球员伤病数据失败')
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  selectedPlayer.value = { ...row }
  dialogVisible.value = true
}

const saveInjury = async () => {
  try {
    await axios.put(`http://localhost:5000/api/injury/update/${selectedPlayer.value.id}`, {
      injury_days: selectedPlayer.value.injury_days
    }, { headers })
    ElMessage.success('更新成功')
    dialogVisible.value = false
    fetchPlayers()
  } catch (err) {
    ElMessage.error('更新失败')
  }
}

const goBack = () => {
  router.push('/dhome');
}

onMounted(() => {
  if (!token) {
    ElMessage.error('请先登录')
    router.replace('/login')
    return
  }

  const payload = JSON.parse(atob(token.split('.')[1]))
  if (payload.type !== 'medic') {
    ElMessage.error('无权访问该页面')
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
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
