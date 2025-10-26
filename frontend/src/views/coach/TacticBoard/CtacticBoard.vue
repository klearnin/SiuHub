<template>
  <div class="tactic-board">
    <!-- 顶部控制栏 -->
    <div class="top-controls">
      <div class="control-group">
        
        <button class="primary-btn" @click="newTactic">
             新建
          </button>
          <button class="primary-btn" @click="setnext">
            设为下次战术
          </button>
        <div class="control-items">
          <select class="styled-select" v-model="selectedTacticID" @change="setTactic">
            <option v-for="tactic in tactics" :value="tactic.id">{{tactic.tactic_name}}</option> 
          </select> 
          
          <button class="save-btn" @click="saveTactic">
             保存
          </button>
          <button class="warn-btn" @click="deleteTactic">
           删除
          </button>
         
          <button class="back-btn" @click="back">
           返回
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
            <select class="styled-select" v-model="tactical_style" @change="1">
              <option value="防守反击">防守反击</option>
              <option value="高位压迫">高位压迫</option>
              <option value="控球">控球</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">初始阵型</label>
            <select class="styled-select" v-model="formation" @change="setFormation">
              <option value="442">4-4-2</option>
              <option value="433">4-3-3</option>
              <option value="352">3-5-2</option>
              <option value="4321">4-3-2-1</option>
              <option value="532">5-3-2</option>
            </select>
          </div>
        </div>

        <div class="control-card roles-card">
          <h3 class="panel-title">角色分配</h3>
          <template v-for="[role] in Object.entries(characters)" 
            :key="role"  >
            <div class="role-item" v-if="role !== 'id' && role !== 'tactic_id'">
            <label class="role-label">{{ roleTranslations[role] || role }}</label>
            <!-- 使用 roleTranslations[role] 显示中文，如果没有映射则显示原英文 -->
            <select class="styled-select small" v-model="characters[role]">
              <option v-for="(player, index) in players" :value="player.player_id" :key="index">
                {{ player.name }} ({{ player.number }})
              </option>
            </select>
          </div>
          </template>
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
              'background-color': getPlayerColor(player.id),
              'background-image': `url(http://localhost:5000${player.avatar})`
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
            
            <option  v-for="player in playerlist" :key="player.id" :value="player.id" >
              {{ player.player_name }} ({{ player.player_number }})
              
              <span class="health" v-if="player.health==='injured'" >——————受伤</span>
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">球衣号码</label>
          <div class="number-display">{{ editingPlayer.number }}</div>
        </div>
        
        <div class="modal-actions">
          
          <button class="cancel-btn" @click="cancelEdit">
            <i class="icon-close"></i> 取消
          </button>
        </div>
      </div>
    </div>
    <!-- 新建战术弹窗 -->
    <div v-if="showNewTacticDialog" class="edit-modal">
      <div class="modal-overlay" @click="showNewTacticDialog = false"></div>
      <div class="modal-content">
        <h3 class="modal-title">新建战术</h3>
        <div class="form-group">
          <label class="form-label">战术名称</label>
          <input 
            type="text"
            class="styled-select full-width"
            v-model="tmp_name"
            placeholder="请输入战术名称"
          />
        </div>
        <div class="modal-actions">
          <button class="primary-btn" @click="closeNewTacticDialog">
           确认
          </button>
          <button class="cancel-btn" @click="showNewTacticDialog = false">
           取消
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



const players = ref([
  {
    id: 0,          // 数字类型
    player_id: 0,   // 数字类型
    name: "",       // 字符串类型
    number: 0,       // 数字类型
    x: 0 ,
    y:0,
    avatar: ""      // 字符串类型
  }
]);
players.value = [];
const playerlist = ref([]);
const characters = ref({
    captain:null,
    left_corner:null,
    right_corner:null,
    penalty_kicker:null,
    short_freekick:null, 
    long_freekick:null,
})
const roleTranslations = {
  captain: '队长',
  left_corner: '左角球',
  right_corner: '右角球',
  penalty_kicker: '点球手',
  short_freekick: '短任意球',
  long_freekick: '长任意球'  // 注意这里原代码拼写是 long_freekic 不是 long_freekick
}
const tactics = ref([
  {
    id: 0,          // 数字类型
    name: "",       // 字符串类型 
  }
])
tactics.value = [];
const editingPlayer =  ref(null)
const selectedPlayerId = ref(null) 
const selectedTacticID = ref(null)
const router = useRouter();
const tactical_style = ref('防守反击')
const tactic_name=ref('')

const formations = {
  '433': [
    { x: 52, y: 249 },
    { x: 210, y: 58 },
    { x: 156, y: 181 },
    { x: 156, y: 322 },
    { x: 188, y: 449 },
    { x: 390, y: 233 },
    { x: 295, y: 192 },
    { x: 299, y: 297 },
    { x: 447, y: 89 },
    { x: 545, y: 229 },
    { x: 462, y: 405 }
  ],
  '532': [
    { x: 51, y: 252 },
    { x: 175, y: 338 },
    { x: 228, y: 14 },
    { x: 169, y: 134 },
    { x: 223, y: 467 },
    { x: 459, y: 234 },
    { x: 347, y: 316 },
    { x: 581, y: 326 },
    { x: 567, y: 119 },
    { x: 175, y: 238 },
    { x: 349, y: 157 }
  ],
  '4321':[ 
    { x: 50, y: 223 },
    { x: 147, y: 21 },
    { x: 149, y: 170 },
    { x: 145, y: 309 },
    { x: 150, y: 458 },
    { x: 401, y: 242},
    { x: 296, y: 157 },
    { x: 296, y: 326 },
    { x: 490, y: 36},
    { x: 584, y: 237 },
    { x: 469, y: 434 }],
  '442': [
    { x: 57, y: 241 },
    { x: 159, y: 335 },
    { x: 186, y: 41 },
    { x: 162, y: 166 },
    { x: 186, y: 448 },
    { x: 385, y: 63 },
    { x: 308, y: 186 },
    { x: 308, y: 303 },
    { x: 383, y: 445 },
    { x: 494, y: 170 },
    { x: 490, y: 309 }
  ],
  '433': [
    { x: 50, y: 223 },
    { x: 210, y: 66 },
    { x: 150, y: 157 },
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
    { x: 55, y: 239 },
    { x: 189, y: 97 },
    { x: 180, y: 244 },
    { x: 183, y: 383 },
    { x: 379, y: 65 },
    { x: 408, y: 421 },
    { x: 300, y: 178 },
    { x: 303, y: 304 },
    { x: 414, y: 239 },
    { x: 554, y: 168 },
    { x: 557, y: 322 }
  ]
}
const formation = ref('442')

onMounted(async () => {
  await fetchPlayerlist();
  await fetchTacticlist();
  await getNext();
 
  selectedTacticID.value=next.value;
  await setTactic();
})

const next=ref(null);
async function setnext() {
  try {
    const response=await axios.put(`http://localhost:5000/api/tactics/next/${selectedTacticID.value}`,{},{ 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
       
      }
    }) ;ElMessage.success('设置下次战术成功');
  }
  
  catch (error) {
    ElMessage.error('设置下次战术失败');    
  }
  await getNext();
}
async function getNext() {
  try {
    const response= await axios.get("http://localhost:5000/api/tactics/next", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    next.value=response.data.nexttac[0].next_id;
  }catch (error) {
    ElMessage.error('获取下次战术失败');
  }
  
}
async function fetchTacticlist() {
  try {
    const response = await axios.get("http://localhost:5000/api/tactics/tlist", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    tactics.value = response.data.tacticList;
  } catch (error) {
    console.error('获取战术列表失败:', error);
    ElMessage.error('获取战术列表失败');
  }
}
async function fetchPlayerlist() {
  try {
    const response = await axios.get("http://localhost:5000/api/tactics/list", { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    playerlist.value = response.data.userlist;
  } catch (error) {
    console.error('获取球员列表失败:', error);
    ElMessage.error('获取球员列表失败');
  }
}

async function saveTactic(){
  //新建战术
  if(!tactic_name.value){
    ElMessage.error('请先新建战术');
    return;
  }
  if(!selectedTacticID.value){
  const payload = {
  tactic_name: tactic_name.value,
  style: tactical_style.value,
  
  characters: {
    captain: characters.value.captain,
    left_corner: characters.value.left_corner,
    right_corner: characters.value.right_corner,
    penalty_kicker: characters.value.penalty_kicker,
    long_freekick: characters.value.long_freekick,
    short_freekick: characters.value.short_freekick,
  },
  players: players.value.map(p => ({
   
    player_id: p.player_id,
    Xvalue: p.x,
    Yvalue: p.y
  }))
};
   
     try {
          const response = await  axios.post('http://localhost:5000/api/tactics/create', payload,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.code === 0){
            ElMessage.success(`新建战术成功！`);
          } 
        } catch (error) {
          ElMessage.error(`保存失败：${error.response?.data?.msg || error.message}`);
        }
      }
      //更新战术
      else{
         const payload = {
          id: selectedTacticID.value,
          tactic_name: tactic_name.value,
          style: tactical_style.value,
          characters: {
            captain: characters.value.captain,
            left_corner: characters.value.left_corner,
            right_corner: characters.value.right_corner,
            penalty_kicker: characters.value.penalty_kicker,
            long_freekick: characters.value.long_freekick,
            short_freekick: characters.value.short_freekick,
          },
          players: players.value.map(p => ({
           
            player_id: p.player_id,
            Xvalue: p.x,
            Yvalue: p.y
          }))
        };

        try {
          const response = await axios.put(
            `http://localhost:5000/api/tactics/${selectedTacticID.value}`,
            payload,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          if (response.data.code === 0) {
            ElMessage.success('战术保存成功！');
            await fetchTacticlist();
          }
        } catch (error) {
          ElMessage.error(`保存失败：${error.response?.data?.msg || error.message}`);
        }
      }
      await fetchTacticlist();
}

function setFormation() {
  if (!playerlist.value) return;
  
  players.value = formations[formation.value].map((pos, index) => ({
    id: index + 1,
    avatar: playerlist.value[index]?.avatar || "", // 假设每个球员有一个 avat
    player_id: playerlist.value[index]?.id || 0,
    name: playerlist.value[index]?.player_name || "",
    number: playerlist.value[index]?.player_number || index + 1,
    x: pos.x,
    y: pos.y
  }))
}

async function setTactic() {
  const selectedTactic = tactics.value.find(t => t.id === selectedTacticID.value);
  if (!selectedTactic) return;

  tactical_style.value = selectedTactic.style;
  tactic_name.value = selectedTactic.tactic_name  ;
  characters.value = selectedTactic.characters || characters.value; 
  players.value = selectedTactic.players.map((p,index)=> ({
  id: index+1 ,
  player_id: p.player_id,
  avatar: playerlist.value.find(pl => pl.id === p.player_id)?.avatar || "",
  name: playerlist.value.find(pl => pl.id === p.player_id)?.player_name || "",
  number: playerlist.value.find(pl => pl.id === p.player_id)?.player_number || p.id,
  x: p.Xvalue,
  y: p.Yvalue
}))

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
    newY = Math.max(0, Math.min(500, newY))
    
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
  draggingPlayer.y = Math.max(0, Math.min(500, draggingPlayer.y))
  
  draggingPlayer = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 编辑逻辑
function editPlayer(player) {
  editingPlayer.value = player
  selectedPlayerId.value = playerlist.value.find(
    p => p.player_name === player.name
  )?.player_id || null
}

function updatePlayerInfo() {
  if (!editingPlayer.value) return
 
  const selectedPlayer = playerlist.value.find(
    p => p.id === selectedPlayerId.value
  )
  if(selectedPlayer.health==='injured'){
    ElMessage.warning('该球员已受伤，无法上场');
    return;
  }
  if (selectedPlayer) {
    editingPlayer.value.name = selectedPlayer.player_name
    editingPlayer.value.number = selectedPlayer.player_number
    editingPlayer.value.player_id = selectedPlayer.id
    editingPlayer.value.avatar = selectedPlayer.avatar
  }
  savePlayer();
}


function savePlayer() {
  if (editingPlayer.value) {
    
    const pos = playerlist.value.findIndex(p => p.player_id === editingPlayer.value.player_id)

    if (pos !== -1) {
      players.value[pos] = {
        ...editingPlayer.value,
        x: players.value[pos].x,
        y: players.value[pos].y
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
async function deleteTactic() {
  if (!selectedTacticID.value) {
    ElMessage.warning('请选择要删除的战术');
    return;
  }
  try {
    await axios.delete(`http://localhost:5000/api/tactics/${selectedTacticID.value}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    ElMessage.success('删除成功');  
    selectedTacticID.value = null;
  } catch (error) {
    ElMessage.error(`删除失败：${error.response?.data?.msg || error.message}`);
  } 
  await fetchTacticlist();
  if(tactics.value.length>0){
    selectedTacticID.value=tactics.value[0].id;
    await setTactic();
  }
  else{
    tactic_name.value = ''
    characters.value = {
      captain:null,
      left_corner:null,
      right_corner:null,
      penalty_kicker:null,
      short_freekick:null,
      long_freekick:null,
    }
  }
}
const showNewTacticDialog = ref(false)

const tmp_name = ref('')
function newTactic() {
  showNewTacticDialog.value = true
}
async function closeNewTacticDialog() {
  showNewTacticDialog.value = false
  if(!tmp_name.value){
    ElMessage.error('请输入战术名称');
    return;
  }
  tactic_name.value = tmp_name.value
  selectedTacticID.value = null
  characters.value = {
    captain:null,
    left_corner:null,
    right_corner:null,
    penalty_kicker:null,
    short_freekick:null, 
    long_freekick:null,
  }
  tmp_name.value = ''
  
  await saveTactic()
  await fetchTacticlist();
  for( const tactic of tactics.value){
     selectedTacticID.value=(tactic.id); 
  }
  setTactic()
}
</script>





<style scoped>
/* 基础样式 */
:root {
  --primary-color: #4361ee;
  --secondary-color: #3f37c9;
  --success-color: #06d6a0;
  --warn-color: #ef476f;
  --bg-gradient: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
  --card-bg: rgba(255, 255, 255, 0.95);
  --text-color: #2b2d42;
  --border-radius: 10px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
}

.control-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(8px);
}

.control-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.styled-select {
  width: 50%;
  border: 1px solid #dee2e6;
  transition: border-color 0.3s ease;
}

.styled-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.field {
  background: linear-gradient(165deg, #c7f9cc 0%, #80ed99 100%);
  box-shadow: inset 0 0 30px rgba(0, 128, 0, 0.1);
}

.player {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.role-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 12px;
}

.modal-content {
  border-radius: var(--border-radius);
  background: var(--card-bg);
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
  border:solid rgb(134, 196, 215);
  
  margin-bottom: 1%;
  margin-left: 1%;
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
  background-color: rgb(187, 237, 252);
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
  color: rgb(0, 0, 0);
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  border: solid 1px rgb(0, 0, 0);
 
  font-size: 14px;
 
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
.blank{
  width: 0%;
}
.save-btn{
  
  width: 70px;
  height: 40px;
  background-color: #11c726;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
   
   
}
.back-btn {
  width: 70px;
  height: 40px;
  background-color: #409eff;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  background: #66b1ff;
}
.warn-btn {
  width: 70px;
  height: 40px;
  background-color: #b81010;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.warn-btn:hover {
  background-color: #cc0000;
}

.cancel-btn {
  background-color: #999;
  color: white;
}
.cancel-btn:hover {
  background-color: #979292;
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
  height: 550px;
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
  background-size: cover;      /* 确保图片填充整个圆形 */
  background-position: center; /* 图片居中 */
  background-repeat: no-repeat;
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

.health{
  margin-right: auto;
  color: #67C23A;
}
</style>


