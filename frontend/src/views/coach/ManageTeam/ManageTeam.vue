<template>
  <div class="team-management-container">
    <div class="team-info-section">
     
      <div class="team-details">
        <div class="team-logo">
          <img :src="teamLogo" alt="球队Logo" class="logo-image">
        </div>
        <div class="team-meta">
          <strong style="padding-top: 50px;font-size: 25px;">人员统计</strong>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-value">{{ players.length }}</span>
              <span class="stat-label">球员</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ managers.length }}</span>
              <span class="stat-label">经理</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ doctors.length }}</span>
              <span class="stat-label">队医</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>

    <div class="personnel-management-section">
      <div class="personnel-header">
        <h2>人员管理</h2>
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id" 
            :class="{ 'active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div> 
        <button class="back-btn" @click=back>返回</button>
      </div>
      </div>

      <div class="personnel-list">
        <!-- 球员卡片列表 -->
        <div v-if="activeTab === 'players'" class="cards-container">
          <div 
            v-for="player in players" 
            :key="player.id" 
            class="person-card"
            @click="showPersonDetail(player)"
          >
            <div class="card-avatar"
            >
              <img :src="getAvatarUrl(player)" alt="头像" class="avatar-image">
              <div v-if="player.player_number" class="player-number">{{ player.player_number }}</div>
            </div>
            <div class="card-name">{{ player.player_name }}</div>
          </div>
        </div>

        <!-- 经理卡片列表 -->
        <div v-if="activeTab === 'managers'" class="cards-container">
          <div 
            v-for="manager in managers" 
            :key="manager.id" 
            class="person-card"
            @click="showPersonDetail(manager)"
          >
            <div class="card-avatar">
              <img :src="getAvatarUrl(manager)" alt="头像" class="avatar-image">
            </div>
            <div class="card-name">{{ manager.name }}</div>
          </div>
        </div>

        <!-- 队医卡片列表 -->
        <div v-if="activeTab === 'doctors'" class="cards-container">
          <div 
            v-for="doctor in doctors" 
            :key="doctor.id" 
            class="person-card"
            @click="showPersonDetail(doctor)"
          >
            <div class="card-avatar">
              <img :src="getAvatarUrl(doctor)" alt="头像" class="avatar-image">
            </div>
            <div class="card-name">{{ doctor.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 人员详情弹窗 -->
    <div v-if="selectedPerson" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ getPersonTitle(selectedPerson) }}详情</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-avatar">
            <img :src="getAvatarUrl(selectedPerson)" alt="头像" class="avatar-image-large">
            <div v-if="selectedPerson.player_number" class="player-number-large">{{ selectedPerson.player_number }}</div>
          </div>
          
          <div class="detail-info">
            <!-- 球员详情 -->
            <div v-if="selectedPerson.type === 'player'" class="detail-section">
              <div class="detail-row">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">{{ selectedPerson.player_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">号码:</span>
                <input 
                  type="number" 
                  v-model="selectedPerson.player_number" 
                  min="1" 
                  max="99"
                  class="detail-input"
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">身高(cm):</span>
                <input 
                  v-model="selectedPerson.height" 
                  class="detail-input"
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">体重(kg):</span>
                <input 
                  v-model="selectedPerson.weight" 
                  class="detail-input"
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">惯用脚:</span>
                <select v-model="selectedPerson.dominant_foot" class="detail-select">
                  <option value="左脚">左脚</option>
                  <option value="右脚">右脚</option>
                </select>
              </div>
              <div class="detail-row">
                <span class="detail-label">年龄:</span>
                <input 
                  v-model="selectedPerson.age" 
                  class="detail-input"
                >
              </div>
              
            </div>
            
            <!-- 经理详情 -->
            <div v-if="selectedPerson.type === 'manager'" class="detail-section">
              <div class="detail-row">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">{{ selectedPerson.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">联系方式:</span>
                <span class="detail-value">{{ selectedPerson.phone }}</span>
              </div>
            </div>
            
            <!-- 队医详情 -->
            <div v-if="selectedPerson.type === 'medic'" class="detail-section">
              <div class="detail-row">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">{{ selectedPerson.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">联系方式:</span>
                <span class="detail-value">{{ selectedPerson.phone }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="remove-btn" @click="removePerson(selectedPerson.uid)">移除</button>
          <button class="save-detail-btn" @click="saveTeamInfo">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { ElMessage, ElMessageBox } from 'element-plus';

export default { 
  data() {
    return {
    users:[], 
    players:[],
    managers:[],
    doctors:[],
    tabs: [
      { id: 'players', label: '球员' },
      { id: 'managers', label: '经理' },
      { id: 'doctors', label: '队医' },
    ],
    activeTab: 'players',
    teamLogo:null,
    teamname:null, 
    teamyear:null,
    homeStadium:null,
    headCoach:null,
    team_description:null,
    selectedPerson: null, // 当前选中的人员
    }
  },
    
  created() {
      this.fetchTeamInfo();
      this.fetchUserList();
    },
  setup() {
    const router = useRouter();
    onMounted(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.type !== "coach") {
          ElMessage.error("无权访问该页面");
          router.replace("/login");
        }
      } else {
        ElMessage.error("请先登录");
        router.replace("/login");
      }
    });
    return { router };
  },
     
   
    methods:{
    back(){
          this.$router.push('/chome');
        },
        
    // 获取头像URL - 这里假设没有真实头像数据，使用默认头像
    getAvatarUrl(person) {
      // 如果有真实头像URL，返回真实URL
      if (person.avatar) {
        return  `http://localhost:5000${person.avatar}`
      }
      // 否则返回默认头像
      return 'https://via.placeholder.com/100x100?text=' + (person.player_name || person.name).charAt(0);
    },
    
    // 显示人员详情
    showPersonDetail(person) {
      this.selectedPerson = JSON.parse(JSON.stringify(person)); // 深拷贝
    },
    
    // 关闭弹窗
    closeModal() {
      this.selectedPerson = null;
    },
    
    // 获取人员类型标题
    getPersonTitle(person) {
      switch(person.type) {
        case 'player': return '球员';
        case 'manager': return '经理';
        case 'medic': return '队医';
        default: return '人员';
      }
    },
    
    // 保存人员详情
    savePersonDetail() {
      if (this.selectedPerson.type === 'player') {
        // 更新players数组中对应的球员信息
        const index = this.players.findIndex(p => p.id === this.selectedPerson.id);
        if (index !== -1) {
          this.players[index] = {...this.selectedPerson};
        }
      }
      this.closeModal();
      ElMessage.success('信息已更新');
    },

    async fetchTeamInfo() {
        try {
              const res = await axios.get("http://localhost:5000/api/schedule/team", { 
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              
              // 检查响应数据是否存在
              if (res.data && res.data.teamname && res.data.teamname.length > 0) {
                this.teamname = res.data.teamname[0].name;
                
                // 获取主队队徽
                if (res.data.teamlist && res.data.teamlist.length > 0) {
                  const myTeam = res.data.teamlist.find(team => team.name === this.teamname);
                  if (myTeam && myTeam.logo_path) {
                    this.teamLogo = `http://localhost:5000${myTeam.logo_path}`;
                  }
                }   
                
               
              }
            } catch (error) {
              console.error('获取球信息失败:', error);
              ElMessage.error('获取球队信息失败');
            }  
      },
    async fetchUserList(){
      try {
            const response = await axios.get("http://localhost:5000/api/player/list", { 
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            this.users = JSON.parse(JSON.stringify(response.data.userlist));
            
            this.players=this.users.filter(user => user.type === 'player') ;
           
            this.managers=this.users.filter(user => user.type === 'manager');
            this.doctors=this.users.filter(user => user.type === 'medic') ;
          } catch (error) {
           
            ElMessage.error('获取球员列表失败');
          } 
    },
    async removePerson(uid) {
      try {
        await ElMessageBox.confirm('确定删除该人员吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
       const res=await axios.delete(`http://localhost:5000/api/player/${uid}`, { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
       
        if (res.data.code === 0) { 
          ElMessage.success('移除成功');
          // 关闭弹窗
          this.closeModal();
          // 刷新列表
          this.fetchUserList();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('移除人员失败:', error);
          ElMessage.error('移除人员失败');
        }
      }
    },
    async saveTeamInfo() {
      try {
        for (const player of this.players) {
          // 确保所有必填字段存在且有效
          const playerData = {
            player_number: Number(player.player_number),  // 必须转换为数字
            height: Number(player.height),        // 必须且介于100-250
            weight: Number(player.weight),        // 必须
            dominant_foot: player.dominant_foot , 
            age: player.age ? Number(player.age) : null ,    // 可选字段
            health: player.health,
          };

      // 调试：打印实际发送的数据
      console.log('正在发送的数据:', playerData);

      const res = await axios.put(
        `http://localhost:5000/api/player/${player.id}`,
        playerData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }ElMessage.success('保存成功');
    this.closeModal();
  } 
  catch (error) {
    // 显示后端返回的具体错误信息
    const errorMsg = error.response?.data?.msg || error.message;
    ElMessage.error(`保存失败: ${errorMsg}`);
    console.error('完整错误响应:', error.response?.data);
  }
}
    }
}
</script>

<style scoped>
.team-management-container {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
  gap: 20px;
}

.team-info-section {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.personnel-management-section {
  flex: 2;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.team-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.team-logo {
  padding-top: 15px;
  height: 250px;
  width: 250px;
}

.logo-image {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #dcdfe6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.team-meta .form-group {
  width: 1000px;
  margin-bottom: 15px;
  padding-top: 100px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  display: block;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #409eff;
}

textarea.form-control {
  min-height: 80px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding: 30px;
  background: #fafafa;
  border-radius: 15px;
  border:solid 2px #1b90d4;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: auto;
}

.stat-item {
  text-align: center;
  padding: 15px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.save-btn {
  width: 40%;
  background-color: #67c23a;
  color: white;
  font-weight: bold;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
}
.btn-group {
  display: flex;
  justify-content: space-around;
}
.back-btn{
  width: 70px;
  height: 40px;
  background-color: #45b9eb;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.back-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background: #6ea5ca;
}
.save-btn:hover {
  background-color: #529b2d;
}

.personnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tabs {
  display: flex;
  gap: 10px;
}

.tabs button {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background-color: #ebeef5;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tabs button.active {
  background-color: #409eff;
  color: white;
}

/* 卡片样式 */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  padding: 15px 0;
}

.person-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.person-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background: #f0f9ff;
}

.card-avatar {
  position: relative;
  margin-bottom: 15px;
  border-radius: 50%;
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e1e5eb;
}

.player-number {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #409eff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.card-name {
  font-weight: 600;
  color: #333;
  text-align: center;
  font-size: 14px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-avatar {
  position: relative;
  margin-bottom: 20px;
}

.avatar-image-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e1e5eb;
}

.player-number-large {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: #409eff;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.detail-info {
  width: 100%;
}

.detail-section {
  width: 100%;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #666;
  width: 100px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-input, .detail-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  transition: border-color 0.3s;
}

.detail-input:focus, .detail-select:focus {
  outline: none;
  border-color: #409eff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eaeaea;
}

.remove-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #dd6161;
}

.save-detail-btn {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-detail-btn:hover {
  background-color: #529b2d;
}

.team-meta{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.personnel-list{
  overflow-y: auto;
}
</style>