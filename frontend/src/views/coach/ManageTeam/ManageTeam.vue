<template>
  <div class="team-management-container">
    <div class="team-info-section">
      <div class="team-details">
        <div class="team-logo" @click=back>
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
            <div class="card-avatar">
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
          <div class="modal-layout">
            <!-- 左侧：头像和基本信息 -->
            <div class="left-section">
              <div class="detail-avatar">
                <img :src="getAvatarUrl(selectedPerson)" alt="头像" class="avatar-image-large">
                <div v-if="selectedPerson.player_number" class="player-number-large">{{ selectedPerson.player_number }}</div>
              </div>
              
              <div class="basic-info">
                <!-- 球员基本信息 -->
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
                      type="number"
                      v-model="selectedPerson.height" 
                      class="detail-input"
                      min="150"
                      max="220"
                    >
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">体重(kg):</span>
                    <input 
                      type="number"
                      v-model="selectedPerson.weight" 
                      class="detail-input"
                      min="50"
                      max="120"
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
                      type="number"
                      v-model="selectedPerson.age" 
                      class="detail-input"
                      min="16"
                      max="45"
                    >
                  </div>
                </div>
                
                <!-- 经理基本信息 -->
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
                
                <!-- 队医基本信息 -->
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

            <!-- 右侧：位置、评级和技术统计 -->
            <div v-if="selectedPerson.type === 'player'" class="right-section">
              <div class="position-rating-section">
                <div class="detail-row">
                  <span class="detail-label">位置:</span>
                  <select v-model="selectedPerson.position" class="detail-select">
                    <option value="">请选择位置</option>
                    <option value="门将">门将</option>
                    <option value="中后卫">中后卫</option>
                    <option value="边后卫">边后卫</option>
                    <option value="防守中场">防守中场</option>
                    <option value="中场">中场</option>
                    <option value="进攻中场">进攻中场</option>
                    <option value="边锋">边锋</option>
                    <option value="前锋">前锋</option>
                  </select>
                </div>
                <div class="detail-row">
                  <span class="detail-label">评级:</span>
                  <div class="rating-input">
                    <div class="rating-stars-select">
                      <span 
                        v-for="star in 5" 
                        :key="star"
                        class="star"
                        :class="{ 'active': star <= selectedPerson.rating }"
                        @click="selectedPerson.rating = star"
                      >
                        ★
                      </span>
                    </div>
                    <span class="rating-value">{{ selectedPerson.rating || 0 }}/5</span>
                  </div>
                </div>
              </div>

              <!-- 技术统计 -->
              <div class="skills-section">
                <h4>技术统计</h4>
                <div class="skill-item">
                  <span class="skill-label">速度</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.speed" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.speed || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">射门</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.shooting" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.shooting || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">传球</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.passing" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.passing || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">盘带</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.dribbling" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.dribbling || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">防守</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.defending" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.defending || 0 }}</span>
                  </div>
                </div>
                <div class="skill-item">
                  <span class="skill-label">体能</span>
                  <div class="skill-control">
                    <input 
                      type="range" 
                      v-model="selectedPerson.stamina" 
                      min="1" 
                      max="100"
                      class="skill-slider"
                    >
                    <span class="skill-value">{{ selectedPerson.stamina || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="remove-btn" @click="removePerson(selectedPerson.uid)">移除</button>
          <button class="save-detail-btn" @click="savePersonDetail">保存</button>
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
      this.saveTeamInfo();
      this.closeModal();
      
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
          // 数据验证
          if (!player.player_number || player.player_number === '') {
            ElMessage.error(`球员 ${player.name || player.id} 的球衣号码不能为空`);
            return;
          }
          if (!player.height || player.height === '') {
            ElMessage.error(`球员 ${player.name || player.id} 的身高不能为空`);
            return;
          }
          if (!player.weight || player.weight === '') {
            ElMessage.error(`球员 ${player.name || player.id} 的体重不能为空`);
            return;
          }
          
          // 数值范围验证
          const height = Number(player.height);
          const weight = Number(player.weight);
          
          if (isNaN(height) || height < 100 || height > 250) {
            ElMessage.error(`球员 ${player.name || player.id} 的身高必须在100-250cm之间`);
            return;
          }
          if (isNaN(weight) || weight < 30 || weight > 150) {
            ElMessage.error(`球员 ${player.name || player.id} 的体重必须在30-150kg之间`);
            return;
          }
          
          // 准备完整的球员数据，为未赋值的字段提供默认值
          const playerData = {
            player_number: Number(player.player_number),
            height: height,
            weight: weight,
            dominant_foot: player.dominant_foot || null,
            age: player.age ? Number(player.age) : null,
            health: player.health || null,
            position: player.position || null,
            rating: player.rating ? Number(player.rating) : null,
            speed: player.speed ? Number(player.speed) : null,
            shooting: player.shooting ? Number(player.shooting) : null,
            passing: player.passing ? Number(player.passing) : null,
            dribbling: player.dribbling ? Number(player.dribbling) : null,
            defending: player.defending ? Number(player.defending) : null,
            stamina: player.stamina ? Number(player.stamina) : null
          };

          // 调试：打印实际发送的数据
          //console.log('正在发送的数据:', playerData);

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
        }
        
        ElMessage.success('保存成功');
        this.closeModal();
      } catch (error) {
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.team-info-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.personnel-management-section {
  flex: 2;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  position: relative;
}

.logo-image {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.03);
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding: 30px;
  background: #f0f7ff;
  border-radius: 15px;
  border: solid 2px #e6f7ff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: auto;
  width: 90%;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 10px;
  min-width: 70px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  display: block;
}

.stat-label {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.personnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.personnel-header h2 {
  margin: 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 10px;
}

.tabs button {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background-color: #f0f2f5;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tabs button.active {
  background-color: #409eff;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.tabs button:not(.active):hover {
  background-color: #e6e9ed;
  color: #333;
}

/* 卡片样式 */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
  padding: 15px 0;
}

.person-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.person-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #409eff;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.person-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  background: #f0f7ff;
}

.person-card:hover::before {
  transform: scaleX(1);
}

.card-avatar {
  position: relative;
  margin-bottom: 15px;
  border-radius: 50%;
}

.avatar-image {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e1e5eb;
  transition: transform 0.3s ease;
}

.person-card:hover .avatar-image {
  transform: scale(1.05);
}

.player-number {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #409eff;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-name {
  font-weight: 600;
  color: #333;
  text-align: center;
  font-size: 16px;
  margin-top: 5px;
  transition: color 0.3s ease;
}

.person-card:hover .card-name {
  color: #409eff;
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
  backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 800px;
  max-width: 90%;
  max-height: 90vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
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
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.modal-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  flex: 1;
}

.detail-avatar {
  position: relative;
  margin-bottom: 25px;
}

.avatar-image-large {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e1e5eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-number-large {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: #409eff;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #666;
  width: 100px;
  font-size: 14px;
}

.detail-value {
  color: #333;
  flex: 1;
  font-size: 14px;
}

.detail-input, .detail-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.detail-input:focus, .detail-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.remove-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
}

.remove-btn:hover {
  background-color: #e64e4e;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.save-detail-btn {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
}

.save-detail-btn:hover {
  background-color: #529b2d;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.team-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
}

.personnel-list {
  overflow-y: auto;
  max-height: calc(100vh - 160px);
  padding-right: 5px;
}

/* 滚动条美化 */
.personnel-list::-webkit-scrollbar {
  width: 6px;
}

.personnel-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.personnel-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}

.personnel-list::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 弹窗布局 */
.modal-layout {
  display: flex;
  gap: 30px;
  width: 100%;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right-section {
  flex: 1;
  min-width: 250px;
}

.basic-info {
  width: 100%;
  margin-top: 20px;
}

/* 评级选择器 */
.rating-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating-stars-select {
  display: flex;
}

.star {
  font-size: 24px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
  margin-right: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.star.active {
  color: #ffc107;
}

.star:hover {
  color: #ffc107;
  transform: scale(1.1);
}

.rating-value {
  font-size: 14px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

/* 位置和评级部分 */
.position-rating-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

/* 技术统计部分 */
.skills-section {
  margin-top: 10px;
}

.skills-section h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.skill-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.skill-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.skill-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #eee;
  outline: none;
    -webkit-appearance: none;
  transition: all 0.2s ease;
}

.skill-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.skill-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.skill-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.skill-value {
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}
</style>