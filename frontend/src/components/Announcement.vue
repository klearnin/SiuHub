<template>
  <el-dialog
    v-model="visible"
    width="520px"
    :show-close="false"
    :close-on-click-modal="false"
    align-center
  >
    <template #header>
      <div style="display:flex;gap:8px;align-items:center;">
        <el-icon><Notification /></el-icon>
        <span>最新公告</span>
      </div>
    </template>

    <div v-if="data">
      <h3 style="font-weight:700;margin:8px 0;">{{ data.title || '公告' }}</h3>
      <p style="white-space:pre-wrap;line-height:1.75;">{{ data.content }}</p>
      <div style="font-size:12px;color:#888;margin-top:8px;">
        发布时间：{{ formatTime(data.publish_time) }}
      </div>
    </div>

    <template #footer>
      <el-button type="primary" :loading="loading" @click="onConfirm">我已知晓</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Notification } from '@element-plus/icons-vue'

const visible = ref(false)
const data = ref(null)
const loading = ref(false)

/** 工具：格式化时间 */
function formatTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

/** 打开弹窗（内部使用） */
function open(announcement) {
  data.value = announcement
  visible.value = true
}

/** 从 sessionStorage 取待弹公告并弹出（仅主界面触发） */
function consumePendingAndOpen() {
  const raw = sessionStorage.getItem('PENDING_ANNOUNCEMENT')
  if (!raw) return
  try {
    const ann = JSON.parse(raw)
    if (ann && ann.id) {
      open(ann)
    }
  } catch {}
  // 无论是否成功解析，都清掉，避免重复弹
  sessionStorage.removeItem('PENDING_ANNOUNCEMENT')
}

/** 点击“我已知晓” */
async function onConfirm() {
  if (!data.value?.id) {
    visible.value = false
    return
  }
  loading.value = true
  try {
    // 如果你的后端是“前端传 id 确认”的版本：
    await axios.post('http://localhost:5000/api/auth/confirm-announcement',
      { announcementId: data.value.id },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    // 同步更新本地 user，避免前端再次误弹
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      user.confirmed_announcement_id = data.value.id
      localStorage.setItem('user', JSON.stringify(user))
    }

    ElMessage.success('已确认公告')
    visible.value = false
    data.value = null
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '确认失败')
  } finally {
    loading.value = false
  }
}

/** 主界面挂载后自动检查并弹出 */
onMounted(() => {
  consumePendingAndOpen()
})

</script>
