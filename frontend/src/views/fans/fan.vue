<template>
  <div class="fan-page">
    <h1>这是球迷主页</h1>
    <div v-if="teamLogo">
      <img :src="`http://localhost:5000${teamLogo}`" alt="主队队徽" class="team-logo" />
    </div>
    <div v-else>
      <p>正在加载主队队徽...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const teamLogo = ref(null)

onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    const res = await axios.get("http://localhost:5000/api/user/my-logo", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    teamLogo.value = res.data.logo
  } catch (err) {
    console.error("获取队徽失败", err)
  }
})
</script>

<style scoped>
.fan-page {
  text-align: center;
  padding: 100px 0;
  font-size: 24px;
}

.team-logo {
  width: 200px;
  height: auto;
  margin-top: 20px;
}
</style>