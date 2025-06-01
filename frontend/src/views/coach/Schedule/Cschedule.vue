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
      <button class="back" @click=back()>返回</button>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
      <div class="day-cell" v-for="day in calendarDays" :key="day.date" @click="openEventPrompt(day.date)">
        <div class="day-number">{{ day.day }}</div>
        <ul class="events" v-for="(schedule, index) in schedules" :key="index">
          <li v-if="schedule.date === day.date"> <div class="schedule match" v-if="schedule.type==='match'||schedule.type==='past_match'">比赛 ⚽</div></li>
          <li v-if="schedule.date === day.date"><div class="schedule training" v-if="schedule.type==='training'">训练🎯</div></li>
          <li v-if="schedule.date === day.date"><div class="schedule else" v-if="schedule.type==='else'">其他📅</div></li>
        </ul>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup">
        <!-- 选项卡按钮 -->
        <div class="tab-buttons">
          <button class="tab-button" :class="{ active: activeTab === 'match' }" @click="switchTab('match')">比赛</button>
          <button class="tab-button" :class="{ active: activeTab === 'training' }" @click="switchTab('training')">训练</button>
          <button class="tab-button" :class="{ active: activeTab === 'else' }" @click="switchTab('else')">其他</button>
        </div>

        <!-- 选项卡内容 -->
        <div class="tab-content-wrapper">        <!-- 比赛内容 -->
         
          <div class="tab-content" :class="{ active: activeTab === 'match' }"> 
            <template v-if="!isPastmatch"> 
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
              <div class="buttons-center">
                <button @click="showOpponentSelector = true">选择对手</button>
                <button @click="openTimeEditor('matchTime')">设置时间</button>
                <button @click="edit('比赛地点', 'matchLocation')">设置地点</button>
              </div>
              <div class="team-logo-container">
                <img v-if="team2Logo" :src="team2Logo" alt="客队队徽" class="team-logo-large" />
                <span v-else class="team-logo-placeholder">对手队徽</span>
              </div>
            </div>  
          </template>
          <template v-else>
              <p class="match-info">
                <img v-if="teamLogo" :src="teamLogo" alt="主队队徽" class="team-logo-small" />
                  <span class="team">{{ teamname  }}</span>
                <div class="match_center">
                  <span class="">{{ matchTime }}</span>
                  <span class="score">{{ Object.values(scoredata.score)[0].goal }} - {{ Object.values(scoredata.score)[1].goal }}</span>
                    <span v-if="scoredata.has_penalty_shootout" class="score-penalty">
                      点球：{{ Object.values(scoredata.score)[0].penalty }} - {{ Object.values(scoredata.score)[1].penalty }}
                    </span>
                  <!-- <span> {{ matchLocation}}</span>--> 
                </div>
                  <span class="team">{{ team2 || '对手未设定' }}</span>
                  <img v-if="team2Logo" :src="team2Logo" alt="客队队徽" class="team-logo-small" />
                </p>
                <div class="timeline-container">
                  <div class="filter">
                    <label>
                      <input type="checkbox" v-model="onlyGoals" />
                      只看进球
                    </label>
                  </div>

                  <div class="timeline">
  <div
    v-for="event in filteredEvents"
    :key="event.id"
    class="timeline-item"
    :class="{ left: event.team_name === team1, right: event.team_name === team2 }"
  >
    <div class="content">
      <div class="minute">{{ formatMinuteNote(event.minute_note) }}'</div>
      <div class="detail">
        <template v-if="event.event_type === 'goal'">
          <span v-if="event.team_name === team1">{{ event.scorer_name }} ⚽</span>
          <span v-else>⚽ {{ event.scorer_name }}</span>
        </template>
        <template v-else-if="event.event_type === 'yellow_card'">
          <span v-if="event.team_name === team1">{{ event.card_player }} 🟨</span>
          <span v-else>🟨 {{ event.card_player }}</span>
        </template>
        <template v-else-if="event.event_type === 'red_card'">
          <span v-if="event.team_name === team1">{{ event.card_player }} 🟥</span>
          <span v-else>🟥 {{ event.card_player }}</span>
        </template>
        <template v-else-if="event.event_type === 'penalty' && event.penalty_result === 'score'">
          <span v-if="event.team_name === team1">{{ event.penalty_player }} ⚽</span>
          <span v-else>⚽ {{ event.penalty_player }}</span>
        </template>
        <template v-else-if="event.event_type === 'penalty' && event.penalty_result === 'miss'">
          <span v-if="event.team_name === team1">{{ event.penalty_player }} ❌</span>
          <span v-else>❌ {{ event.penalty_player }}</span>
        </template>
        <template v-else-if="event.event_type === 'substitution'">
          <span v-if="event.team_name === team1">
            {{ event.sub_in_name }} ⬆️<br />
            {{ event.sub_out_name }} ⬇️
          </span>
          <span v-else>
            ⬆️ {{ event.sub_in_name }}<br />
            ⬇️ {{ event.sub_out_name }}
          </span>
        </template>
      </div>
    </div>
    <div class="dot"></div>
  </div>
</div>
                </div>
          </template>
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
            <div class="button-group">
              <button @click="openTimeEditor('trainingTime')">设置训练时间</button>
              <button @click="edit('队伍训练内容', 'teamTraining')">设置训练内容</button>
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
            <div class="button-group">
              <button @click="openTimeEditor('elseTime')">设置时间</button>
              <button @click="edit('事件', 'elseEvent')">设置事件</button>
            </div>
          </div>
          
        </div>
        <TimeSlider v-if="showTimeEditor" @confirm="updateTimeFromSlider" @cancel="showTimeEditor = false" />
        <MatchEditor :visible="showEditor" :title="editorTitle" @confirm="updateValue" @cancel="showEditor = false" />
        <TeamSelector :myteamname="teamname" :visible="showOpponentSelector" :teamlist="teamlist" @confirm="updateOpponent"@cancel="showOpponentSelector = false"/>

        <!-- 底部按钮 -->
        <div class="either">
          <button class="cancel-button" @click="closePopup">取消</button>
          <div v-if="activeTab==='match'">
            <div v-if="matchId">
              <button class="del_button" @click="deleteScheduleInfo">删除</button>
              <button v-if="!isPastmatch" @click="changeMatchInfo">修改</button>
            </div>
            <button v-else @click="saveMatchInfo">保存</button>
          </div>
          <div v-if="activeTab==='training'">
            <div v-if="trainingId">
              <button class="del_button" @click="deleteScheduleInfo">删除</button>
              <button @click="changeTrainingInfo">修改</button>
            </div>
            <button v-else @click="saveTrainingInfo">保存</button>
          </div>
          <div v-if="activeTab==='else'">
            <div v-if="elseId">
              <button class="del_button" @click="deleteScheduleInfo">删除</button>
              <button @click="changeElseInfo">修改</button>
            </div>
            <button v-else @click="saveElseInfo">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';
import MatchEditor from './MatchEditor.vue';
import { ElMessage } from 'element-plus'; // ✅ 加了ElMessage
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TimeSlider from './TimeSlider.vue';
import TeamSelector from './TeamSelector.vue'


export default {

  components: {
    MatchEditor,
    TimeSlider,
    TeamSelector

  },
  
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
      events: [],
      scoredata: '',
      isPastmatch: false,
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
      onlyGoals: true, // 控制是否只显示进球
    };
  },
  computed: {
    years() {
        const y = new Date().getFullYear();
        return Array.from({ length: 30 }, (_, i) => y - 5 + i);
      },
      hasScheduleForSelectedDate() {
      return this.schedules.some(schedule => schedule.date === this.selectedDate);
    },
    filteredEvents() {
        return this.events
          .filter((event) => !this.onlyGoals || event.event_type === 'goal')
          .sort((a, b) => a.event_minute - b.event_minute);
      },
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
  
  // 去除 teamName 和 team.name 的首尾空格，并统一转小写比较
  const cleanTeamName = teamName.trim().toLowerCase();
  const selectedTeam = this.teamlist.find(team => 
    team.name.trim().toLowerCase() === cleanTeamName
  );

  if (selectedTeam?.logo_path) {
    this.team2Logo = `http://localhost:5000${selectedTeam.logo_path}`;
  } else {
    this.team2Logo = null;
    console.warn(`未找到匹配的队伍: ${teamName}`, {
      teamName,
      cleanTeamName,
      teamlist: this.teamlist.map(t => t.name.trim())
    });
  }
  
  this.showOpponentSelector = false;
},
    



    back() {
      this.$router.push('/chome');
    },

    formatTime(timeStr) {
    if (typeof timeStr === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const [hour, minute] = timeStr.split(":");
      return `${hour}:${minute}`;
    }
    return "无效时间";
  },
      formatMinuteNote(note) {
      if (!note) return '';
      if (note === '点球大战') return '点球大战';  // ✅ 新增
      const parts = note.split('+');
      if (parts.length === 2 && parts[1] === '0') {
        return parts[0];
      }
      return note;
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
        this.team1 = this.teamname;

        for (const schedule of this.schedules || []) {
        if (schedule.date === this.selectedDate) {
          if (schedule.type === 'match'||schedule.type ==='past_match') {
            this.matchId = schedule.id;
            this.matchTime = schedule.match_time;
            this.matchLocation = schedule.location;
            this.team2 = schedule.team2;
            this.events=schedule.events;
            this.scoredata=schedule.scoredata;
            this.isPastmatch=(schedule.type==='past_match');
            
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
      this.isPastmatch=false;
      this.team2Logo = null;
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
  background-color: #dde7f1;
  
  color: #24282b;
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
  overflow-y: auto;
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
.match_center{
  
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width:100px;
}
.score{
  font-size: 30px;
  font-weight: bold;
  color: #c51c36;
 
}
.score-penalty{
  font-size: 12px;
  color: #605d5e;
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
.team-logo-small{
  width: 75px;
  height: 75px;
  border-radius: 50%;
  object-fit: cover;
  transition: all 0.3s ease;
  border: solid 1px #cdd0d2;
  padding: 1px;

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

.timeline-container{
 
}

.filter{
  
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}
.timeline {
  
  position: relative;
  margin: 40px 0;
  padding: 0;
  width:350px;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  background-color: #4caf50;
  transform: translateX(-50%);
}

.timeline-item {
  
  position: relative;
  width: 50%;
  padding: 10px 20px;
  box-sizing: border-box;
}

.timeline-item.left {
  left: 0;
  text-align: right;
}

.timeline-item.right {
  left: 50%;
  text-align: left;
}

.timeline-item .content {
  background: #e8f5e9;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 200px;
}

.timeline-item .minute {
  font-weight: bold;
  margin-bottom: 4px;
}

.timeline-item .dot {
  position: absolute;
  top: 20px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border-radius: 50%;
  z-index: 1;
}

.timeline-item.left .dot {
  right: -6px;
}

.timeline-item.right .dot {
  left: -6px;
}

</style>
