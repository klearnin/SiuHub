<template>
  <div class="calendar-container">
    <div class="tab-content active">
      <p class="match-info">
        <img v-if="teamLogo" :src="teamLogo" alt="主队队徽" class="team-logo-small" />
        <span class="team">{{ team1 }}</span>
        <span class="match_center">
          <span>{{ matchTime }}</span>
          <span class="score">{{ score.team1.goal }} - {{ score.team2.goal }}</span>
          <span v-if="score.hasPenalty" class="score-penalty">
            点球：{{ score.team1.penalty }} - {{ score.team2.penalty }}
          </span>
        </span>
        <span class="team">{{ team2 }}</span>
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
              <div class="minute">{{ formatMinute(event.minute_note) }}'</div>
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
                <template v-else-if="event.event_type === 'penalty'">
                  <span v-if="event.penalty_result === 'score'">
                    {{ event.penalty_player }} ⚽
                  </span>
                  <span v-else>
                    {{ event.penalty_player }} ❌
                  </span>
                </template>
                <template v-else-if="event.event_type === 'substitution'">
                  <span>
                    {{ event.sub_in_name }} ⬆️<br />
                    {{ event.sub_out_name }} ⬇️
                  </span>
                </template>
              </div>
            </div>
            <div class="dot"></div>
          </div>
        </div>
      </div>

      <div class="either">
        <button class="cancel-button" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
    props: {
        matchId: {
            type: [String, Number],
            required: true
        }
    },

  data() {
    return {
      team1: '',
      team2: '',
      teamLogo: '',
      team2Logo: '',
      matchTime: '',
      score: {
        team1: { goal: 0, penalty: 0 },
        team2: { goal: 0, penalty: 0 },
        hasPenalty: false
      },
      events: [],
      onlyGoals: true
    }
  },
  computed: {
    filteredEvents() {
      return this.events
        .filter(e => !this.onlyGoals || e.event_type === 'goal')
        .sort((a, b) => a.event_minute - b.event_minute)
    }
  },
  methods: {
    async fetchMatchDetail() {
        console.log('matchId 传进来了:', this.matchId); // ✅ 这句保留调试
        try {
            const match_id = this.matchId;
            const [matchRes, eventRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/team/match/${match_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }),
            axios.get(`http://localhost:5000/api/team/match-events`, {
                params: { match_id },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            ]);

            const match = matchRes.data.data;
            const events = eventRes.data.data;

            this.team1 = match.team1;
            this.team2 = match.team2;
            this.matchTime = match.match_time;
            this.events = events;

            this.score = {
            team1: match.score?.[match.team1] || { goal: 0, penalty: 0 },
            team2: match.score?.[match.team2] || { goal: 0, penalty: 0 },
            hasPenalty: match.score?.[match.team1]?.penalty > 0 || match.score?.[match.team2]?.penalty > 0
            };

            this.teamLogo = match.team1_logo ? `http://localhost:5000${match.team1_logo}` : null;
            this.team2Logo = match.team2_logo ? `http://localhost:5000${match.team2_logo}` : null;
        } catch (e) {
            this.$message.error('加载比赛详情失败');
        }
    },
    formatMinute(note) {
      if (!note) return ''
      if (note === '点球大战') return '点球大战'
      const parts = note.split('+')
      return parts.length === 2 && parts[1] === '0' ? parts[0] : note
    },
    goBack() {
      this.$emit('close') // 通知父组件关闭
    }
  },
    mounted() {
    console.log('matchId 传进来了:', this.matchId); // ✅ 打印接收到的 matchId
    this.fetchMatchDetail()
    },
}
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
  display: flex;
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
}

.match_center {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100px;
}

.score {
  font-size: 30px;
  font-weight: bold;
  color: #c51c36;
}

.score-penalty {
  font-size: 12px;
  color: #605d5e;
}

.match-info .team {
  width: 45%;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #1c7ed6;
}

.team-logo-small {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  object-fit: cover;
  transition: all 0.3s ease;
  border: solid 1px #cdd0d2;
  padding: 1px;
}

.timeline-container {}

.filter {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.timeline {
  position: relative;
  margin: 40px 0;
  padding: 0;
  width: 350px;
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

.either {
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
  margin-top: auto;
  border-top: 1px solid #e9ecef;
}

.cancel-button {
  padding: 10px 18px;
  background: linear-gradient(135deg, #adb5bd, #868e96);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 3px 6px rgba(134, 142, 150, 0.3);
}

.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(134, 142, 150, 0.4);
}
</style>
