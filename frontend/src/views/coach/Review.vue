<template>
  <div class="review-page">
    <!-- 返回按钮 -->
    <el-button class="back-button" type="primary" plain @click="goBack">
      返回
    </el-button>

    <h2 class="title">待审核成员列表</h2>

    <el-empty description="暂无待审核成员" v-if="users.length === 0" />

    <div class="user-list" v-else>
      <el-card
        v-for="user in users"
        :key="user.id"
        class="user-card"
        shadow="hover"
      >
        <div class="user-info">
          <p><strong>姓名：</strong>{{ user.name }}</p>
          <p><strong>手机号：</strong>{{ user.phone }}</p>
          <p><strong>身份类型：</strong>{{ user.type }}</p>
        </div>
        <el-button-group class="actions">
          <el-button type="success" size="small" @click="handleReview(user.id, true)">
            通过
          </el-button>
          <el-button type="danger" size="small" @click="handleReview(user.id, false)">
            拒绝
          </el-button>
        </el-button-group>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const users = ref([])
const router = useRouter()

const fetchPendingUsers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/auth/pending-users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    users.value = res.data.users
  } catch (err) {
    ElMessage.error('获取失败：' + (err.response?.data?.message || err.message))
  }
}

const handleReview = async (userId, approve) => {
  try {
    await axios.post('http://localhost:5000/api/auth/review-join', {
      userId,
      approve
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    ElMessage.success(approve ? '审核通过成功' : '已拒绝该用户')
    fetchPendingUsers()
  } catch (err) {
    ElMessage.error('操作失败：' + (err.response?.data?.message || err.message))
  }
}

const goBack = () => {
  router.push('/coach') // 你可以根据具体路径修改
}

onMounted(fetchPendingUsers)
</script>

<style scoped>
.review-page {
  padding: 30px;
  max-width: 800px;
  margin: auto;
  position: relative;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
}

.title {
  text-align: center;
  font-size: 26px;
  margin-bottom: 30px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.user-info {
  font-size: 16px;
  line-height: 1.8;
}

.actions {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
</style>
