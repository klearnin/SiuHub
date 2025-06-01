<template>
    <div class="team-management-container">
      <div class="team-info-section">
        <h2>球队信息</h2>
        <button @click=back>返回</button>
        <div class="team-details">
          <div class="team-logo">
            <img :src="team.logo" alt="球队Logo" class="logo-image" v-if="team.logo">
            <div class="logo-placeholder" v-else>暂无Logo</div>
            <button class="upload-btn">上传Logo</button>
          </div>
          <div class="team-meta">
            <div class="form-group">
              <label>球队名称</label>
              <input type="text" v-model="team.name" class="form-control">
            </div>
            <div class="form-group">
              <label>成立年份</label>
              <input type="number" v-model="team.foundedYear" class="form-control">
            </div>
            <div class="form-group">
              <label>主场</label>
              <input type="text" v-model="team.homeStadium" class="form-control">
            </div>
            <div class="form-group">
              <label>主教练</label>
              <input type="text" v-model="team.headCoach" class="form-control">
            </div>
            <div class="form-group">
              <label>球队简介</label>
              <textarea v-model="team.description" class="form-control"></textarea>
            </div>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-value">{{ team.players.length }}</span>
                <span class="stat-label">球员</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ team.staff.managers.length }}</span>
                <span class="stat-label">经理</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ team.staff.doctors.length }}</span>
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
                <th>位置</th>
                <th>健康状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in team.players" :key="player.id">
                <td>{{ player.name }}</td>
                <td>
                  <input 
                    type="number" 
                    v-model="player.number" 
                    min="1" 
                    max="99"
                    class="number-input"
                  >
                </td>
                <td>{{ player.position }}</td>
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
              <tr v-for="manager in team.staff.managers" :key="manager.id">
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
              <tr v-for="doctor in team.staff.doctors" :key="doctor.id">
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
  
      <!-- 添加人员模态框 -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <h3>添加{{ modalTitle }}</h3>
          <form @submit.prevent="addPerson">
            <div class="form-group">
              <label>姓名</label>
              <input type="text" v-model="newPerson.name" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'players'" class="form-group">
              <label>号码</label>
              <input type="number" v-model="newPerson.number" min="1" max="99" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'players'" class="form-group">
              <label>位置</label>
              <input type="text" v-model="newPerson.position" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'managers'" class="form-group">
              <label>职位</label>
              <input type="text" v-model="newPerson.position" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'managers'" class="form-group">
              <label>联系方式</label>
              <input type="text" v-model="newPerson.contact" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'doctors'" class="form-group">
              <label>专业领域</label>
              <input type="text" v-model="newPerson.specialty" required class="form-control">
            </div>
            
            <div v-if="activeTab === 'doctors'" class="form-group">
              <label>资质</label>
              <input type="text" v-model="newPerson.qualification" required class="form-control">
            </div>
            
            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="closeModal">取消</button>
              <button type="submit" class="confirm-btn">确认添加</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
 export default { 
    setup() {
       const router = useRouter();
       const team = ref({
        name: '梦幻足球队',
        logo: '',
        foundedYear: 1990,
        homeStadium: '梦想球场',
        headCoach: '张教练',
        description: '一支充满激情和梦想的足球队，致力于培养年轻球员和取得优异成绩。',
        players: [
          { id: 1, name: '张三', number: 10, position: '前锋', healthStatus: 'healthy' },
          { id: 2, name: '李四', number: 7, position: '中场', healthStatus: 'injured' },
          { id: 3, name: '王五', number: 1, position: '守门员', healthStatus: 'healthy' },
          { id: 4, name: '赵六', number: 5, position: '后卫', healthStatus: 'recovering' },
        ],
        staff: {
          managers: [
            { id: 1, name: '钱经理', position: '总经理', contact: '13800138000' },
            { id: 2, name: '孙经理', position: '运营经理', contact: '13900139000' },
          ],
          doctors: [
            { id: 1, name: '周医生', specialty: '运动损伤', qualification: '医学博士' },
            { id: 2, name: '吴医生', specialty: '康复治疗', qualification: '物理治疗师' },
          ]
        }
      });
  
      const tabs = [
        { id: 'players', label: '球员' },
        { id: 'managers', label: '经理' },
        { id: 'doctors', label: '队医' }
      ];
  
      const activeTab = ref('players');
      const showModal = ref(false);
      const newPerson = ref({
        name: '',
        number: null,
        position: '',
        healthStatus: 'healthy',
        contact: '',
        specialty: '',
        qualification: ''
      });
  
      const modalTitle = computed(() => {
        switch (activeTab.value) {
          case 'players': return '球员';
          case 'managers': return '经理';
          case 'doctors': return '队医';
          default: return '人员';
        }
      });

    
  
      function showAddPersonModal() {
        // 重置表单
        newPerson.value = {
          name: '',
          number: null,
          position: '',
          healthStatus: 'healthy',
          contact: '',
          specialty: '',
          qualification: ''
        };
        showModal.value = true;
      }
  
      function closeModal() {
        showModal.value = false;
      }
  
      function addPerson() {
        const person = { ...newPerson.value, id: Date.now() };
        
        switch (activeTab.value) {
          case 'players':
            team.value.players.push(person);
            break;
          case 'managers':
            team.value.staff.managers.push(person);
            break;
          case 'doctors':
            team.value.staff.doctors.push(person);
            break;
        };
        closeModal();
      }
  
      function removePerson(type, id) {
        if (confirm('确定要移除此人员吗？')) {
          switch (type) {
            case 'players':
              team.value.players = team.value.players.filter(p => p.id !== id);
              break;
            case 'managers':
              team.value.staff.managers = team.value.staff.managers.filter(m => m.id !== id);
              break;
            case 'doctors':
              team.value.staff.doctors = team.value.staff.doctors.filter(d => d.id !== id);
              break;
          }
         
        }
      }
  
      function saveTeamInfo() {
        alert('球队信息已保存');
        // 这里可以添加发送到后端的逻辑
      }
  
      return {
        team,
        tabs,
        activeTab,
        showModal,
        newPerson,
        modalTitle,
        showAddPersonModal,
        closeModal,
        addPerson,
        removePerson,
        saveTeamInfo
      };
    },
    methods:{
    back(){
          this.$router.push('/chome');
        },
    }
};
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
  </style>