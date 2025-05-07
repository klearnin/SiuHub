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
      </div>
           <div class="header">
          <button @click="back">返回</button>
    </div>
  
      <!-- 日历网格 -->
      <div class="calendar-grid">
        <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
        <div class="day-cell" v-for="day in calendarDays" :key="day.date" @click="openEventPrompt(day.date)">
  <div class="day-number">{{ day.day }}</div>
  <ul class="events">
    <li v-for="(schedule, index) in schedules.filter(s => s.date === day.date)" :key="index">
      <div class="schedule match" v-if="schedule.type === 'match'">比赛  ⚽</div>
      <div class="schedule training" v-else-if="schedule.type === 'training'">训练🎯</div>
      <div class="schedule else" v-else-if="schedule.type === 'else'">其他📅</div>
    </li>
  </ul>
</div>

      </div>
  
      <!-- 查看弹窗 -->
      <div v-if="showPopup" class="popup-overlay">
        <div class="popup">
          <h3>{{ selectedDate }} 的日程</h3>
          <div v-for="item in selectedSchedules" :key="item.id" class="popup-schedule-block">
            <p v-if="item.type === 'match'">
              【比赛】<br />对手：{{ item.team2 }}<br />时间：{{ item.match_time }}<br />地点：{{ item.location }}
            </p>
            <p v-else-if="item.type === 'training'">
              【训练】<br />时间：{{ item.training_time }}<br />队伍训练：{{ item.team_training }}<br />个人训练：{{ item.personal_training }}
            </p>
            <p v-else>
              【其他】<br />时间：{{ item.else_time }}<br />事件：{{ item.content }}
            </p>
          </div>
          <button class="popup-button" @click="closePopup">关闭</button>

        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        selectedYear: new Date().getFullYear(),
        selectedMonth: new Date().getMonth() + 1,
        calendarDays: [],
        dayNames: ['日', '一', '二', '三', '四', '五', '六'],
        months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        schedules: [],
        showPopup: false,
        selectedDate: '',
        selectedSchedules: []
      };
    },
    computed: {
      years() {
        const y = new Date().getFullYear();
        return Array.from({ length: 30 }, (_, i) => y - 5 + i);
      }
    },
    mounted() {
      this.generateCalendar();
    },
    methods: {
        back() {
  this.$router.push('/phome'); // 替换为你的球员主页路由
},

      async fetchSchedules() {
        const month = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
        try {
          const res = await axios.get('http://localhost:5000/api/schedule/list', {
            params: { month },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          this.schedules = res.data;
        } catch (error) {
          console.error('获取日程失败:', error);
        }
      },
      async generateCalendar() {
        const year = this.selectedYear;
        const month = this.selectedMonth - 1;
        const firstDay = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0).getDate();
        const startWeekDay = firstDay.getDay();
  
        const days = [];
        for (let i = 0; i < startWeekDay; i++) {
          days.push({ day: '', date: '' });
        }
        for (let i = 1; i <= lastDate; i++) {
          const dateStr = `${year}-${String(this.selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          days.push({ day: i, date: dateStr });
        }
        this.calendarDays = days;
        await this.fetchSchedules();
      },
      openEventPrompt(date) {
        this.selectedDate = date;
        this.selectedSchedules = this.schedules.filter(s => s.date === date);
        this.showPopup = true;
      },
      closePopup(){ 
        this.showPopup = false;
      }
    }
  };
  </script>
  
  <style scoped>
  .calendar-container {
    max-width: 800px;
    margin: auto;
    padding: 20px;
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
  
  .schedule {
    font-size: 12px;
    margin-top: 4px;
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
    color: white;
  }
  .match { background-color: #1e90ff; }
  .training { background-color: #28a745; }
  .else { background-color: #ffc107; color: black; }
  
  .popup-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .popup {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .popup-schedule-block {
    margin-bottom: 15px;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 6px;
    font-size: 14px;
  }
  .events {
  list-style: none;
  padding: 0;
  margin: 0;
}
.popup-button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 45px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
}

.popup-button:hover {
  background-color: #2980b9;
}


  </style>