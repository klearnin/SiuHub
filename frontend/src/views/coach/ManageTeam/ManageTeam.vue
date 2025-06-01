<template>
    <div class="team-management-container">
      <div class="team-info-section">
        <h2>球队信息</h2>
        <button @click=back>返回</button>
        <div class="team-details">
          <div class="team-logo">
            <img :src="teamLogo" alt="球队Logo" class="logo-image" >
           
           
          </div>
          <div class="team-meta">
            <div class="form-group">
              <label>球队名称</label>
              <input type="text" v-model="teamname" class="form-control">
            </div>
            <div class="form-group">
              <label>成立年份</label>
              <input type="number" v-model="teamyear" class="form-control">
            </div>
            <div class="form-group">
              <label>主场</label>
              <input type="text" v-model="homeStadium" class="form-control">
            </div>
           
            <div class="form-group">
              <label>球队简介</label>
              <textarea v-model="team_description" class="form-control"></textarea>
            </div>
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
        <button class="save-btn" @click="saveTeamInfo">保存球队信息</button>
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
          <button class="add-btn" @click="showAddPersonModal">+ 添加人员</button>
        </div>
  
        <div class="personnel-list">
          <!-- 球员列表 -->
          <table v-if="activeTab === 'players'" class="personnel-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>号码</th>
                <th>身高(cm)</th>
                <th>体重(kg)</th>
                <th>健康状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in players" :key="player.id">
                <td>{{ player.player_name }}</td>
                <td>
                  <input 
                    type="number" 
                    v-model="player.player_number" 
                    min="1" 
                    max="99"
                    class="number-input"
                  >
                </td>
                <td><input class="wheight" v-model="player.height" @change=""></td>
                <td><input class="wheight" v-model="player.weight"></td>
                <td>
                  <select v-model="player.healthStatus" class="health-select">
                    <option value="healthy">健康</option>
                    <option value="injured">受伤</option>
                    <option value="recovering">恢复中</option>
                  </select>
                </td>
                <td>
                  <button class="remove-btn" @click="removePerson('players', player.id)">移除</button>
                 
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- 经理列表 -->
          <table v-if="activeTab === 'managers'" class="personnel-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>职位</th>
                <th>联系方式</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="manager in managers" :key="manager.id">
                <td>{{ manager.name }}</td>
                <td>{{ manager.position }}</td>
                <td>{{ manager.contact }}</td>
                <td>
                  <button class="remove-btn" @click="removePerson('managers', manager.id)">移除</button>
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- 队医列表 -->
          <table v-if="activeTab === 'doctors'" class="personnel-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>专业领域</th>
                <th>资质</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doctor in doctors" :key="doctor.id">
                <td>{{ doctor.name }}</td>
                <td>{{ doctor.specialty }}</td>
                <td>{{ doctor.qualification }}</td>
                <td>
                  <button class="remove-btn" @click="removePerson('doctors', doctor.id)">移除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  import { ElMessage } from 'element-plus';

 
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
            this.users = response.data.playerlist;
            //this.players=this.users.find(user => user.type === 'player')?.players || [];
            this.players = Object.assign([], this.users); 
            this.managers=this.users.find(user => user.type === 'manager')?.managers || [];
            this.doctors=this.users.find(user => user.type === 'doctor')?.doctors || [];
          } catch (error) {
            console.error('获取球员列表失败:', error);
            ElMessage.error('获取球员列表失败');
          }
         
    },
    async saveTeamInfo(){
      for (const player of this.players) {
       
        try {
      
        const res=await axios.put(`http://localhost:5000/api/player/${player.id}`)
        } catch (error) {
          console.error('保存球队信息失败:', error);
          ElMessage.error('保存球队信息失败');
          }
      }
     
      }
    }
}
  </script>
  
  <style scoped>
  .team-management-container {
    display: flex;
    min-height: 100vh;
    font-family: 'Arial', sans-serif;
  }
  
  .team-info-section {
    flex: 1;
    padding: 20px;
   
    background-color: #f5f5f5;
    border-right: 1px solid #ddd;
    width:400px;
  }
  
  .personnel-management-section {
    flex: 2;
    padding: 20px;
    background-color: #fff;
  }
  
  .team-details {
    display: flex;
    margin-bottom: 20px;
  }
  
  .team-logo {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 20px;
    height:300px;
  }
  
  .logo-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 10px;
    border: 2px solid #ddd;
  }
  
  .logo-placeholder {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background-color: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    color: #666;
    font-size: 14px;
  }
  
  .team-meta {
    flex: 2;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }
  
  textarea.form-control {
    min-height: 100px;
  }
  
  .stats {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
    padding: 15px;
    background-color: #e9e9e9;
    border-radius: 4px;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .stat-label {
    font-size: 14px;
    color: #666;
  }
  
  .save-btn, .upload-btn, .add-btn {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: auto;
  }
  
  .save-btn {
    background-color: #4CAF50;
    color: white;
    width: 100%;
  }
  
  .upload-btn {
    background-color: #2196F3;
    color: white;
    margin-top: 10px;
  }
  
  .add-btn {
    background-color: #FF9800;
    color: white;
  }
  
  .personnel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .tabs {
    display: flex;
    gap: 10px;
  }
  
  .tabs button {
    padding: 8px 15px;
    border: none;
    background-color: #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .tabs button.active {
    background-color: #2196F3;
    color: white;
  }
  
  .personnel-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .personnel-table th, .personnel-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  .personnel-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  
  .number-input {
    width: 60px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .health-select {
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .remove-btn {
    padding: 5px 10px;
   
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    max-width: 90%;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  .cancel-btn {
    padding: 8px 15px;
    background-color: #e0e0e0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .confirm-btn {
    padding: 8px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  @media (max-width: 768px) {
    .team-management-container {
      flex-direction: column;
    }
    
    .team-details {
      flex-direction: column;
    }
    
    .team-logo {
      margin-right: 0;
      margin-bottom: 20px;
    }
  }
   .wheight{
    width:60px;
   }
  </style>