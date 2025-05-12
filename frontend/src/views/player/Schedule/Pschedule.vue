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
          <div class="tab-content" :class="{ active: activeTab === 'match', 'slide-left': (activeTab === 'match' || prevTab === 'match') && transitionDirection === 'left', 'slide-right': (activeTab === 'match' || prevTab === 'match') && transitionDirection === 'right' }">
            <p class="match-info">
              <span class="team">{{ teamname || '未设定' }}</span>
              <span class="vs">{{ matchTime || '时间未设定' }} / {{ matchLocation || '地点未设定' }}</span>
              <span class="team">{{ team2 || '对手未设定' }}</span>
            </p>
          </div>

          <!-- 训练内容 -->
          <div class="tab-content" :class="{ active: activeTab === 'training', 'slide-left': (activeTab === 'training' || prevTab === 'training') && transitionDirection === 'left', 'slide-right': (activeTab === 'training' || prevTab === 'training') && transitionDirection === 'right' }">
            <p class="match-info">
              时间：{{ trainingTime || '未设定' }}<br />
              <br />
              训练内容：{{ teamTraining || '未设定' }}<br />
              
            </p>
            
          </div>
          <!-- 其他内容 -->
          <div class="tab-content" :class="{ active: activeTab === 'else', 'slide-left': (activeTab === 'else' || prevTab === 'else') && transitionDirection === 'left', 'slide-right': (activeTab === 'else' || prevTab === 'else') && transitionDirection === 'right' }">
            <p class="match-info">
              时间：{{ elseTime || '未设定' }}<br />
              <br />
              事件：{{ elseEvent|| '未设定' }}<br />
            </p>
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
      prevTab: null,
      transitionDirection: 'left',
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
      teamlist:[],
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
      this.x=month;
        try {
          const res = await axios.get("http://localhost:5000/api/schedule/list", { params: { month } ,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
          this.schedules = res.data;
        } catch (error) {
          console.error('获取日程失败:', error);
          this.$message.error('获取日程失败');
        }
        try {
          const res = await axios.get("http://localhost:5000/api/schedule/team", { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
          this.teamname = res.data.teamname[0].name;
          this.teamlist = res.data.teamlist;
        } catch (error) {
          console.error('获取球队名称失败:', error);
          this.$message.error('获取球队名称失败');
        }
      },

      updateOpponent(teamName) {
        this.team2 = teamName;  // 设定选中的对手
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

        for (const schedule of this.schedules || []) {
        if (schedule.date === this.selectedDate) {
          if (schedule.type === 'match') {
            this.matchId = schedule.id;
            this.matchTime = schedule.match_time;
            this.matchLocation = schedule.location;
            this.team2 = schedule.team2;
            this.team1 = this.teamname;
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
          this.selectedID = schedule.id; this.showPopup = true;
        }
     }
   
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
    const tabs = ['match', 'training','else'];
    const currentIndex = tabs.indexOf(this.activeTab);
    const targetIndex = tabs.indexOf(tab);
    this.transitionDirection = targetIndex > currentIndex ? 'left' : 'right';
    this.prevTab = this.activeTab;
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
  background-color: #eaecee;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}
.either{
  display:flex;
  justify-content:right;
  padding-top: 2%;
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
/* 强制覆盖特殊按钮 */
.popup .del_button {
  background-color: #cc4343 !important;
}
.popup .cancel-button {
  background-color: #999 !important;
}

/* 通用悬停效果 */
.popup button:hover {
  background-color: #2980b9;
}

.popup .cancel-button:hover {
  background-color: #666 !important;
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


/* 美化样式 */


.tab-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #fff, #f8f9fa);
  color: #2d3748 !important; /* 深灰色确保可见性 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  font-size: 14px !important; 
  font-weight: 600;
  
  /* 伪元素实现高级悬停效果 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.2);
    opacity: 0;
    transition: opacity 0.3s;
  }
}

/* 动态颜色方案 */
.tab-button:nth-child(1) {
  --active-color: #3b82f6; /* 蓝色系 */
}
.tab-button:nth-child(2) {
  --active-color: #10b981; /* 绿色系 */
}
.tab-button:nth-child(3) {
  --active-color: #f59e0b; /* 橙色系 */
}

/* 激活状态 */
.tab-button.active {
  background: linear-gradient(145deg, var(--active-color), color-mix(in srgb, var(--active-color) 90%, black));
  color: rgb(15, 14, 14);
  box-shadow: 
    0 4px 12px color-mix(in srgb, var(--active-color) 20%, transparent),
    0 2px 0 color-mix(in srgb, var(--active-color) 30%, transparent) inset;
  
  &::before { /* 底部装饰线 */
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 3px;
    background: rgba(255,255,255,0.8);
    border-radius: 2px;
  }
}

/* 悬停交互 */
.tab-button:hover:not(.active) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  &::after {
    opacity: 1;
  }
}

/* 微交互动画 */
.tab-button:active {
  transform: scale(0.98);
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
  height: 100%;
  width: 100%;
  top: 0;
  padding: 15px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
  

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
  border:solid #a9c7ef;

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
