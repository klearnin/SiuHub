<template>
    <div class="editor-overlay">
        <div class="editor-box">
    <div class="time-slider">
      <div class="slider-row">
        <span>时: </span>
        <el-slider v-model="hour" :min="0" :max="23" show-tooltip />
      </div>
      <div class="slider-row">
        <span>分: </span>
        <el-slider v-model="minute" :min="0" :max="59" show-tooltip />
      </div>
      <div class="slider-row">
        <span>秒: </span>
        <el-slider v-model="second" :min="0" :max="59" show-tooltip />
      </div>
      <div class="preview">
        当前选择时间：<strong>{{ formattedTime }}</strong>
      </div>
      <div class="btn-group">
        <el-button type="primary" @click="emitTime">确认</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
      </div>
    </div>
</div>
</div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const hour = ref(0)
  const minute = ref(0)
  const second = ref(0)
  
  const formattedTime = computed(() => {
    const pad = n => String(n).padStart(2, '0')
    return `${pad(hour.value)}:${pad(minute.value)}:${pad(second.value)}`
  })
  
  const emit = defineEmits(['confirm', 'cancel'])
  const emitTime = () => {
    emit('confirm', formattedTime.value)
  }
  </script>
  
  <style scoped>
  .time-slider {
    padding: 15px;
  }
  .slider-row {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
  }
  .slider-row span {
    width: 50px;
  }
  .preview {
    margin: 15px 0;
  }
  .btn-group {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .editor-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .editor-box {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 280px;
    text-align: center;
  }
  :deep(.el-slider__button) {
  width: 10px;
  height: 10px;
}
  </style>
  