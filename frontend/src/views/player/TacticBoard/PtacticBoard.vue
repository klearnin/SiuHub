<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import { ElMessage } from 'element-plus'
  import { ca, id, pl, ta } from 'element-plus/es/locale/index.mjs';
  
  
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
    '442': [
      { x: 57, y: 241 },
      { x: 175, y: 336 },
      { x: 228, y: 14 },
      { x: 171, y: 149 },
      { x: 223, y: 467 },
      { x: 439, y: 45 },
      { x: 355, y: 310 },
      { x: 455, y: 453 },
      { x: 551, y: 163 },
      { x: 547, y: 298 },
      { x: 355, y: 173 }
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
  function rolename(role){
    const name=playerlist.value.find(p=>p.id===role)?.player_name;
    return name;
  }
  function rolenumber(role){
    const number=playerlist.value.find(p=>p.id===role)?.player_number;
    return number; 
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
   
    if (selectedPlayer) {
      editingPlayer.value.name = selectedPlayer.player_name
      editingPlayer.value.number = selectedPlayer.player_number
      editingPlayer.value.player_id = selectedPlayer.id
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
    router.push('/phome');
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
  
  
<template>
    <div class="tactic-board">
      <!-- 顶部控制栏 -->
      <div class="top-controls">
        <div class="control-group">
          <div class="left-actions">
            <button class="back-btn" type="button" @click="back">
              返回
            </button>
          </div>
          <div class="control-items">
            <div class="tactic-summary">
              <span class="summary-label">当前战术：</span>
              <span class="tactic-name-display">{{ tactic_name || '暂无战术' }}</span>
            </div>
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
              <div class="info-display">{{tactical_style}}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">初始阵型</label>
              <div class="info-display">{{formation}}</div>
            </div>
          </div>
  
          <div class="control-card roles-card">
            <h3 class="panel-title">角色分配</h3>
            <template v-for="[role] in Object.entries(characters)" 
              :key="role">
              <div class="role-item" v-if="role !== 'id' && role !== 'tactic_id'">
                <label class="role-label">{{ roleTranslations[role] || role }}</label>
                <div class="player-info-display">
                  {{ rolename(characters[role]) || '未分配' }}
                  <span
                    v-if="rolenumber(characters[role])"
                    class="role-player-number"
                  >
                    ({{ rolenumber(characters[role]) }})
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
  
        <!-- 球场区域 -->
        <div class="field-container">
          <div class="field">
            <svg class="pitch-svg" viewBox="0 0 1000 550" preserveAspectRatio="none" aria-hidden="true">
              <rect x="10" y="10" width="980" height="530" fill="none" stroke="white" stroke-width="3"/>
              <line x1="500" y1="10" x2="500" y2="540" stroke="white" stroke-width="3"/>
              <circle cx="500" cy="275" r="91" fill="none" stroke="white" stroke-width="3"/>
              <circle cx="500" cy="275" r="3" fill="white"/>

              <rect x="10" y="110" width="160" height="330" fill="none" stroke="white" stroke-width="3"/>
              <rect x="10" y="201" width="55" height="148" fill="none" stroke="white" stroke-width="3"/>
              <circle cx="115" cy="275" r="3" fill="white"/>

              <rect x="830" y="110" width="160" height="330" fill="none" stroke="white" stroke-width="3"/>
              <rect x="935" y="201" width="55" height="148" fill="none" stroke="white" stroke-width="3"/>
              <circle cx="885" cy="275" r="3" fill="white"/>

              <path d="M 10 30 A 20 20 0 0 1 30 10" fill="none" stroke="white" stroke-width="3"/>
              <path d="M 970 10 A 20 20 0 0 1 990 30" fill="none" stroke="white" stroke-width="3"/>
              <path d="M 10 520 A 20 20 0 0 0 30 540" fill="none" stroke="white" stroke-width="3"/>
              <path d="M 970 540 A 20 20 0 0 0 990 520" fill="none" stroke="white" stroke-width="3"/>
            </svg>
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
            <label class="form-label">当前球员</label>
            <div class="info-display">
              {{ editingPlayer.name }} ({{ editingPlayer.number }})
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="cancel-btn" @click="cancelEdit">
              <i class="icon-close"></i> 关闭
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
.tactic-board {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warn-color: #f56c6c;
  --bg-color: #f0f2f5;
  --card-bg: #ffffff;
  --text-color: #333;
  --border-color: #dcdfe6;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
  --pitch-green-1: #44d947;
  --pitch-green-2: #2fc63f;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-color, #f0f2f5);
  padding: 20px;
  gap: 20px;
  color: var(--text-color, #333);
}

.top-controls {
  padding: 16px 20px;
  background-color: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 12px;
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
}

.top-controls .control-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-items {
  display: flex;
  align-items: center;
  gap: 16px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.tactic-summary {
  display: flex;
  align-items: baseline;
}

.summary-label {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color, #333);
}

.tactic-name-display {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color, #409eff);
  max-width: 320px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 20px;
}

.left-panel {
  width: 320px;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 12px;
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
}

.field-container {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  background-color: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 12px;
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
}

.control-card {
  background-color: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color, #dcdfe6);
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  color: #0154a0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  color: #666;
}

.info-display,
.player-info-display {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 40px;
  padding: 8px 12px;
  width: 100%;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 10px;
  background-color: #f5f7ff;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #333);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
  gap: 6px;
}

.player-info-display {
  flex-wrap: wrap;
}

.role-player-number {
  margin-left: auto;
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

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
  font-size: 14px;
  color: #666;
}

.field {
  position: relative;
  width: 1000px;
  height: 550px;
  background: repeating-linear-gradient(
    90deg,
    var(--pitch-green-1, #44d947) 0px,
    var(--pitch-green-1, #44d947) 40px,
    var(--pitch-green-2, #2fc63f) 40px,
    var(--pitch-green-2, #2fc63f) 80px
  );
  border-radius: 8px;
  box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
  border: 2px solid #ebeef5;
}

.pitch-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.player {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  color: white;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
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
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  color: #ffffff;
}

.back-btn {
  background-color: var(--primary-color, #409eff);
  color: #ffffff;
  border: none;
  padding: 0 16px;
  height: 40px;
  min-width: 96px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  appearance: none;
  outline: none;
}

button:hover {
  opacity: 0.9;
}

button:active {
  opacity: 1;
}

button i {
  margin-right: 6px;
  font-size: 14px;
}

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
  inset: 0;
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
  margin: 0 0 20px 0;
  color: var(--primary-color, #409eff);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
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

.cancel-btn:hover {
  background-color: #e0e0e0;
}

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

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color, #dcdfe6);
  }

  .field {
    width: 100%;
    height: 500px;
  }
}

@media (max-width: 768px) {
  .tactic-board {
    padding: 16px;
  }

  .top-controls .control-group {
    flex-direction: column;
    align-items: stretch;
  }

  .control-items {
    position: static;
    transform: none;
    width: 100%;
    justify-content: center;
  }

  .tactic-summary {
    width: 100%;
    justify-content: center;
  }
}
</style>