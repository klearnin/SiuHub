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

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
      <div
        class="day-cell"
        v-for="day in calendarDays"
        :key="day.date"
        @click="openEventPrompt(day.date)"
      >
        <div class="day-number">{{ day.day }}</div>
        <ul class="events">
          <li v-for="(event, index) in events[day.date]" :key="index" @click.stop="editEvent(day.date, index)">
            {{ event }}
            <button @click.stop="deleteEvent(day.date, index)" class="delete-event">X</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup">
        <input v-model="newEvent" placeholder="输入事件内容" />
        <button @click="saveEvent">保存</button>
        <button @click="closePopup">取消</button>
      </div>
    </div>
  </div>

  <div>
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      calendarDays: [],
      events: this.loadEvents(), // 从 localStorage 加载事件
      dayNames: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      showPopup: false,
      currentEventDate: null,
      currentEventIndex: null,
      newEvent: '',
    };
  },
  computed: {
    years() {
      const y = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => y - 5 + i);
    },
  },
  mounted() {
    this.generateCalendar();
  },
  methods: {
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
      this.currentEventDate = date;
      this.showPopup = true;
      this.newEvent = '';
    },
    
    // 保存事件
    saveEvent() {
      if (!this.newEvent) return;

      if (!this.events[this.currentEventDate]) {
        this.events[this.currentEventDate] = [];
      }
      this.events[this.currentEventDate].push(this.newEvent);
      this.saveEvents(); // 保存到 localStorage
      this.closePopup();
    },
    
    // 关闭弹窗
    closePopup() {
      this.showPopup = false;
    },

    // 加载事件（从 localStorage）
    loadEvents() {
      const savedEvents = localStorage.getItem('events');
      return savedEvents ? JSON.parse(savedEvents) : {};
    },

    // 保存事件到 localStorage
    saveEvents() {
      localStorage.setItem('events', JSON.stringify(this.events));
    },

    // 编辑事件
    editEvent(date, index) {
      const newEvent = prompt('编辑事件', this.events[date][index]);
      if (newEvent !== null) {
        this.events[date][index] = newEvent;
        this.saveEvents();
      }
    },

    // 删除事件
    deleteEvent(date, index) {
      if (confirm('确定删除这个事件吗？')) {
        this.events[date].splice(index, 1);
        if (this.events[date].length === 0) {
          delete this.events[date];
        }
        this.saveEvents();
      }
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
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
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
}

.popup button:hover {
  background-color: #2980b9;
}
</style>
