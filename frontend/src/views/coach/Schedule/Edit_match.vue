<!-- EditTraining.vue -->
<template>
    <div>
      <h2>编辑比赛事件</h2>
      <p>日期：{{ date }}</p>
      <input v-model="event.title" placeholder="标题：训练 or 比赛" />
      <textarea v-model="event.description" placeholder="内容" />
      <button @click="saveEvent">保存</button>
    </div>
  </template>
  
  <script setup>
  import { useRoute } from 'vue-router'
  import { ref } from 'vue'
  import axios from 'axios'
  
  const route = useRoute()
  const date = route.query.date
  const event = ref({
    date,
    title: '',
    description: ''
  })
  
  function saveEvent() {
    axios.post('/api/events', event.value)
      .then(() => alert('保存成功'))
      .catch(() => alert('保存失败'))
  }
  </script>
  