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
  .editor-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.editor-box {
  background: #ffffff;
  padding: 25px 20px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.time-slider {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row span {
  width: 40px;
  font-size: 16px;
  font-weight: 500;
  color: #444;
}

.preview {
  font-size: 16px;
  font-weight: bold;
  color: #1a73e8;
  text-align: center;
  margin: 12px 0 4px;
}

.btn-group {
  display: flex;
  justify-content: space-around;
  margin-top: 18px;
}

:deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  background-color: #1a73e8;
  border: 2px solid white;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}

:deep(.el-slider__bar) {
  background-color: #a0cfff;
}

:deep(.el-button) {
  border-radius: 20px;
  font-weight: bold;
}

  </style>
  