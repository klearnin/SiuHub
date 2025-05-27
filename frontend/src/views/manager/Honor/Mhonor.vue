<template>
    <div class="honor-page"> <!-- 添加 honor-page 类 -->
        <!-- 顶部按钮 -->
        <div class="honor-header">
            <el-button @click="goBack">返回首页</el-button>
            <h2 class="honor-title">球队荣誉</h2>
            <el-button type="success" @click="addDialogVisible = true">录入荣誉</el-button>
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
                @click="handleHonorClick(item, 'team')"
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
                @click="handleHonorClick(item, 'personal')"
            >
            <p><strong>{{ item.title }}（{{ item.user_name }}）</strong></p>
            <p>{{ item.description }}</p>
            </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <!-- 荣誉录入弹窗 -->
    <el-dialog v-model="addDialogVisible" title="录入荣誉" width="400px">
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
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHonor">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="荣誉详情" width="400px">
        <template #default>
            <div v-if="!editMode">
            <p><strong>奖项：</strong>{{ selectedHonor.title }}</p>
            <p><strong>描述：</strong>{{ selectedHonor.description }}</p>
            <p><strong>时间：</strong>{{ formatDate(selectedHonor.honor_date) }}</p>
            <p v-if="selectedHonor.type === 'personal'"><strong>球员：</strong>{{ selectedHonor.user_name }}</p>
            </div>
            <div v-else>
            <el-form label-width="60px">
                <el-form-item label="奖项">
                <el-input v-model="editForm.title" />
                </el-form-item>
                <el-form-item label="描述">
                <el-input v-model="editForm.description" />
                </el-form-item>
                <el-form-item label="时间">
                <el-date-picker v-model="editForm.honor_date" type="date" style="width: 100%;" />
                </el-form-item>
                <el-form-item v-if="editForm.type === 'personal'" label="球员">
                    <el-select v-model="editForm.user_id" placeholder="选择球员">
                        <el-option v-for="p in players" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            </div>
        </template>

        <template #footer>
            <el-button @click="viewDialogVisible = false">关闭</el-button>
            <el-button v-if="!editMode" type="warning" @click="enterEditMode" style="margin-left: 8px;">修改</el-button>
            <el-button v-else type="warning" @click="submitEdit" style="margin-left: 8px;">保存</el-button>
            <el-button type="danger" @click="deleteHonor" style="margin-left: 8px;">删除</el-button>
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
const addDialogVisible = ref(false)      // 控制录入弹窗
const viewDialogVisible = ref(false)     // 控制查看弹窗
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

    // 确保 honor_date 是字符串格式
    if (payload.honor_date instanceof Date) {
      const d = payload.honor_date
      payload.honor_date = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    }
    else if (typeof payload.honor_date === 'string') {
        payload.honor_date = payload.honor_date.slice(0, 10)
    }

    const url = form.value.type === 'team' ? '/team' : '/personal'
    await axios.post(`http://localhost:5000/api/honor${url}`, payload, { headers })

    ElMessage.success('录入成功')
    addDialogVisible.value = false
    fetchHonors()
  } catch (err) {
    console.error("录入失败", err.response?.data || err.message)
    ElMessage.error(err.response?.data?.msg || '录入失败')  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const editMode = ref(false)
const selectedHonor = ref({})
const editForm = ref({
  id: '',
  type: '',
  title: '',
  description: '',
  honor_date: '',
  user_id: '',
  user_name: ''
})

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
    honor_date: item.honor_date,
    user_id: item.user_id || '',
    user_name: item.user_name || ''
  }
  editMode.value = false
  viewDialogVisible.value = true   // ✅ 使用新的变量
}

const enterEditMode = () => {
  editMode.value = true
}

const submitEdit = async () => {
  try {
    if (!editForm.value.id) {
    ElMessage.error('缺少荣誉ID，无法提交修改')
    return
    }

const honorDate = editForm.value.honor_date

const payload = {
  ...editForm.value,
  honor_date: honorDate instanceof Date
  ? `${honorDate.getFullYear()}-${(honorDate.getMonth()+1).toString().padStart(2, '0')}-${honorDate.getDate().toString().padStart(2, '0')}`
  : typeof honorDate === 'string'
    ? honorDate.slice(0, 10)
    : ''
}

if (payload.type === 'personal' && !payload.user_id) {
  ElMessage.error('个人荣誉必须选择球员')
  return
}

const url = payload.type === 'team'
  ? `/api/honor/team/${payload.id}`
  : `/api/honor/personal/${payload.id}`

await axios.put(`http://localhost:5000${url}`, payload, { headers })
    ElMessage.success('修改成功')
    viewDialogVisible.value = false
    fetchHonors()
  } catch (err) {
    console.error("修改失败", err.response?.data || err.message)
    ElMessage.error(err.response?.data?.msg || '修改失败')
    }

}

const deleteHonor = async () => {
  try {
    if (!selectedHonor.value?.id) {
    ElMessage.error('无法删除：荣誉ID缺失')
    return
    }

    await axios.delete(`http://localhost:5000/api/honor/${selectedHonor.value.type}/${selectedHonor.value.id}`, { headers })
    ElMessage.success('删除成功')
    viewDialogVisible.value = false
    fetchHonors()
  } catch (err) {
    ElMessage.error('删除失败')
  }
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
.honor-page {
  background: #f5f7fa; /* ✅ 与经理主页一致 */
  min-height: 100vh;
  padding: 40px 30px;  /* ✅ 页面边缘留白 */
  box-sizing: border-box;
}

.honor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.honor-title {
  font-size: 28px;
  font-weight: bold;
  color: #0154a0;
  text-align: center;
}

.honor-section {
  display: flex;
  gap: 24px;
  justify-content: space-between;
  padding: 0 10px; /* ✅ 左右留距 */
}

.honor-box {
  flex: 1;
  min-width: 360px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.honor-subtitle {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
  text-align: center;
}

.el-timeline-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.el-timeline-item__content {
  background-color: #fdfdfd;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 8px;
}

.el-timeline-item__content p:first-child {
  font-size: 18px;     /* ✅ 荣誉标题字号加大 */
  font-weight: bold;
  margin-bottom: 4px;  /* ✅ 缩小标题与描述之间的间距 */
}

.el-timeline-item__content p:last-child {
  font-size: 14px;
  color: #555;
  margin: 0;
}

</style>
