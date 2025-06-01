<template>
  <div class="drawing-container">
    <div class="control-bar">
      <button 
        v-for="mode in modes" 
        :key="mode.value"
        :class="{ active: currentMode === mode.value }"
        @click="setMode(mode.value)"
      >
        {{ mode.label }}
      </button>
     
      <div class="tool-group">
        <input type="color" v-model="brushColor" @input="updateBrush">
        <input 
          type="range" 
          v-model="brushSize" 
          min="1" 
          max="20"
          @input="updateBrush"
        >
        <span class="size-display">{{ brushSize }}px</span>
        <input 
          v-if="currentMode === 'erase'"
          type="range" 
          v-model="eraserSize" 
          min="5" 
          max="50"
        >
      </div>
      <div class="action-group">
        <button @click="undo">↩️ 撤销</button>
        <button @click="redo">↪️ 重做</button>
        <button @click="clearAll">🗑️ 清空</button>
        <button @click="back">返回</button>
      </div>
    </div>
    <div></div>
    <svg 
      ref="svgEl" 
      class="drawing-board"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
    ><
  </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createDrauu } from 'drauu'


// DOM 引用
const svgEl = ref(null)

// Drauu 实例
let drauuInstance = null

// 状态管理
const currentMode = ref('stylus')
const isErasing = ref(false)
const brushColor = ref('#ff3535')
const brushSize = ref(3)
const eraserSize = ref(15)

// 工具模式
const modes = [
  { value: 'stylus', label: '✏️ 画笔' },
  { value: 'line', label: '📏 直线' },
  { value: 'rectangle', label: '⬜ 矩形' },
  { value: 'ellipse', label: '⭕ 椭圆' },
  
]

// 初始化绘图板
const initDrauu = () => {
  // 清理现有实例
  if (drauuInstance) {
    drauuInstance.unmount()
    drauuInstance.clear()
    drauuInstance = null
  }
  
  // 创建新实例
  drauuInstance = createDrauu({
    el: svgEl.value,
    brush: {
      mode: currentMode.value,
      color: brushColor.value,
      size: brushSize.value,
    }
  })
  drauuInstance.mount()
}

// 加载背景
const loadBackground = async () => {
  try {
    const response = await fetch(new URL('@/assets/football.svg', import.meta.url).href)
    const svg = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const image = doc.documentElement
    
    // 设置背景属性
    image.setAttribute('width', '100%')
    image.setAttribute('height', '100%')
    image.style.pointerEvents = 'none'
    image.setAttribute('data-background', 'true')
    
    // 清除旧背景
    const oldBg = svgEl.value.querySelector('[data-background]')
    if (oldBg) oldBg.remove()
    
    // 添加新背景
    svgEl.value.prepend(image)
  } catch (error) {
    console.error('背景加载失败:', error)
  }
}

// 设置绘图模式
const setMode = (mode) => {
  currentMode.value = mode
  if (mode !== 'erase' && drauuInstance) {
    drauuInstance.brush.mode = mode
  }
}

// 更新画笔配置
const updateBrush = () => {
  if (drauuInstance) {
    drauuInstance.brush = {
      ...drauuInstance.brush,
      color: brushColor.value,
      size: Number(brushSize.value)
    }
  }
}

// 橡皮擦功能
const handlePointerDown = (e) => {
  if (currentMode.value !== 'erase') return
  isErasing.value = true
  eraseAtPosition(e)
}

const handlePointerMove = (e) => {
  if (!isErasing.value || currentMode.value !== 'erase') return
  eraseAtPosition(e)
}

const handlePointerUp = () => {
  isErasing.value = false
}

const eraseAtPosition = (event) => {
  const svgRect = svgEl.value.getBoundingClientRect()
  const point = {
    x: event.clientX - svgRect.left,
    y: event.clientY - svgRect.top
  }
  
  const hitOptions = {
    fill: true,
    stroke: true,
    tolerance: eraserSize.value / 2,
    match: (item) => !item.hasAttribute('data-background')
  }
  
  const hitResult = drauuInstance?.hitTest(point, hitOptions)
  if (hitResult?.item) {
    hitResult.item.remove()
    drauuInstance.sync()
  }
}

// 操作功能
const undo = () => drauuInstance?.undo()
const redo = () => drauuInstance?.redo()
const clear = () => drauuInstance?.clear()

const clearAll = async () => {
  clear()
   loadBackground()
}

// 生命周期
// 初始化时加载存储数据
onMounted(async () => {
  await loadBackground()
  initDrauu()
  
  // 加载存储的绘图数据
  const savedData = localStorage.getItem('tactic-canvas-state');
  if (savedData) {
    try {
      const { drawing } = JSON.parse(savedData);
      // 过滤掉背景图后插入内容
      const parser = new DOMParser();
      const doc = parser.parseFromString(drawing, 'image/svg+xml');
      Array.from(doc.documentElement.children)
        .filter(el => !el.hasAttribute('data-background'))
        .forEach(node => svgEl.value.appendChild(node));
    } catch (e) {
      console.error('加载存储数据失败:', e);
    }
  }
})

// 卸载前保存数据








import { useRouter } from 'vue-router';
const router = useRouter();
function back(){
  // 保存绘图数据
  const drawingContent = Array.from(svgEl.value.children)
    .filter(el => !el.hasAttribute('data-background'))
    .map(el => el.outerHTML)
    .join('');
  
  localStorage.setItem('tactic-canvas-state', 
    JSON.stringify({
      drawing: drawingContent,
      brushConfig: {
        color: brushColor.value,
        size: brushSize.value,
        mode: currentMode.value
      }
    })
  );
  router.push('/chome');
}
</script>

<style scoped>
.drawing-container {
  position: relative;
  width: 100%;
  height: 650px;
  display: flex;
  flex-direction: column;
}

.control-bar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(243, 244, 246, 0.9);
  border-radius: 8px 8px 0 0;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  align-items: center;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 0 8px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.drawing-board {
  width: 100%;
  height: 100%;
  flex-grow: 1;
  border: 1px solid #e5e7eb;
  border-top: none;
  background-color: white;
  touch-action: none;
}

button {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #e5e7eb;
}

button.active {
  background: #3b82f6;
  color: white;
  border-color: #2563eb;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
}

input[type="color"] {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

input[type="range"] {
  width: 80px;
  vertical-align: middle;
}

.size-display {
  font-size: 12px;
  min-width: 30px;
  text-align: center;
}
</style>