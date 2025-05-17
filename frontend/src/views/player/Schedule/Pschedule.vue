<template> 
  <div class="calendar-container">
    <!-- 年月选择 -->
    <div class="header">
      <select v-model="selectedYear" @change="generateCalendar">
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="selectedMonth" @change="generateCalendar">
        <option v-for="(month, idx) in months" :key="idx" :value="idx + 1">{{ month }}</option>
      </select>
      <button @click=back()>返回</button>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
      <div class="day-cell" v-for="day in calendarDays" :key="day.date" @click="openEventPrompt(day.date)">
        <div class="day-number">{{ day.day }}</div>
        <ul class="events" v-for="(schedule, index) in schedules" :key="index">
          <li v-if="schedule.date === day.date"><div class="schedule match" v-if="schedule.type==='match'">比赛 ⚽</div></li>
          <li v-if="schedule.date === day.date"><div class="schedule training" v-if="schedule.type==='training'">训练🎯</div></li>
          <li v-if="schedule.date === day.date"><div class="schedule else" v-if="schedule.type==='else'">其他📅</div></li>
        </ul>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup">
        <!-- 选项卡按钮 -->
        <!-- 模板部分保持原结构不变 -->
        <div class="tab-buttons">
          <button class="tab-button" :class="{ active: activeTab === 'match' }" @click="switchTab('match')">比赛</button>
          <button class="tab-button" :class="{ active: activeTab === 'training' }" @click="switchTab('training')">训练</button>
          <button class="tab-button" :class="{ active: activeTab === 'else' }" @click="switchTab('else')">其他</button>
        </div>

        <!-- 选项卡内容 -->
        <div class="tab-content-wrapper">
          <!-- 比赛内容 -->
          <div class="tab-content" :class="{ active: activeTab === 'match' }">
            <p class="match-info">
              <span class="team">{{ teamname || '未设定' }}</span>
              <span class="vs">{{ matchTime || '时间未设定' }} / {{ matchLocation || '地点未设定' }}</span>
              <span class="team">{{ team2 || '对手未设定' }}</span>
            </p>
            
            <div class="team-logos-container">
              <div class="team-logo-container">
                <img v-if="teamLogo" :src="teamLogo" alt="主队队徽" class="team-logo-large" />
                <span v-else class="team-logo-placeholder">主队队徽</span>
              </div>
              <div class="vs-badge">
                <strong>VS</strong>
              </div>
              <div class="team-logo-container">
                <img v-if="team2Logo" :src="team2Logo" alt="客队队徽" class="team-logo-large" />
                <span v-else class="team-logo-placeholder">对手队徽</span>
              </div>
            </div>
          </div>

          <!-- 训练内容 -->
          <div class="tab-content" :class="{ active: activeTab === 'training' }">
            <div class="schedule-info training-info">
              <div class="info-row">
                <strong>时间：</strong>
                <span>{{ trainingTime || '未设定' }}</span>
              </div>
              <div class="info-row">
                <strong>训练内容：</strong>
                <span>{{ teamTraining || '未设定' }}</span>
              </div>
            </div>
           
          </div>
          <!-- 其他内容 -->
          <div class="tab-content" :class="{ active: activeTab === 'else' }">
            <div class="schedule-info other-info">
              <div class="info-row">
                <strong>时间：</strong>
                <span>{{ elseTime || '未设定' }}</span>
              </div>
              <div class="info-row">
                <strong>事件：</strong>
                <span>{{ elseEvent || '未设定' }}</span>
              </div>
            </div>
            
            
          </div>
          
        </div>
      
        <!-- 底部按钮 -->
        <div class="either">
          <button class="cancel-button" @click="closePopup">取消</button>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';
import { ElMessage } from 'element-plus'; // ✅ 加了ElMessage
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';



export default {

  
  
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      calendarDays: [],
      selectedID: null,
      dayNames: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      showPopup: false,
      selectedDate: null,
      
      //窗口滑动的相关数据
      activeTab: 'match',
       // 比赛设置相关数据
      team1: '我的球队',
     
      team2: '',
      matchTime: '',
      matchLocation: '',
      //训练相关数据
      trainingTime: '',
      teamTraining: '',
      personalTraining: '',
      //其他相关数据
      elseTime:'',
      elseEvent:'',

      // 设置相关数据
      showEditor: false,
      editorTitle: '',
      editKey: '',

      showTimeEditor: false,
      timeEditKey: '',

      showOpponentSelector: false,

      schedules: [], // 日程表
      matchId:null,
      trainingId: null,
      elseId:null,
      teamname:'',
      myteamlogo:'',
      teamlist:[],
      teamLogo: null,
      team2Logo: null,
    };
  },
  computed: {
    years() {
      const y = new Date().getFullYear();
      return Array.from({ length: 30 }, (_, i) => y - 5 + i);
    },
    hasScheduleForSelectedDate() {
    return this.schedules.some(schedule => schedule.date === this.selectedDate);
  }
   
  },
  mounted() {
    this.generateCalendar();
  },
  created() {
      this.fetchSchedules();
    },
  setup() {
    const router = useRouter();

    onMounted(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.type !== "player") {
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
  methods: {
    async fetchSchedules() {
      const month = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}`;
      this.x = month;
      try {
        const res = await axios.get("http://localhost:5000/api/schedule/list", { 
          params: { month },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.schedules = res.data;
      } catch (error) {
        console.error('获取日程失败:', error);
        this.$message.error('获取日程失败');
      }
      
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
          
          this.teamlist = res.data.teamlist || [];
          
          // 为日程添加队徽信息
          this.processSchedulesWithLogos();
        }
      } catch (error) {
        console.error('获取球队名称失败:', error);
        this.$message.error('获取球队名称失败');
      }
    },

    // 处理日程数据，添加队徽信息
    processSchedulesWithLogos() {
      if (!this.teamlist || this.teamlist.length === 0 || !this.schedules) return;
      
      this.schedules.forEach(schedule => {
        if (schedule.type === 'match' && schedule.team2) {
          const team = this.teamlist.find(t => t.name === schedule.team2);
          if (team && team.logo_path) {
            schedule.team2logo = `http://localhost:5000${team.logo_path}`;
          }
        }
      });
    },

    updateOpponent(teamName) {
      this.team2 = teamName;
      // 从teamlist中找到对应队伍的logo
      const selectedTeam = this.teamlist.find(team => team.name === teamName);
      if (selectedTeam && selectedTeam.logo_path) {
        this.team2Logo = `http://localhost:5000${selectedTeam.logo_path}`;
      } else {
        this.team2Logo = null; // 没找到对应队徽时清空
      }
      this.showOpponentSelector = false;
    },
    



    back() {
      this.$router.push('/phome');
    },

   

    // 生成日历
    async generateCalendar() {
      const year = this.selectedYear;
      const month = this.selectedMonth - 1;
      const firstDay = new Date(year, month, 1);
      const lastDate = new Date(year, month + 1, 0).getDate();
      const startWeekDay = firstDay.getDay();

      const days = [];

      // 添加空白项
      for (let i = 0; i < startWeekDay; i++) {
        days.push({ day: '', date: '' });
      }

      // 添加日期项
      for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(this.selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ day: i, date: dateStr });
      }

      this.calendarDays = days;
      await this.fetchSchedules();
    },
    
    // 打开事件输入框
    openEventPrompt(date) {
        if (!date) return;
        this.selectedDate = date;

        // 重置队徽
        this.team2Logo = null;

        for (const schedule of this.schedules || []) {
        if (schedule.date === this.selectedDate) {
          if (schedule.type === 'match') {
            this.matchId = schedule.id;
            this.matchTime = schedule.match_time;
            this.matchLocation = schedule.location;
            this.team2 = schedule.team2;
            this.team1 = this.teamname;
            
            // 设置队徽
            if (schedule.team2logo) {
              this.team2Logo = schedule.team2logo;
            } else {
              // 如果schedule没有队徽，尝试从teamlist中获取
              const team = this.teamlist.find(t => t.name === schedule.team2);
              if (team && team.logo_path) {
                this.team2Logo = `http://localhost:5000${team.logo_path}`;
              }
            }
            
            this.activeTab = 'match';
          } else if (schedule.type === 'training') {
            this.trainingId = schedule.id;
            this.trainingTime = schedule.training_time;
            this.teamTraining = schedule.team_training;
            this.personalTraining = schedule.personal_training;
            this.activeTab = 'training';
          }else if (schedule.type === 'else') {
            this.elseId = schedule.id;
            this.elseTime = schedule.else_time;
            this.elseEvent = schedule.content;
            this.activeTab = 'else';
          }
          this.selectedID = schedule.id;
        }
     }
    this.showPopup = true;
  },

  // 关闭弹窗
  closePopup() {
      this.matchLocation ='';
      this.team2 = '';
      this.matchTime='';
      this.trainingTime = '';
      this.teamTraining = '';
      this.personalTraining = '';
      this.showPopup = false;
      this.elseTime='',
      this.elseEvent='',
      this.selectedID = null,
      this.matchId=null,
      this.trainingId=null,
      this.elseId=null  
    },
    


    switchTab(tab) {
      if (tab === this.activeTab) return;
      this.activeTab = tab;
      for (const schedule of this.schedules || []) {
        if (schedule.type === this.activeTab && schedule.date === this.selectedDate) {
          this.selectedID = schedule.id;
        }
      }
    },

    // 编辑日程信息
    edit(title, key) {
      this.editorTitle = `请输入${title}`;
      this.editKey = key;
      this.showEditor = true;
    },
    updateValue(value) {
      this[this.editKey] = value;
      this.showEditor = false;
    },

    openTimeEditor(key) {
      this.timeEditKey = key;
      this.showTimeEditor = true;
    },

    updateTimeFromSlider(value) {
      this[this.timeEditKey] = value;
      this.showTimeEditor = false;
    },

     

    async saveMatchInfo() {  // 👇发送给后端
    const payload = {
      date: this.selectedDate,
      match_time: this.matchTime,
      location: this.matchLocation,
      team2: this.team2,
      type:'match',
      team1: this.team1, 
      events: [],
    };
    if (
          this.matchTime.trim() === '' || 
          this.matchLocation.trim() === '' ||
          this.team2.trim() === ''
        ) {
          ElMessage.warning("请输入完整比赛日程！");
          return;
        }
     // 开启时使用
     try {
          const response = await  axios.post('http://localhost:5000/api/schedule/match', payload,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.code === 0){
            ElMessage.success(`比赛日程保存成功！`);
          } 
        } catch (error) {
          ElMessage.error(`保存失败：${response.data.msg}`);
        }
      await this.fetchSchedules(); 
      this.closePopup();
  },

  async changeMatchInfo() {  // 👇发送给后端
    const payload = {
      date: this.selectedDate,
      match_time: this.matchTime,
      location: this.matchLocation,
      team2: this.team2,
      type:'match',
      team1: this.team1,
    };
    try {
          const response = await  axios.put(`http://localhost:5000/api/schedule/schedule/${this.selectedID}`, payload,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('发送给后端的内容：', payload);
          if (response.data.code === 0){
            ElMessage.success(`比赛日程修改成功！`);
          } 
        } catch (error) {
          ElMessage.error(`修改失败：${response.data.msg}`);
        }
      await this.fetchSchedules(); 
      this.closePopup();
    },

    async saveTrainingInfo() {
      const payload = {
        date: this.selectedDate,
        training_time: this.trainingTime,
        team_training: this.teamTraining,
        personal_training: this.personalTraining,
      };
      if (
          this.trainingTime.trim() === '' || 
          this.teamTraining.trim() === '' 
        ) {
          ElMessage.warning("请输入完整训练日程！");
          return;
        }
      try {
        const res = await axios.post('http://localhost:5000/api/schedule/training', payload,{
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          ElMessage.success(`训练日程保存成功！`);
      } catch (err) {
        console.error('保存失败', err);
        this.$message.error('保存失败');
      }
      await this.fetchSchedules();
      this.closePopup();
    },


    async changeTrainingInfo() {
      const payload = {
        date: this.selectedDate,
        training_time: this.trainingTime,
        team_training: this.teamTraining,
        personal_training: this.personalTraining,
        type: 'training',
      };
      try {
        const res = await axios.put(`http://localhost:5000/api/schedule/schedule/${this.selectedID}`, payload);
        ElMessage.success(`训练日程修改成功！`);
      } catch (err) {
        console.error('修改失败', err);
        this.$message.error('修改失败');
      }
      await this.fetchSchedules();
      this.closePopup();
    },
        async saveElseInfo() {
      const payload = {
        date: this.selectedDate,
        else_time: this.elseTime,
        content: this.elseEvent,
      };
      if (
          this.elseTime.trim() === '' || 
          this.elseEvent.trim() === '' 
        ) {
          ElMessage.warning("请输入完整其他日程！");
          return;
        }
      try {
        const res = await axios.post('http://localhost:5000/api/schedule/else', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.code === 0) {
          ElMessage.success(`训练日程保存成功！`);
        } else {
          this.$message.error('保存失败：' + res.data.message);
        }
      } catch (err) {
        console.error('保存失败', err);
        this.$message.error('其他日程保存失败');
      }
      await this.fetchSchedules();
      this.closePopup();
    },

    async changeElseInfo() {
      const payload = {
        date: this.selectedDate,
        else_time: this.elseTime,
        content: this.elseEvent ,
        type: 'else',
      };
      try {
        const res = await axios.put(`http://localhost:5000/api/schedule/schedule/${this.elseId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.message === '其他日程更新成功') {
          this.$message.success('其他日程修改成功');
        } else {
          this.$message.error('修改失败：' + res.data.message);
        }
      } catch (err) {
        console.error('修改失败', err);
        this.$message.error('其他日程修改失败');
      }
      await this.fetchSchedules();
      this.closePopup();
    },




    async deleteScheduleInfo() {  
    try {
          const response = await  axios.delete(`http://localhost:5000/api/schedule/${this.selectedID}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.code === 0) {
            const typeMap = {
              match: '比赛',
              training: '训练',
              else: '其他'
            };
            const typeName = typeMap[this.activeTab] || '日程';
            ElMessage.success(`${typeName}日程删除成功！`);
          }
        } catch (error) {
          ElMessage.error('删除失败');
        }
      await this.fetchSchedules(); 
      this.closePopup();
      
    },
  },
};
</script>

<style scoped>
.calendar-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
  align-items: center;
}

.header select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cfd4da;
  background-color: white;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header select:hover {
  border-color: #3b82f6;
}

.header select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.header button {
  width: 60px;
  height: 36px;
  font-size: 14px;
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header button:hover {
  background-color: #4dabf7;
  color: white;
  transform: translateY(-2px);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.day-name {
  font-weight: 600;
  text-align: center;
  padding: 10px 0;
  background-color: #e9ecef;
  border-radius: 8px 8px 0 0;
  color: #495057;
}

.day-cell {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  min-height: 100px;
  padding: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.day-cell:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #dee2e6;
}

.day-number {
  font-weight: 600;
  margin-bottom: 8px;
  color: #343a40;
}

.events {
  font-size: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.events li {
  margin-bottom: 4px;
}

.schedule {
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.match {
  background: linear-gradient(135deg, #4dabf7, #3b82f6);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.training {
  background: linear-gradient(135deg, #51cf66, #37b24d);
  box-shadow: 0 2px 4px rgba(55, 178, 77, 0.3);
}

.else {
  background: linear-gradient(135deg, #fcc419, #f59f00);
  box-shadow: 0 2px 4px rgba(245, 159, 0, 0.3);
}

/* 弹窗样式 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.popup {
  width: 80%;
  max-width: 700px;
  height: auto;
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.either {
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
  margin-top: auto;
  border-top: 1px solid #e9ecef;
}

.popup button {
  padding: 10px 18px;
  background: linear-gradient(135deg, #4dabf7, #3b82f6);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 5px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 3px 6px rgba(59, 130, 246, 0.3);
}

.popup button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(59, 130, 246, 0.4);
}

.popup button:active {
  transform: translateY(0);
}

/* 强制覆盖特殊按钮 */
.popup .del_button {
  background: linear-gradient(135deg, #fa5252, #e03131);
  box-shadow: 0 3px 6px rgba(224, 49, 49, 0.3);
}

.popup .del_button:hover {
  box-shadow: 0 5px 10px rgba(224, 49, 49, 0.4);
}

.popup .cancel-button {
  background: linear-gradient(135deg, #adb5bd, #868e96);
  box-shadow: 0 3px 6px rgba(134, 142, 150, 0.3);
}

.popup .cancel-button:hover {
  box-shadow: 0 5px 10px rgba(134, 142, 150, 0.4);
}

/* 选项卡样式 */
.tab-buttons {
  display: flex;
  margin-bottom: 20px;
  background-color: #f1f3f5;
  padding: 5px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  background: transparent;
  color: #495057;
  font-size: 14px;
  margin: 0 5px;
}

/* 动态颜色方案 */
.tab-button:nth-child(1).active {
  background: linear-gradient(135deg, #4dabf7, #0c2b5d);
  color: white;
}

.tab-button:nth-child(2).active {
  background: linear-gradient(135deg, #51cf66, #0b6a1d);
  color: white;
}

.tab-button:nth-child(3).active {
  background: linear-gradient(135deg, #fcc419, #7a5715);
  color: white;
}

/* 激活状态 */
.tab-button.active {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

/* 悬停交互 */
.tab-button:hover:not(.active) {
  background-color: #dee2e6;
}

/* 选项卡内容容器 */
.tab-content-wrapper {
  position: relative;
  min-height: 300px;
  height: auto;
  overflow: visible;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 选项卡内容通用样式 */
.tab-content {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 350px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: opacity 0.3s ease;
  opacity: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.tab-content.active {
  opacity: 1;
  display: flex;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 比赛信息样式*/
.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 20px;
  margin-bottom: 25px;
  font-weight: 600;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  background-color: #f8f9fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.match-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #c5cfd9;
}

.match-info .team {
  width: 45%;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #1c7ed6;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  line-height: 1.4;
}

.match-info .vs {
  width: 50%;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  line-height: 1.5;
  padding: 0 10px;
  position: relative;
}

.match-info .vs::before,
.match-info .vs::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30px;
  height: 2px;
  background-color: #adb5bd;
  transform: translateY(-50%);
}

.match-info .vs::before {
  left: -15px;
}

.match-info .vs::after {
  right: -15px;
}

/* 队徽样式 */
.team-logos-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 15px 0;
  padding: 0 10px;
}

.buttons-center {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  max-width: 60%;
  align-items: center;
}

.team-logo-container {
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.team-logo-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background-color: white;
  padding: 5px;
  border: 3px solid transparent;
}

.team-logo-container:first-child .team-logo-large {
  border-color: #4dabf7;
}

.team-logo-container:last-child .team-logo-large {
  border-color: #f03e3e;
}

.team-logo-large:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
.vs-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  color: #100b0b;
  font-weight: bold;
  margin: 0 15px;
}

.team-logo-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f1f3f5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: #868e96;
  text-align: center;
}

/* 训练和其他事件信息样式 */
.schedule-info {
  width: 100%;
  padding: 20px;
  margin-bottom: 25px;
  font-weight: 600;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  background-color: #f8f9fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.schedule-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #c5cfd9;
}

.training-info {
  border-left: 5px solid #51cf66;
}

.other-info {
  border-left: 5px solid #fcc419;
}

.info-row {
  margin-bottom: 15px;
  font-size: 18px;
  line-height: 1.5;
}

.info-row strong {
  color: #1c7ed6;
  margin-right: 10px;
  font-weight: 700;
}

.info-row span {
  color: #495057;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
  margin-top: 10px;
}

.button-group button {
  width: 100%;
}
</style>
