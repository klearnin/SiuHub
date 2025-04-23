<template>
  <div class="coach-page">
    <h1>这是教练主页</h1>
    <button @click="goToReview">审核人员</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goToReview = () => {
  router.push('/coach/review')
}
</script>

<style scoped>
.coach-page {
  text-align: center;
  padding: 100px 0;
  font-size: 24px;
}
</style>
