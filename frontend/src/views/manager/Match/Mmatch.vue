<template>
    <div class="match-today-page">
      <h2>今日比赛</h2>
  
      <div v-if="loading" class="loading">正在加载比赛信息...</div>
      <div v-else>
        <div v-if="matches.length === 0" class="no-match">今天没有比赛安排。</div>
        <ul class="match-list">
          <li v-for="match in matches" :key="match.id" class="match-item">
            <div class="match-info-wrapper">
            <!-- 主队 -->
            <div class="team-block team-left">
                <img :src="fullImageUrl(match.homeLogo)" class="team-logo-lg" alt="主队徽" />
                <div class="team-name">{{ match.homeTeam }}</div>
            </div>

            <!-- 中间信息 -->
            <div class="match-center-info">
                <div class="match-time">{{ formatTime(match.time) }}</div>
                <div class="match-score">{{ match.score }}</div>
                <div class="match-venue">{{ match.venue }}</div>
            </div>

            <!-- 客队 -->
            <div class="team-block team-right">
                <img :src="fullImageUrl(match.awayLogo)" class="team-logo-lg" alt="客队徽" />
                <div class="team-name">{{ match.awayTeam }}</div>
            </div>
            </div>
  
            <!-- 事件录入表单 -->
            <div class="event-form">
              <h3>录入比赛事件</h3>
              <form @submit.prevent="submitEvent(match.id)">
                <label>
                  事件类型：
                  <select v-model="eventForm.type">
                    <option value="goal">进球</option>
                    <option value="card">红黄牌</option>
                    <option value="substitution">换人</option>
                  </select>
                </label>
  
                <label>
                  比赛阶段：
                  <select v-model="eventForm.period">
                    <option value="1H">上半场</option>
                    <option value="2H">下半场</option>
                    <option value="ET1">加时上半场</option>
                    <option value="ET2">加时下半场</option>
                  </select>
                </label>
  
                <label>
                    时间（分钟）：
                    <input
                        type="number"
                        v-model.number="eventForm.main_minute"
                        :min="minuteRange.min"
                        :max="minuteRange.max"
                        @change="handleMinuteChange"
                    />
                </label>

                <label>
                    补时：
                    <input
                        type="number"
                        v-model.number="eventForm.extra_minute"
                        :disabled="!allowExtraTime"
                        min="0"
                        max="15"
                        @change="handleExtraTimeChange"
                    />
                </label>

                <label>
                  所属球队：
                  <select v-model="eventForm.team_side">
                    <option value="home">本方</option>
                    <option value="away">对方</option>
                  </select>
                </label>
  
                <!-- 进球 -->
                <template v-if="eventForm.type === 'goal'">
                  <label v-if="eventForm.team_side === 'home'">
                    进球队员：
                    <select v-model="eventForm.scorer_id">
                      <option v-for="player in players" :key="player.id" :value="player.id">{{ player.name }}</option>
                    </select>
                  </label>
                  <label v-else>
                    进球球员名称：
                    <input type="text" v-model="eventForm.scorer_name" />
                  </label>

                  <label v-if="eventForm.team_side === 'home'">
                    助攻队员：
                    <select v-model="eventForm.assist_id">
                      <option :value="null">无</option> <!-- 添加“无”选项 -->
                      <option v-for="player in players" :key="player.id" :value="player.id">{{ player.name }}</option>
                    </select>
                  </label>
                  <label v-else>
                    助攻球员名称：
                    <input type="text" v-model="eventForm.assist_name" placeholder="可不填，表示无助攻" />
                  </label>
                </template>
  
                <!-- 红黄牌 -->
                <template v-if="eventForm.type === 'card'">
                  <label v-if="eventForm.team_side === 'home'">
                    球员：
                    <select v-model="eventForm.scorer_id">
                      <option v-for="player in players" :key="player.id" :value="player.id">{{ player.name }}</option>
                    </select>
                  </label>
                  <label v-else>
                    球员名称：
                    <input type="text" v-model="eventForm.scorer_name" />
                  </label>
                  <label>
                    红黄牌类型：
                    <select v-model="eventForm.card_type">
                      <option value="yellow">黄牌</option>
                      <option value="red">红牌</option>
                    </select>
                  </label>
                </template>
  
                <!-- 换人 -->
                <template v-if="eventForm.type === 'substitution'">
                  <label v-if="eventForm.team_side === 'home'">
                    换上球员：
                    <select v-model="eventForm.sub_in_id">
                      <option v-for="player in players" :key="player.id" :value="player.id">{{ player.name }}</option>
                    </select>
                  </label>
                  <label v-else>
                    换上球员：
                    <input type="text" v-model="eventForm.sub_in_name" />
                  </label>
  
                  <label v-if="eventForm.team_side === 'home'">
                    换下球员：
                    <select v-model="eventForm.sub_out_id">
                      <option v-for="player in players" :key="player.id" :value="player.id">{{ player.name }}</option>
                    </select>
                  </label>
                  <label v-else>
                    换下球员：
                    <input type="text" v-model="eventForm.sub_out_name" />
                  </label>
                </template>
  
                <button type="submit">提交</button>
              </form>
            </div>
  
            <!-- 事件列表 -->
            <div class="event-list" v-if="match.events.length">
            <h3>比赛事件</h3>
            <div class="event-timeline-rows">
                <div
                class="event-row"
                v-for="(row, index) in getUnifiedTimelineRows(match.events, match)"
                :key="index"
                >
                <div class="event-side left">
                    <template v-if="row.isHome">
                    <div class="event-content">
                        <template v-if="row.event.event_type === 'goal'">
                        ⚽ {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.scorer_name }} 
                        <template v-if="row.event.assist_name">（助攻：{{ row.event.assist_name }}）</template>
                        <template v-if="row.event.is_penalty">（点球）</template>
                        </template>
                        <template v-else-if="row.event.event_type === 'card'">
                        <span v-if="row.event.card_type === 'red'">🟥</span>
                        <span v-else>🟨</span>
                        {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.scorer_name }}
                        </template>
                        <template v-else-if="row.event.event_type === 'substitution'">
                        🔄 {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.sub_out_name }} ⬅️ {{ row.event.sub_in_name }}
                        </template>
                    </div>
                    </template>
                </div>

                <div class="event-time">{{ formatMinuteNote(row.time) }}</div>

                <div class="event-side right">
                    <template v-if="row.isAway">
                    <div class="event-content">
                        <template v-if="row.event.event_type === 'goal'">
                        ⚽ {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.scorer_name }} 
                        <template v-if="row.event.assist_name">（助攻：{{ row.event.assist_name }}）</template>
                        <template v-if="row.event.is_penalty">（点球）</template>
                        </template>
                        <template v-else-if="row.event.event_type === 'card'">
                        <span v-if="row.event.card_type === 'red'">🟥</span>
                        <span v-else>🟨</span>
                        {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.scorer_name }}
                        </template>
                        <template v-else-if="row.event.event_type === 'substitution'">
                        🔄 {{ formatMinuteNote(row.event.minute_note) }} - {{ row.event.sub_out_name }} ⬅️ {{ row.event.sub_in_name }}
                        </template>
                    </div>
                    </template>
                </div>
                </div>
            </div>
            </div>
          </li>
        </ul>
      </div>
  
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import axios from "axios";
  import { computed } from 'vue';
  
  const matches = ref([]);
  const loading = ref(false);
  const error = ref("");
  const players = ref([]);
  
  const eventForm = ref({
    type: "goal",
    period: "1H",
    main_minute: 1,
    extra_minute: 0,
    event_minute: 1, // 自动计算: main + extra
    minute_note: "1+0",
    team_side: "home",
    scorer_id: null,
    scorer_name: "",
    card_type: "yellow",
    assist_id: null,
    assist_name: "",
    sub_in_name: "",
    sub_in_id: "",
    sub_out_name: "",
    sub_out_id: "",
  });
  
  const token = localStorage.getItem("token");
  
  onMounted(async () => {
    updateFinalMinute(); // 保证初始值一致
    loading.value = true;
    try {
      const res = await axios.get("http://localhost:5000/api/match/today-matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      matches.value = res.data.data.map((match) => ({
        id: match.id,
        time: match.match_time,
        homeTeam: match.team1_name || "未知主队",
        awayTeam: match.team2_name || "未知客队",
        homeLogo: match.team1_logo || "",
        awayLogo: match.team2_logo || "",
        venue: match.location || "未知场地",
        score: "0 - 0",
        events: [],
      }));
  
      const playersRes = await axios.get("http://localhost:5000/api/match/players/by-manager", {
        headers: { Authorization: `Bearer ${token}` },
      });
      players.value = playersRes.data.data;
  
      for (const match of matches.value) {
        const eventsRes = await axios.get("http://localhost:5000/api/match/events", {
          params: { match_id: match.id },
        });
        match.events = eventsRes.data.data || [];
  
        const scoreRes = await axios.get("http://localhost:5000/api/match/final-score", {
          params: { match_id: match.id },
        });
        const scoreData = scoreRes.data.data.score || {};
        const homeScore = scoreData[match.homeTeam]?.goal || 0;
        const awayScore = scoreData[match.awayTeam]?.goal || 0;
        match.score = `${homeScore} - ${awayScore}`;
      }
    } catch (err) {
      error.value = "加载比赛信息失败，请稍后重试";
      console.error(err);
    } finally {
      loading.value = false;
    }
  });
  
  const submitEvent = async (matchId) => {
    try {
      const form = eventForm.value;
      const match = matches.value.find((m) => m.id === matchId);
      const teamName = form.team_side === "home" ? match.homeTeam : match.awayTeam;
  
      let payload = {
        match_id: matchId,
        period: form.period,
        event_minute: form.event_minute,
        minute_note: form.minute_note,
        team_name: teamName,
        scorer_id: null,
        scorer_name: "",
        assist_id: null,
        assist_name: "",
        sub_in_id: null,
        sub_out_id: null,
        sub_in_name: "",
        sub_out_name: "",
      };
  
      if (form.type === "goal") {
        if (form.team_side === "home" && !form.scorer_id) return alert("请选择进球队员");
        if (form.team_side === "away" && !form.scorer_name.trim()) return alert("请输入球员名称");
  
        payload.scorer_id = form.team_side === "home" ? form.scorer_id : null;
        payload.scorer_name =
          form.team_side === "home"
            ? players.value.find((p) => p.id === form.scorer_id)?.name
            : form.scorer_name.trim();

        payload.assist_id = form.team_side === "home" ? form.assist_id : null;
        payload.assist_name =
          form.team_side === "home"
            ? players.value.find((p) => p.id === form.assist_id)?.name
            : form.assist_name.trim();

        await axios.post("http://localhost:5000/api/match/event/goal", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (form.type === "card") {
        payload.card_type = form.card_type;
        payload.player_id = form.team_side === "home" ? form.scorer_id : null;
        payload.player_name =
          form.team_side === "home"
            ? players.value.find((p) => p.id === form.scorer_id)?.name
            : form.scorer_name.trim();
  
        await axios.post("http://localhost:5000/api/match/event/card", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (form.type === "substitution") {
        payload.sub_in_name = form.sub_in_name.trim();
        payload.sub_out_name = form.sub_out_name.trim();
        payload.sub_in_id = form.team_side === "home" ? form.sub_in_id : null;
        payload.sub_out_id = form.team_side === "home" ? form.sub_out_id : null;
        payload.sub_in_name =
          form.team_side === "home"
            ? players.value.find((p) => p.id === form.sub_in_id)?.name
            : form.sub_in_name.trim();
        payload.sub_out_name =
          form.team_side === "home"
            ? players.value.find((p) => p.id === form.sub_out_id)?.name
            : form.sub_out_name.trim();
  
        await axios.post("http://localhost:5000/api/match/event/substitution", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
  
      alert("事件录入成功！");
      const eventsRes = await axios.get("http://localhost:5000/api/match/events", {
        params: { match_id: matchId },
      });
      match.events = eventsRes.data.data || [];
  
      const scoreRes = await axios.get("http://localhost:5000/api/match/final-score", {
        params: { match_id: matchId },
      });
      const scoreData = scoreRes.data.data.score || {};
      match.score = `${scoreData[match.homeTeam]?.goal || 0} - ${scoreData[match.awayTeam]?.goal || 0}`;
  
      // 重置表单
      eventForm.value = {
        type: "goal",
        period: "1H",
        event_minute: 0,
        minute_note: "1+0",
        team_side: "home",
        scorer_id: null,
        scorer_name: "",
        assist_id: null,
        assist_name: "",
        card_type: "yellow",
        sub_in_id: null,
        sub_out_id: null,
        sub_in_name: "",
        sub_out_name: "",
      };
    } catch (err) {
      alert("事件录入失败，请稍后重试");
      console.error(err);
    }
  };
  
  const formatTime = (timeStr) => {
    if (typeof timeStr === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const [hour, minute] = timeStr.split(":");
      return `${hour}:${minute}`;
    }
    return "无效时间";
  };
  
  const fullImageUrl = (path) => {
    if (!path) return "";
    const cleanPath = path.replace(/^\/+/, "");
    return path.startsWith("http") ? path : `http://localhost:5000/${cleanPath}`;
  };

  const minuteRange = computed(() => {
  switch (eventForm.value.period) {
    case "1H": return { min: 1, max: 45 };
    case "2H": return { min: 46, max: 90 };
    case "ET1": return { min: 91, max: 105 };
    case "ET2": return { min: 106, max: 120 };
    default: return { min: 1, max: 120 };
  }
});

const allowExtraTime = computed(() => {
  const m = eventForm.value.main_minute;
  return [45, 90, 105, 120].includes(m);
});

const handleMinuteChange = () => {
  const { min, max } = minuteRange.value;
  if (eventForm.value.main_minute < min) eventForm.value.main_minute = min;
  if (eventForm.value.main_minute > max) eventForm.value.main_minute = max;

  // 如果不是可补时时间，自动清零补时
  if (!allowExtraTime.value) {
    eventForm.value.extra_minute = 0;
  }

  updateFinalMinute();
};

const handleExtraTimeChange = () => {
  if (!allowExtraTime.value) {
    eventForm.value.extra_minute = 0;
  } else if (eventForm.value.extra_minute > 15) {
    eventForm.value.extra_minute = 15;
  }

  updateFinalMinute();
};

const updateFinalMinute = () => {
  const main = eventForm.value.main_minute;
  const extra = eventForm.value.extra_minute;
  eventForm.value.event_minute = main + extra;
  eventForm.value.minute_note = `${main}+${extra}`;
};

const parseMinuteNote = (note) => {
  const [mainStr, extraStr] = note.split('+');
  return {
    main: parseInt(mainStr || '0', 10),
    extra: parseInt(extraStr || '0', 10),
  };
};

const sortedEvents = (events, side, match) => {
  const teamName = side === 'home' ? match.homeTeam : match.awayTeam;

  return [...events]
    .filter(e => e.team_name === teamName)
    .sort((a, b) => {
      const aNote = parseMinuteNote(a.minute_note);
      const bNote = parseMinuteNote(b.minute_note);
      if (aNote.main !== bNote.main) {
        return aNote.main - bNote.main;
      }
      return aNote.extra - bNote.extra;
    });
};

function formatMinuteNote(note) {
  if (!note) return '';
  const parts = note.split('+');
  if (parts.length === 2 && parts[1] === '0') {
    return parts[0];  // 只显示加号前面的数字
  }
  return note;
}

const getUnifiedTimelineRows = (events, match) => {
  const all = [...events].sort((a, b) => {
    const pa = parseMinuteNote(a.minute_note);
    const pb = parseMinuteNote(b.minute_note);
    if (pa.main !== pb.main) return pa.main - pb.main;
    return pa.extra - pb.extra;
  });

  return all.map(e => ({
    time: e.minute_note,
    isHome: e.team_name === match.homeTeam,
    isAway: e.team_name === match.awayTeam,
    event: e,
  }));
};

  </script>
  
  <style scoped>
  .match-today-page {
    max-width: 700px;
    margin: 30px auto;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #0154a0;
  }
  
  .loading,
  .no-match,
  .error {
    text-align: center;
    margin-top: 30px;
    font-size: 18px;
    color: #666;
  }
  
  .error {
    color: #d9534f;
  }
  
  .match-list {
    list-style: none;
    padding: 0;
  }
  
  .match-item {
    padding: 15px 20px;
    margin-bottom: 15px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  }
  
  .match-item div {
    margin-bottom: 8px;
    font-size: 16px;
  }
  
  .team-logo {
    width: 24px;
    height: 24px;
    object-fit: contain;
    vertical-align: middle;
    margin: 0 5px;
  }
  
  .event-form {
    margin-top: 20px;
  }
  
  .event-form label {
    display: block;
    margin-bottom: 10px;
  }
  
  .event-form input,
  .event-form select {
    padding: 4px 8px;
    margin-left: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button[type="submit"] {
    margin-top: 10px;
    background-color: #0154a0;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button[type="submit"]:hover {
    background-color: #023e73;
  }
  
  .event-list {
    margin-top: 15px;
  }
  
  .event-list ul {
    padding-left: 15px;
  }
  
  .event-list li {
    margin-bottom: 6px;
  }

  .event-timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-top: 20px;
  padding: 0 10px;
}

.event-column {
  width: 45%;
}

.event-column.left {
  text-align: right;
}

.event-column.right {
  text-align: left;
}

.timeline-center {
  width: 10%;
  text-align: center;
  position: relative;
}

.timeline-center::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #999;
  transform: translateX(-50%);
}

.time-label {
  margin: 10px 0;
  font-size: 12px;
  color: #666;
}

.event-item {
  margin-bottom: 10px;
}

.event-content {
  display: inline-block;
  max-width: 90%;
  background-color: #eef2f7;
  padding: 6px 10px;
  border-radius: 5px;
}

.event-timeline-rows {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}

.event-row {
  display: flex;
  align-items: center;
  margin: 10px 0;
  min-height: 40px;
}

.event-side {
  width: 45%;
}

.event-side.left {
  text-align: right;
  padding-right: 10px;
}

.event-side.right {
  text-align: left;
  padding-left: 10px;
}

.event-time {
  width: 10%;
  text-align: center;
  font-weight: bold;
  color: #555;
  position: relative;
}

.event-time::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #aaa;
  transform: translateX(-50%);
}

.match-info-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding: 20px 10px;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.team-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30%;
}

.team-logo-lg {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 8px;
}

.team-name {
  font-size: 16px;
  font-weight: 600;
}

.match-center-info {
  width: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.match-time {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.match-score {
  font-size: 42px !important;        /* 原来是 20px，扩大字号 */
  font-weight: 700;       /* 更粗一点，强调比分 */
  margin: 6px 0;
}

.match-venue {
  font-size: 14px;
  color: #666;
}

  </style>
  