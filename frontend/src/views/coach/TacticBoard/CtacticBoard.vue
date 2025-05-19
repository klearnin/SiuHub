<template>
  <div class="tactic-board">
    <!-- 顶部控制栏 -->
    <div class="top-controls">
      <div class="control-group">
        <label class="control-label">战术管理</label>
        <div class="control-items">
          <select class="styled-select" v-model="selectedTactic" @change="setTactic">
            <option value="1">战术1</option>
            <option value="2">战术2</option>
            <option value="3">战术3</option>
          </select>
          <button class="primary-btn" @click="newTactic">
            <i class="icon-add"></i> 新建
          </button>
          <button class="success-btn" @click="saveTactic">
            <i class="icon-save"></i> 保存
          </button>
          <button class="warn-btn" @click="back">
            <i class="icon-back"></i> 返回
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="left-panel">
        <div class="control-card">
          <h3 class="panel-title">战术设置</h3>
          <div class="form-group">
            <label class="form-label">战术风格</label>
            <select class="styled-select" v-model="tactical_style" @change="setFormation">
              <option value="防守反击">防守反击</option>
              <option value="高位压迫">高位压迫</option>
              <option value="控球">控球</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">选择阵型</label>
            <select class="styled-select" v-model="formation" @change="setFormation">
              <option value="442">4-4-2</option>
              <option value="433">4-3-3</option>
              <option value="352">3-5-2</option>
            </select>
          </div>
        </div>

        <div class="control-card roles-card">
          <h3 class="panel-title">角色分配</h3>
          <div class="role-item" v-for="[role] in Object.entries(characters)" :key="role">
            <label class="role-label">{{ role }}</label>
            <select class="styled-select small" v-model="characters[role]">
              <option v-for="(player, index) in players" :value="player.id" :key="index">
                {{ player.name }} ({{ player.number }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 球场区域 -->
      <div class="field-container">
        <div class="field">
          <div
            v-for="player in players"
            :key="player.id"
            class="player"
            :style="{
              left: player.x + 'px', 
              top: player.y + 'px',
              'background-color': getPlayerColor(player.id)
            }"
            @mousedown="startDrag(player, $event)"
            @dblclick="editPlayer(player)"
          >
            <div class="player-number">{{ player.number }}</div>
            <div class="player-name">{{ player.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editingPlayer" class="edit-modal">
      <div class="modal-overlay" @click="cancelEdit"></div>
      <div class="modal-content">
        <h3 class="modal-title">编辑球员</h3>
        <div class="form-group">
          <label class="form-label">选择球员</label>
          <select 
            class="styled-select full-width"
            v-model="selectedPlayerId" 
            @change="updatePlayerInfo"
          >
            <option value="">请选择球员</option>
            <option 
              v-for="player in playerlist" 
              :key="player.id" 
              :value="player.id"
            >
              {{ player.player_name }} ({{ player.player_number }})
            </option>
          </select>
        </div>
        
       <!-- <div class="form-group">
          <label class="form-label">球衣号码</label>
          <div class="number-display">{{ editingPlayer.number }}</div>
        </div>-->
        
        <div class="modal-actions">
          <button class="primary-btn" @click="savePlayer">
            <i class="icon-check"></i> 确认
          </button>
          <button class="cancel-btn" @click="cancelEdit">
            <i class="icon-close"></i> 取消
          </button>
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
    x: 0 ,
    y:0
  }
]);
players.value = [];
const playerlist = ref([]);
const characters = ref(
  {
    队长:0,
    点球手:0,
    长传任意球手:0,
    短传任意球手:0,
    左角球手:0,
    右角球手:0,  
  }
)
const tacticals = ref([
  {
    id: 0,          // 数字类型
    name: "",       // 字符串类型 
  }
])
const editingPlayer =  ref(null)
const selectedPlayerId = ref(null) 
const router = useRouter();
const tactical_style = ref('防守反击')
const tactic_name=ref('')

const formations = {
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
  await fetchPlayerlist();
  await fetchTacticlist();
  setFormation();
})

async function fetchTacticlist() {
  try {
    const response = await axios.get("http://localhost:5000/api/tactics/list", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    playerlist.value = response.data.playerlist;
  } catch (error) {
    console.error('获取球员列表失败:', error);
    ElMessage.error('获取球员列表失败');
  }
}
async function fetchPlayerlist() {
  try {
    const response = await axios.get("http://localhost:5000/api/tactics/list", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    playerlist.value = response.data.playerlist;
  } catch (error) {
    console.error('获取球员列表失败:', error);
    ElMessage.error('获取球员列表失败');
  }
}

async function saveTactic(){
  const payload = {
     tactical_name: tactic_name.value,
     tactical_style: tactical_style.value,
     characters: characters.value,
     players: players.value,
    };
   
     try {
          const response = await  axios.post('http://localhost:5000/api/tactical/', payload,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.code === 0){
            ElMessage.success(`战术保存成功！`);
          } 
        } catch (error) {
          ElMessage.error(`保存失败：${response.data.msg}`);
        }
      
}

function setFormation() {
  players.value = formations[formation.value].map((pos, index) => ({
    id: index + 1,
    name: playerlist.value[index]?.player_name || "",
    number: playerlist.value[index]?.player_number || index + 1,
    x: pos.x,
    y: pos.y
  }))
}
function setTactic(){
  const selectedTactic = tacticals.value.find(t => t.id === tacticals.value);
  if (selectedTactic) {
    tactical_style.value = selectedTactic.tactical_style;
    formation.value = selectedTactic.formation;
    characters.value = selectedTactic.characters;
    players.value = selectedTactic.players;
  }
}

let draggingPlayer = null
let offsetX = 0
let offsetY = 0
let originalX = 0
let originalY = 0

function startDrag(player, event) {
  // 正常的场上球员拖动逻辑
  draggingPlayer = player
  offsetX = event.clientX - player.x
  offsetY = event.clientY - player.y
  originalX = player.x
  originalY = player.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 从球员列表开始拖动


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
// 编辑逻辑
function editPlayer(player) {
  editingPlayer.value = { ...player }
  selectedPlayerId.value = playerlist.value.find(
    p => p.player_name === player.name
  )?.player_id || null
}

function updatePlayerInfo() {
  if (!editingPlayer.value) return
  
  const selectedPlayer = playerlist.value.find(
    p => p.id === selectedPlayerId.value
  )
  
  if (selectedPlayer) {
    editingPlayer.value.name = selectedPlayer.player_name
    editingPlayer.value.number = selectedPlayer.player_number
  }
}

function savePlayer() {
  if (editingPlayer.value) {
    const index = players.value.findIndex(p => p.id === editingPlayer.value.id)
    if (index !== -1) {
      players.value[index] = { 
        ...players.value[index],
        name: editingPlayer.value.name,
        number: editingPlayer.value.number
      }
    }
    editingPlayer.value = null
    selectedPlayerId.value = null
  }
}

function cancelEdit() {
  editingPlayer.value = null
  selectedPlayerId.value = null
}

function back(){
  router.push('/chome');
}

const getPlayerColor = (id) => {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
    '#9b59b6', '#1abc9c', '#d35400', '#34495e'
  ];
  return colors[id % colors.length];
};
</script>




<style scoped>
/* 基础样式 */
:root {
  --primary-color: #3498db;
  --success-color: #2ecc71;
  --warn-color: #e74c3c;
  --bg-color: #7c96bc;
  --card-bg: #c47878;
  --text-color: #333;
  --border-color: #e0e0e0;
  --shadow: 0 4px 12px rgba(0,0,0,0.1);
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-color);
  background-color: var(--bg-color);
}

/* 主布局 */
.tactic-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color:#f9f9f9;
}

.top-controls {
  padding: 12px 20px;
  background-color: var(--card-bg);
  box-shadow: var(--shadow);
  border-bottom: 1px solid var(--border-color);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
}

.field-container {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

/* 卡片样式 */
.control-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--primary-color);
}

/* 表单元素 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  color: #666;
}

.styled-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: rgb(129, 189, 221);
  font-size: 14px;
  transition: all 0.3s;
}

.styled-select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(89, 180, 95, 0.2);
}

.styled-select.small {
  padding: 6px 10px;
  font-size: 13px;
}

.styled-select.full-width {
  width: 100%;
}

/* 按钮样式 */
.primary-btn {
  background-color: var(--primary-color);
  color: rgb(130, 188, 243);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  border: solid 1px rgb(113, 202, 243);
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.success-btn {
  background-color: var(--success-color);
  color: rgb(126, 191, 232);
  border: solid 1px rgb(113, 202, 243);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.warn-btn {
  background-color: var(--warn-color);
  color: rgb(113, 202, 243);
  border: solid 1px rgb(113, 202, 243);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #666;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

button i {
  margin-right: 6px;
  font-size: 14px;
}

.control-items {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 球场样式 */
.field {
  position: relative;
  width: 1000px;
  height: 600px;
  background: url('@/assets/football.svg') no-repeat center center;
  background-size: cover;
  border-radius: 8px;
  box-shadow: var(--shadow);
  border: 2px solid #fff;
}

/* 球员样式 */
.player {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  color: white;
  font-weight: bold;
}

.player:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.player-number {
  font-size: 18px;
  line-height: 1;
}

.player-name {
  font-size: 12px;
  line-height: 1.2;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* 角色分配 */
.roles-card {
  max-height: 400px;
  overflow-y: auto;
}

.role-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.role-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: #666;
}

/* 编辑弹窗 */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
}

.modal-content {
  position: relative;
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  animation: modalFadeIn 0.3s ease-out;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--primary-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.number-display {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

/* 动画 */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .field {
    width: 100%;
    height: 500px;
  }
}

/* 图标字体 (使用Unicode或引入图标库) */
.icon-add::before { content: "+"; }
.icon-save::before { content: "💾"; }
.icon-back::before { content: "←"; }
.icon-check::before { content: "✓"; }
.icon-close::before { content: "✕"; }
</style>




