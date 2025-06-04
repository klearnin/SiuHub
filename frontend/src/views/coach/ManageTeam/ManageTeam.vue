<template>
  
    <div class="team-management-container">
      <div class="team-info-section">
       
        <div class="team-details">
          <div class="team-logo">
            <img :src="teamLogo" alt="球队Logo" class="logo-image" >
          </div>
          <div class="team-meta">
            
            <strong style="padding-top: 20px;font-size: 25px;">人员统计</strong>
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
        <div class="btn-group">
          <button class="back-btn"@click=back>返回</button>
        <button class="save-btn" @click="saveTeamInfo">保存信息</button>
       
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
          <div></div>
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
                <th>惯用脚</th>
             
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
                  <select v-model="player.dominant_foot" class="foot-select">
                    <option value="左脚">左脚</option>
                    <option value="右脚">右脚</option>
                  </select>
                </td>
            
                <td>
                  <button class="remove-btn" @click="removePerson(player.uid)">移除</button>
                 
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- 经理列表 -->
          <table v-if="activeTab === 'managers'" class="personnel-table">
            <thead>
              <tr class="head">
                <th>姓名</th>
                
                <th>联系方式</th>
                <th style="margin-right: auto;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="manager in managers" :key="manager.id">
                <td>{{ manager.name }}</td>
               
                <td>{{ manager.phone }}</td>
                <td>
                  <button class="remove-btn" @click="removePerson(manager.uid)">移除</button>
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- 队医列表 -->
          <table v-if="activeTab === 'doctors'" class="personnel-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>联系方式</th>
                <th style="margin-right: auto;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doctor in doctors" :key="doctor.id">
                <td>{{ doctor.name }}</td>
                <td>{{ doctor.phone }}</td>
               
                <td>
                  <button class="remove-btn" @click="removePerson(doctor.uid)">移除</button>
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
       
        if (res.data.code === 0) { ElMessage.success('移除成功');}
      } catch (error) {
        if (error !== 'cancel') {console.error('移除人员失败:', error);
        ElMessage.error('移除人员失败');
      }}
      this.fetchUserList();
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
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
  border:solid 2px #1b90d4;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
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
  width: 40%;
  background-color: #45b9eb;
  color: white;
  font-weight: bold;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
  
}
.back-btn:hover{
  background-color: #2f73a4;
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

.personnel-table {
  
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.personnel-table th, .personnel-table td {
  
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  text-align: center;
}

.personnel-table thead {
  
  background-color: #f5f7fa;
}

.personnel-table tbody tr:hover {
  background-color: #f0f9ff;
}

.number-input,
.wheight{
  width: 60px;
  height:40px;
  border-radius: 10px;
  border: 1px solid #dcdfe6;
}
.foot-select{
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  height:40px;
  
  box-sizing: border-box;
}
.health-select {
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  height:40px;
  
  box-sizing: border-box;
}

.remove-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #dd6161;
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