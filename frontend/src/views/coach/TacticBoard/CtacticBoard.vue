<template>
  <div class="tactic-board">
    <div class="controls"> 
      
      <label>切换战术：</label>
      <select v-model="tactical" @change="setFormation">
        <option value="1">战术1</option>
        <option value="2">战术2</option>
        <option value="3">战术3</option>
      </select>
      <button @click="newTactic">新建战术</button><button @click="back">返回</button>
    </div>
    


    <div class="field">
      <div
        v-for="player in players"
        :key="player.id"
        class="player"
        :style="{ left: player.x + 'px', top: player.y + 'px' }"
        @mousedown="startDrag(player, $event)"
        @dblclick="editPlayer(player)"
      >
        {{ player.name }}<br />{{ player.number }}
      </div>
    </div>
    <div v-if="editingPlayer" class="edit-modal">
      <div class="edit-content">
        <label>姓名：<input v-model="editingPlayer.name" /></label><br />
        <label>号码：<input v-model="editingPlayer.number" /></label><br />
        <div class="edit-buttons">
          <button @click="savePlayer">保存</button>
          <button @click="cancelEdit">取消</button>
          
        </div>
      </div>
    </div>
    <div class="controls">
     
     <div>
      <label>战术风格：</label>
      <select v-model="tactical_style" @change="setFormation">
        <option value="防守反击">防守反击</option>
        <option value="高位压迫">高位压迫</option>
        <option value="控球">控球</option>
      </select>
    </div>
    <div>
      <label>选择阵型：</label>
      <select v-model="formation" @change="setFormation">
        <option value="442">4-4-2</option>
        <option value="433">4-3-3</option>
        <option value="352">3-5-2</option>
      </select>
    </div>
      
      <div class="player_list">
      <div  v-for="player in players" :key="player.id"class="player"
      @mousedown="startDrag(player, $event)"
      @dblclick="editPlayer(player)">
        {{ player.name }}<br />{{ player.number }}
        </div>
      </div> 
      
    </div>
   
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const formation = ref('442')
const players = ref([
  {
    id: 0,          // 数字类型
    name: "",       // 字符串类型
    number: 0,       // 数字类型
    avatar:'',
    x: 0 ,
    y:0
  }
]);
players.value = [];
const characters = ref([
  {
    队长:0,
    点球手:0,
    长传任意球手:0,
    短传任意球手:0,
    左角球手:0,
    右角球手:0,  
  }
])
const tactical = ref('1')
const editingPlayer = ref(null)
const router = useRouter();
const tactical_style = ref('防守反击')
const formations = {
  '442': [{"id":1,"name":"门将","number":"","x":61,"y":275,"role":"GK"},{"id":2,"name":"左后卫","number":"","x":209,"y":100,"role":"LB"},{"id":3,"name":"左中卫","number":"","x":182,"y":220,"role":"LCB"},{"id":4,"name":"右中卫","number":"","x":173,"y":380,"role":"RCB"},{"id":5,"name":"右后卫","number":"","x":207,"y":499,"role":"RB"},{"id":6,"name":"左中场","number":"","x":384,"y":97,"role":"LM"},{"id":7,"name":"中前卫","number":"","x":318,"y":212,"role":"LCM"},{"id":8,"name":"中前卫","number":"","x":318,"y":351,"role":"RCM"},{"id":9,"name":"右中场","number":"","x":401,"y":484,"role":"RM"},{"id":10,"name":"前锋1","number":"","x":511,"y":210,"role":"ST1"},{"id":11,"name":"前锋2","number":"","x":515,"y":336,"role":"ST2"}],
  '433': [{"id":1,"name":"门将","number":"","x":56,"y":275,"role":"GK"},
  {"id":2,"name":"左后卫","number":"","x":210,"y":66,"role":"LB"},
  {"id":3,"name":"左中卫","number":"","x":151,"y":221,"role":"LCB"},
  {"id":4,"name":"右中卫","number":"","x":150,"y":359,"role":"RCB"},
  {"id":5,"name":"右后卫","number":"","x":221,"y":487,"role":"RB"},
  {"id":6,"name":"后腰","number":"","x":264,"y":279,"role":"CDM"},
  {"id":7,"name":"左中场","number":"","x":361,"y":188,"role":"LCM"},
  {"id":8,"name":"右中场","number":"","x":375,"y":354,"role":"RCM"},
  {"id":9,"name":"左前卫","number":"","x":477,"y":98,"role":"LW"},
  {"id":10,"name":"中锋","number":"","x":542,"y":275,"role":"CF"},
  {"id":11,"name":"右前卫","number":"","x":482,"y":463,"role":"RW"}],
  '352': [
    { id: 1, name: '门将', x: 61, y: 275, role: 'GK' },
    { id: 2, name: '左中卫', number: '', x: 180, y: 150, role: 'LCB' },
    { id: 3, name: '中卫', number: '', x: 188, y: 280, role: 'CB' },
    { id: 4, name: '右中卫', number: '', x: 180, y: 450, role: 'RCB' },
    { id: 5, name: '左翼卫', number: '', x: 436, y: 59, role: 'LWB' },
    { id: 6, name: '右翼卫', number: '', x: 426, y: 488, role: 'RWB' },
    { id: 7, name: '左中场', number: '', x: 377, y: 196, role: 'LCM' },
    { id: 8, name: '中场', number: '', x: 297, y: 276, role: 'CM' },
    { id: 9, name: '右中场', number: '', x: 386, y: 364, role: 'RCM' },
    { id: 10, name: '前锋1', number: '', x: 550, y: 180, role: 'ST1' },
    { id: 11, name: '前锋2', number: '', x: 555, y: 357, role: 'ST2' },
  ]
}

const formations2 = {
  '442': [
    { x: 61, y: 275 },
    { x: 209, y: 100 },
    { x: 182, y: 220 },
    { x: 173, y: 380 },
    { x: 207, y: 499 },
    { x: 384, y: 97 },
    { x: 318, y: 212 },
    { x: 318, y: 351 },
    { x: 401, y: 484 },
    { x: 511, y: 210 },
    { x: 515, y: 336 }
  ],
  '433': [
    { x: 56, y: 275 },
    { x: 210, y: 66 },
    { x: 151, y: 221 },
    { x: 150, y: 359 },
    { x: 221, y: 487 },
    { x: 264, y: 279 },
    { x: 361, y: 188 },
    { x: 375, y: 354 },
    { x: 477, y: 98 },
    { x: 542, y: 275 },
    { x: 482, y: 463 }
  ],
  '352': [
    { x: 61, y: 275 },
    { x: 180, y: 150 },
    { x: 188, y: 280 },
    { x: 180, y: 450 },
    { x: 436, y: 59 },
    { x: 426, y: 488 },
    { x: 377, y: 196 },
    { x: 297, y: 276 },
    { x: 386, y: 364 },
    { x: 550, y: 180 },
    { x: 555, y: 357 }
  ]
}


onMounted(async () => {
 
})


async function fetchTactic(){
  1;
}

function setFormation() {
  players.value = formations2[formation.value].map((pos, index) => ({
    id: index + 1,  // 重新生成ID
    name: "",       // 默认空名
    number: index + 1, // 默认号码
    avatar: "",
    ...pos          // 展开x,y坐标
  }))
}


let draggingPlayer = null
let offsetX = 0
let offsetY = 0
let originalX = 0
let originalY = 0

function startDrag(player, event) {
  draggingPlayer = player
  offsetX = event.clientX - player.x
  offsetY = event.clientY - player.y
  originalX = player.x // 保存原始位置
  originalY = player.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event) {
  if (draggingPlayer) {
    let newX = event.clientX - offsetX
    let newY = event.clientY - offsetY
    // 限制边界
    newX = Math.max(0, Math.min(950, newX))
    newY = Math.max(0, Math.min(550, newY))
    draggingPlayer.x = newX
    draggingPlayer.y = newY
  }
}

function stopDrag(event) {
  if (!draggingPlayer) return
  
  // 检查是否有其他球员在当前位置附近
  const swappedPlayer = players.value.find(p => 
    p !== draggingPlayer && 
    Math.abs(p.x - draggingPlayer.x) < 50 && 
    Math.abs(p.y - draggingPlayer.y) < 50
  )
  
  if (swappedPlayer) {
    // 交换位置
    const tempX = swappedPlayer.x
    const tempY = swappedPlayer.y
    swappedPlayer.x = originalX
    swappedPlayer.y = originalY
    draggingPlayer.x = tempX
    draggingPlayer.y = tempY
  } else {
    // 没有交换对象，保持新位置
    draggingPlayer.x = event.clientX - offsetX
    draggingPlayer.y = event.clientY - offsetY
  }
  
  // 确保位置在边界内
  draggingPlayer.x = Math.max(0, Math.min(950, draggingPlayer.x))
  draggingPlayer.y = Math.max(0, Math.min(550, draggingPlayer.y))
  
  draggingPlayer = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function editPlayer(player) {
  // 这里直接引用对象，编辑时会实时反映到players
   editingPlayer.value=player
}

function savePlayer() {
  
  editingPlayer.value = null  
}

function cancelEdit() {
  editingPlayer.value = null
}

function back(){
  router.push('/chome');
 
}
</script>

<style scoped>
.tactic-board {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  /* width: 1200px;  // 删除或注释掉这一行 */
}
.controls {
  display: flex;
  flex-basis: 150px;
  gap: 10px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  min-width: 180px; /* 可选，保证左侧不太窄 */
  max-width: 220px; /* 可选，防止过宽 */
}

.player_list {
  display: flex;
  flex-wrap: wrap;
  justify-content:space-between;
  gap: 10px;
  margin-bottom: 20px;
  max-width: 140px; /* 2*60px+gap，确保每行2个 */
}

.player_list .player {
  position: static;
  width: 60px;
  height: 60px;
  background: #2196f3;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
  font-size: 14px;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}


.field {
  position: relative;
  width: 1000px;
  height: 600px;
  background: url('@/assets/football.svg') no-repeat center center;
  background-size: cover;
  border: 2px solid #fff;
}
.player {
  position: absolute;
  width: 50px;
  height: 50px;
  background: #f44336;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 25px;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.edit-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.edit-content {
  background: #fff;
  color: #333;
  padding: 20px;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.edit-content label {
  display: block;
  margin-bottom: 10px;
}
.edit-content input {
  width: 120px;
  padding: 4px 8px;
  margin-left: 8px;
}
.edit-buttons{
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.edit-content button {
 
  margin-right: 10px;
  padding: 4px 12px;
}

</style>
