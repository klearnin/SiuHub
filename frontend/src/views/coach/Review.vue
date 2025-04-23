<template>
    <div class="review-page">
      <h2>待审核成员列表</h2>
      <div v-if="users.length === 0">暂无待审核成员</div>
      <ul v-else>
        <li v-for="user in users" :key="user.id" class="user-card">
          <p>姓名：{{ user.name }}</p>
          <p>手机号：{{ user.phone }}</p>
          <p>类型：{{ user.type }}</p>
          <button @click="handleReview(user.id, true)">通过</button>
          <button @click="handleReview(user.id, false)">拒绝</button>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import axios from 'axios'
  
  const users = ref([])
  
  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/pending-users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      users.value = res.data.users
    } catch (err) {
      alert('获取失败：' + err.response?.data?.message || err.message)
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
      alert('操作成功')
      fetchPendingUsers() // 刷新列表
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message || err.message)
    }
  }
  
  onMounted(fetchPendingUsers)
  </script>
  
  <style scoped>
  .review-page {
    padding: 20px;
  }
  
  .user-card {
    border: 1px solid #ccc;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 6px;
  }
  </style>
  