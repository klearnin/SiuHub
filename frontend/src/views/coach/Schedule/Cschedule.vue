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
      
      <div
        class="day-cell"
        v-for="day in calendarDays"
        :key="day.date"
        @click="openEventPrompt(day.date)"
      >
        <div class="day-number" 
       
        >{{ day.day }}</div>
        <ul class="events" v-for="(schedule, index) in schedules" :key="index">
          <li v-if="schedule.date === day.date"><div class="schedule" v-if="schedule.type==='match'">⚽比赛</div></li>
          <li v-if="schedule.date === day.date"><div class="schedule" v-if="schedule.type==='training'">🎯训练</div></li>
        </ul>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="showPopup" class="popup-overlay">
    <div class="popup">
      <!-- 选项卡按钮 -->
      <div class="tab-buttons">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'match' }"
          @click="switchTab('match')"
        >
          比赛
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'training' }"
          @click="switchTab('training')"
        >
          训练
        </button>
        
      </div>

      <!-- 选项卡内容 -->
      <div class="tab-content-wrapper">
        <!-- 比赛内容 -->
        <div 
          class="tab-content" 
          :class="{ 
            active: activeTab === 'match',
            'slide-left': (activeTab === 'match' || prevTab === 'match') && transitionDirection === 'left',
            'slide-right': (activeTab === 'match' || prevTab === 'match') && transitionDirection === 'right'
          }"
          
        >
          <p class="match-info">
            <span class="team">{{ team1 || '未设定' }}</span>
            <span class="vs">
              {{ matchTime || '时间未设定' }} / {{ matchLocation || '地点未设定' }}
            </span>
            <span class="team">{{ team2 || '对手未设定' }}</span>
          </p>
           <button @click="edit('对手', 'team2')">设定对手</button>
           <button @click="edit('比赛时间', 'matchTime')">设置时间</button>
           <button @click="edit('比赛地点', 'matchLocation')">设置地点</button>

          <MatchEditor 
       :visible="showEditor" 
       :title="editorTitle" 
       @confirm="updateValue"
       @cancel="showEditor = false"
    />
        </div>

        <!-- 训练内容 -->
        <div 
          class="tab-content" 
          :class="{ 
             active: activeTab === 'training',
             'slide-left': (activeTab === 'training' || prevTab === 'training') && transitionDirection === 'left',
             'slide-right': (activeTab === 'training' || prevTab === 'training') && transitionDirection === 'right'
          }"
        >
          <h3>训练计划</h3>
          <p>这里是训练相关的内容...</p>
          <button @click="gotoedit_training">编辑训练</button>
        </div>
       
      </div>
      
      <!-- 底部按钮 -->
     
        <div class="either">
          <button @click="closePopup">取消</button>

          <!-- 先检查是否有对应日期的日程 -->
          <div v-if="hasScheduleForSelectedDate">
            <button @click="saveMatchInfo">修改</button>
          </div>
          <div v-else>
            <button @click="changeMatchInfo">保存</button>
          </div>
        </div>

      
    </div>
  </div>
    
  </div>

</template>

<script>

import axios from 'axios';
import MatchEditor from './MatchEditor.vue';
import { ElMessage, ElMessageBox } from 'element-plus';


export default {

  components: {
    MatchEditor,
  },
  
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      calendarDays: [],
      dayNames: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      showPopup: false,
      selectedDate: null,
      
      //窗口滑动的相关数据
      activeTab: 'match',
      prevTab: null,
      transitionDirection: 'left',
       // 比赛设置相关数据
      team1: '我的球队',
      team2: '',
      matchTime: '',
      matchLocation: '',
      showEditor: false,
      editorTitle: '',
      editKey: '',
       
      hour: '00',
      minute: '00',
      showTimeEditor: false,
      matches: [], // 事件表
      trainings: [], // 训练表
      schedules: [], // 日程表
      x: 0, // 水平偏移
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
  methods: {
    async fetchSchedules() {
      const month = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}`;
      this.x=month;
        try {
          const res = await axios.get("http://localhost:5000/api/schedule/list", { params: { month } });
          this.schedules = res.data;
        } catch (error) {
          console.error('获取日程失败:', error);
          this.$message.error('获取日程失败');
        }
      },

    back() {
      this.$router.push('/chome');
    },

   

    // 生成日历
    generateCalendar() {
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
    },
    
    // 打开事件输入框
     openEventPrompt(date) {
      if (!date) return;
      this.selectedDate = date;
      
      for (const schedule of this.schedules || []) {
        if (schedule.date === this.selectedDate) {
          this.matchTime = schedule.match_time;
          this.matchLocation =schedule.location;
          this.team2 = schedule.team2; 
        } 
      }
      this.showPopup = true;
    },

    switchTab(tab) {
    if (tab === this.activeTab) return;

    const tabs = ['match', 'training'];
    const currentIndex = tabs.indexOf(this.activeTab);
    const targetIndex = tabs.indexOf(tab);
    this.transitionDirection = targetIndex > currentIndex ? 'left' : 'right';
    
    this.prevTab = this.activeTab;
    this.activeTab = tab;
    
    
  },
    edit(title, key) {
      this.editorTitle = `请输入${title}`;
      this.editKey = key;
      this.showEditor = true;
    },
    updateValue(value) {
      this[this.editKey] = value;
      this.showEditor = false;
    },

     // 关闭弹窗
     closePopup() {
      this.matchLocation ='';
      this.team2 = '';
      this.matchTime='';
      this.showPopup = false;
    },

    async saveMatchInfo() {  // 👇发送给后端
    const payload = {
      date: this.selectedDate,
      match_time: this.matchTime,
      location: this.matchLocation,
      team2: this.team2,
      type:'match',
      team1:'', 
      events: [],

    };
    console.log('发送给后端的内容：', payload);
     // 开启时使用
     try {
          const response = await  axios.post('http://localhost:5000/api/schedule/match', payload);
          if (response.data.code === 0){
          alert(`${this.type} 保存成功！`);
          } 
        } catch (error) {
          console.error('保存失败:', error);
          this.$message.error('保存失败');
        }
      await this.fetchSchedules(); 
      this.matchLocation ='';
      this.team2 = '';
      this.matchTime='';
      this.showPopup = false;
  },
  changeMatchInfo() {  // 👇发送给后端
    const payload = {
      date: this.selectedDate,
      match_time: this.matchTime,
      location: this.matchLocation,
      team2: this.team2,
      type:'match',
      team1:'',
      events: [],
    };
    console.log('发送给后端的内容：', payload);},

    // 加载事件（从 localStorage）
    loadEvents() {
      const savedEvents = localStorage.getItem('events');
      return savedEvents ? JSON.parse(savedEvents) : {};
    },
  },
};
</script>

<style scoped>
.calendar-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  font-family: sans-serif;
}

.header {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-name {
  font-weight: bold;
  text-align: center;
}

.day-cell {
  border: 1px solid #ccc;
  border-radius: 6px;
  min-height: 100px;
  padding: 5px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.day-cell:hover {
  background-color: #eef6ff;
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
}

.events {
  font-size: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.delete-event {
  background-color: red;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 2px 6px;
  cursor: pointer;
}

.delete-event:hover {
  background-color: darkred;
}

/* 弹窗样式 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup {
  width: 70%;    /* 视口宽度的80% */
  height: 80%;   /* 视口高度的60% */
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}
.either{
  display:flex;
  justify-content:right;
}

.popup input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.popup button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 45px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
  
}

.popup button:hover {
  background-color: #2980b9;
}

.header button {
  width: 50px;
  height: 30px;
  font-size: 18px;
  background-color: #ccc;
  color: #333;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.header button:hover:not(:disabled) {
  background-color: #4ddbee;
}

.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.tab-button:hover {
  background: #e0e0e0;
}

.tab-button.active {
  background: #0e4aa3;
  color: white;
}

/* 选项卡内容容器 */
.tab-content-wrapper {
  position: relative;
  height: 82%;
  overflow: hidden;
  display:flex;
}

/* 选项卡内容通用样式 */
.tab-content {
  position: absolute;
  height: 95%;
  width: 100%;
  top: 0;
  padding: 15px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
  border: solid 2px #62b9d1;

  /* 新增的部分 */
  display: flex;
  flex-direction: column;
  justify-content: center;   /* 垂直居中 */
  align-items: center;       /* 水平居中 */
  gap: 10px;                 /* 元素之间留点间距，可选 */
}

.tab-content button {
  width: 200px;
  height: 100px;
}


/* 激活的选项卡 */
.tab-content.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

/* 向左滑动 */
.tab-content.slide-left {
  transform: translateX(-100%);
}

/* 向右滑动 */
.tab-content.slide-right {
  transform: translateX(100%);
}

/* 当前激活的选项卡滑动效果 */
.tab-content.active.slide-left {
  transform: translateX(0);
}

.tab-content.active.slide-right {
  transform: translateX(0);
}



/*比赛信息样式*/
.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100px;
  margin-bottom: 20px;
  font-weight: bold;
  border:solid #0e4aa3;

}

.match-info .team {
  width: 45%;
  text-align: center;
}

.match-info .vs {
  width: 50%;
  text-align: center;
}

.schedule {
  font-size: 14px;       /* 稍微小一点，显得精致 */
  font-weight: bold;     /* 字体加粗，有力量感 */
  color: #1e90ff;        /* 亮一点的蓝色，活泼又有比赛氛围 */
  /*background-color: #e6f2ff; /* 淡淡的蓝底，不突兀 */
  padding: 4px 8px;      /* 有一点内边距，显得圆润 */
  border-radius: 8px;    /* 圆角，让小块更柔和 */
  display: inline-block; /* 让它像一个小标签 */
  margin-top: 4px;       /* 和日期数字拉开一点距离 */
}
  


</style>
