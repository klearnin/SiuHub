<template>
  <div class="tactics-board">
    <div class="sidebar">
      <h3>选择阵型</h3>
      <button @click="setFormation('4-4-2')">4-4-2</button>
      <button @click="setFormation('4-3-3')">4-3-3</button>
      <button @click="setFormation('3-5-2')">3-5-2</button>
    </div>
    <div class="board" ref="board" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing">
      <div v-for="player in players" :key="player.id" :style="playerStyle(player)" class="player"
           @mousedown="startDrag(player, $event)" @mousemove="onDrag($event, player)" @mouseup="endDrag(player)">
        {{ player.number }}
      </div>
      <canvas ref="canvas" class="drawing-layer"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const players = reactive(Array.from({ length: 11 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  x: 100 + i * 30,
  y: 200,
  dragging: false,
  offsetX: 0,
  offsetY: 0,
})));

const canvas = ref(null);
const board = ref(null);
const drawing = ref(false);

function playerStyle(player) {
  return {
    position: 'absolute',
    left: `${player.x}px`,
    top: `${player.y}px`,
    width: '30px',
    height: '30px',
    backgroundColor: 'blue',
    color: 'white',
    borderRadius: '50%',
    textAlign: 'center',
    lineHeight: '30px',
    cursor: 'move',
  };
}

function startDrag(player, event) {
  player.dragging = true;
  player.offsetX = event.clientX - player.x;
  player.offsetY = event.clientY - player.y;
}

function onDrag(event, player) {
  if (!player.dragging) return;
  player.x = event.clientX - player.offsetX;
  player.y = event.clientY - player.offsetY;
}

function endDrag(player) {
  player.dragging = false;
}

function startDrawing(event) {
  drawing.value = true;
  const ctx = canvas.value.getContext('2d');
  ctx.moveTo(event.offsetX, event.offsetY);
}

function draw(event) {
  if (!drawing.value) return;
  const ctx = canvas.value.getContext('2d');
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.stroke();
}

function stopDrawing() {
  drawing.value = false;
}

function setFormation(type) {
  if (type === '4-4-2') {
    // 4-4-2 阵型位置调整
  } else if (type === '4-3-3') {
    // 4-3-3 阵型位置调整
  } else if (type === '3-5-2') {
    // 3-5-2 阵型位置调整
  }
}

onMounted(() => {
  const ctx = canvas.value.getContext('2d');
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';
});
</script>

<style scoped>
.tactics-board {
  display: flex;
  gap: 20px;
}
.sidebar {
  display: flex;
  flex-direction: column;
}
.board {
  position: relative;
  width: 1000px;
  height: 1000px;
  background-color: green;
  border: 2px solid #333;
}
.player {
  position: absolute;
  user-select: none;
}
.drawing-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
