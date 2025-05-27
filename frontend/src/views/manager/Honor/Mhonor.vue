<template>
  <div class="match-today-page">
    <!-- 顶部栏：返回 + 标题 + 录入按钮 -->
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
      <h2 class="page-title">球队荣誉</h2>
      <el-button type="success" class="add-button" @click="dialogVisible = true">录入荣誉</el-button>
    </div>

    <div class="honor-section">
      <!-- 左边：球队荣誉 -->
      <div class="honor-box">
        <h3 class="honor-subtitle">球队荣誉</h3>
        <el-timeline>
          <el-timeline-item
            v-for="item in teamHonors"
            :key="item.id"
            :timestamp="formatDate(item.honor_date)"
            placement="top"
          >
            <p><strong>{{ item.title }}</strong></p>
            <p>{{ item.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 右边：个人荣誉 -->
      <div class="honor-box">
        <h3 class="honor-subtitle">个人荣誉</h3>
        <el-timeline>
          <el-timeline-item
            v-for="item in personalHonors"
            :key="item.id"
            :timestamp="formatDate(item.honor_date)"
            placement="top"
          >
            <p><strong>{{ item.title }}</strong></p>
            <p>{{ item.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <!-- 荣誉录入弹窗 -->
    <el-dialog v-model="dialogVisible" title="录入荣誉" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="球队" value="team" />
            <el-option label="个人" value="personal" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === 'personal'" label="球员">
          <el-select v-model="form.user_id" placeholder="选择球员">
            <el-option v-for="p in players" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="form.honor_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="奖项">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHonor">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const dialogVisible = ref(false)
const teamHonors = ref([])
const personalHonors = ref([])
const players = ref([])
const form = ref({
  type: '',
  user_id: '',
  honor_date: '',
  title: '',
  description: ''
})

const token = localStorage.getItem('token')
const headers = { Authorization: `Bearer ${token}` }

const goBack = () => router.push('/mhome')

const fetchHonors = async () => {
  try {
    const teamRes = await axios.get('http://localhost:5000/api/honor/team', { headers })
    const personalRes = await axios.get('http://localhost:5000/api/honor/team/personal-overview', { headers })
    teamHonors.value = teamRes.data.data
    personalHonors.value = personalRes.data.data
  } catch (err) {
    ElMessage.error('加载荣誉失败')
  }
}

const fetchPlayers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/honor/players', { headers })
    players.value = res.data.data
  } catch (err) {
    ElMessage.error('球员获取失败')
  }
}

const submitHonor = async () => {
  try {
    // 格式化 honor_date 为 YYYY-MM-DD
    const payload = { ...form.value }
    payload.honor_date = payload.honor_date?.slice(0, 10)

    const url = form.value.type === 'team' ? '/team' : '/personal'
    await axios.post(`http://localhost:5000/api/honor${url}`, payload, { headers })

    ElMessage.success('录入成功')
    dialogVisible.value = false
    fetchHonors()
  } catch (err) {
    ElMessage.error('录入失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  if (!token) {
    ElMessage.error('请先登录')
    router.replace('/login')
  } else {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.type !== 'manager') {
      ElMessage.error('无权访问')
      router.replace('/login')
    }
    fetchHonors()
    fetchPlayers()
  }
})
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #0154a0;
  text-align: center;
}
.back-button,
.add-button {
  height: 36px;
  padding: 0 14px;
}
.honor-section {
  display: flex;
  gap: 24px;
  justify-content: space-between;
}
.honor-box {
  flex: 1;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
  overflow-y: auto;
}
.honor-subtitle {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
  text-align: center;
}
</style>
