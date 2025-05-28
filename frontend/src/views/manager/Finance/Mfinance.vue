<template>
  <div class="match-today-page">

    <div class="top-bar">
    <el-button @click="goBack" class="back-button" type="primary">
        返回首页
    </el-button>
    <h2 class="page-title">财政管理</h2>
    </div>

    <div v-if="loading" class="loading">正在加载财政数据...</div>

    <div v-else>
    <div class="top-section">
        <!-- 左侧：录入表单 -->
        <div class="event-form">
        <div class="form-title">录入财政变更</div>
        <div class="form-wrapper">
            <el-form :model="form" label-width="100px" class="form-inner">
            <el-form-item label="金额">
                <el-input v-model.number="form.amount" placeholder="正为收入，负为支出" />
            </el-form-item>
            <el-form-item label="原因">
                <el-input v-model="form.reason" placeholder="请输入变更原因" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSubmit">{{ form.id ? "修改记录" : "添加记录" }}</el-button>
                <el-button v-if="form.id" @click="resetForm">取消修改</el-button>
            </el-form-item>
            </el-form>
        </div>
        </div>

        <!-- 右侧：资金折线图 -->
        <div class="trend-chart">
        <LineChart :data="trendData" />
        </div>
    </div>

    <!-- 下方记录表格 -->
        <div class="event-list">
            <div style="margin-bottom: 16px;">
            当前剩余资金：<strong>{{ balance }} 元</strong>
            </div>
            <el-table :data="records" style="width: 100%;" @row-click="handleRowClick">
                <el-table-column prop="amount" label="金额" width="100" />
                <el-table-column prop="reason" label="原因" />
                <el-table-column label="时间" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.created_at) }}
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>

    <!-- 弹窗：查看/删除记录 -->
        <el-dialog v-model="dialogVisible" title="资金记录详情" width="400px">
        <template #default>
            <div v-if="!editMode">
            <p><strong>金额：</strong>{{ selected.amount }} 元</p>
            <p><strong>原因：</strong>{{ selected.reason }}</p>
            <p><strong>时间：</strong>{{ formatDate(selected.created_at) }}</p>
            <p><strong>当前余额：</strong>{{ selected.balance }} 元</p>
            </div>
            <div v-else>
            <el-form label-width="60px">
                <el-form-item label="金额">
                <el-input v-model="editForm.amount" type="number" />
                </el-form-item>
                <el-form-item label="原因">
                <el-input v-model="editForm.reason" />
                </el-form-item>
            </el-form>
            </div>
        </template>

        <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="!editMode" type="warning" @click="enterEditMode" style="margin-left: 8px;">
            修改
        </el-button>
        <el-button v-else type="warning" @click="submitEdit" style="margin-left: 8px;">
            保存
        </el-button>
        <el-button v-if="!editMode" type="danger" @click="deleteRecord" style="margin-left: 8px">
            删除记录
        </el-button>
        </template>
        </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from "vue-router";
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

import LineChart from '@/components/FinanceLineChart.vue' // 自定义图表组件

const trendData = ref([])

const fetchTrend = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/finance/trend', { headers })
    trendData.value = res.data.data.slice(-8) // 取最近8条
  } catch (err) {
    ElMessage.error('加载趋势图失败')
  }
}


const token = localStorage.getItem('token')
let headers = {}

const router = useRouter();

const balance = ref(0)
const records = ref([])
const loading = ref(false)
const form = ref({ amount: 0, reason: '', id: null })
const selected = ref({})
const dialogVisible = ref(false)

const goBack = () => {
  router.push('/mhome')
}

const editMode = ref(false)
const editForm = ref({ amount: 0, reason: '' })

const enterEditMode = () => {
  editForm.value = {
    amount: selected.value.amount,
    reason: selected.value.reason
  }
  editMode.value = true
}

const submitEdit = async () => {
  try {
    await axios.put(`http://localhost:5000/api/finance/${selected.value.id}`, {
      amount: editForm.value.amount,
      reason: editForm.value.reason
    }, { headers })

    ElMessage.success('修改成功')
    dialogVisible.value = false
    editMode.value = false
    await fetchFinance()
    await fetchTrend()
  } catch (err) {
    ElMessage.error('修改失败')
  }
}

onMounted(() => {
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]))
    if (payload.type !== "manager") {
      ElMessage.error("无权访问该页面")
      router.replace("/login")
    }
    headers = { Authorization: `Bearer ${token}` }
    fetchFinance()
  } else {
    ElMessage.error("请先登录")
    router.replace("/login")
  }
    fetchTrend()
})

const fetchFinance = async () => {
  loading.value = true
  try {
    const [balRes, recRes] = await Promise.all([
      axios.get('http://localhost:5000/api/finance/balance', { headers }),
      axios.get('http://localhost:5000/api/finance/all', { headers })
    ])
    balance.value = balRes.data.data
    records.value = recRes.data.data
  } catch (err) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    if (!form.value.amount || !form.value.reason.trim()) {
      return ElMessage.warning('请填写完整信息')
    }
    if (form.value.id) {
      await axios.put(`http://localhost:5000/api/finance/${form.value.id}`, form.value, { headers })
      ElMessage.success('修改成功')
    } else {
      await axios.post('http://localhost:5000/api/finance/add', form.value, { headers })
      ElMessage.success('添加成功')
    }
    resetForm()
    fetchFinance()
    await fetchTrend()
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const resetForm = () => {
  form.value = { amount: 0, reason: '', id: null }
}

const handleRowClick = (row) => {
    selected.value = row
    editMode.value = false // 每次进入详情都重置编辑状态

    const match = trendData.value.find(item => item.id === row.id)
    selected.value.balance = match ? match.balance : '未知'

    dialogVisible.value = true
}

const formatDate = (isoTime) => {
  const date = new Date(isoTime)
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}


const deleteRecord = async () => {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', {
  type: 'warning',
  confirmButtonText: '确定',
  cancelButtonText: '取消'
})
    await axios.delete(`http://localhost:5000/api/finance/${selected.value.id}`, { headers })
    ElMessage.success('删除成功')
    dialogVisible.value = false
    fetchFinance()
    await fetchTrend()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.match-detail-columns {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.event-form {
  flex: 1;
  min-width: 300px;
  max-width: 360px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.event-list {
  flex: 2;
  min-width: 340px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.match-today-page {
  max-width: 100%;
  padding: 30px 40px;
  background: #f5f7fa;
}
.loading {
  text-align: center;
  font-size: 18px;
  color: #888;
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
  line-height: 1;
}

.page-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #0154a0;
  margin: 0;
  line-height: 40px;
}

.back-text {
  display: inline-block;
  line-height: 1;
}
.top-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.event-form {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;

  display: flex;               /* ✅ 启用 Flex 布局 */
  justify-content: center;     /* ✅ 水平居中 */
  align-items: center;         /* ✅ 垂直居中 */
  height: 300px;               /* ✅ 明确高度，确保能居中 */
}

.trend-chart {
  flex: 2;
  min-width: 400px;
  height: 300px; /* ✅ 与左侧统一 */
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.record-list {
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-inner {
  width: 100%;
  max-width: 280px;
}
.form-title {
  font-size: 20px;
  font-weight: bold;
  color: #0154a0;
  text-align: center;
  margin-bottom: 16px;
}

.event-form {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 16px 16px 0;
  border-radius: 8px;
  border: 1px solid #ddd;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 300px;
}

.form-title {
  font-size: 20px;
  font-weight: bold;
  color: #474747;
  text-align: center;
  margin-top: 26px;
  margin-bottom: 10px;
}

.form-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;      /* ✅ 垂直居中 */
  justify-content: center;  /* ✅ 水平居中 */
}

.form-inner {
  width: 100%;
  max-width: 280px;
}

</style>
