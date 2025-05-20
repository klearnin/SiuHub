<template>
    <div class="match-today-page">
      <h2>今日比赛</h2>
  
      <div v-if="loading" class="loading">正在加载比赛信息...</div>
      <div v-else>
        <div v-if="matches.length === 0" class="no-match">今天没有比赛安排。</div>
        <ul class="match-list">
          <li v-for="match in matches" :key="match.id" class="match-item">
            <div><strong>时间：</strong>{{ formatTime(match.time) }}</div>
            <div>
              <strong>对阵：</strong>
              <img :src="fullImageUrl(match.homeLogo)" class="team-logo" alt="主队徽" />
              {{ match.homeTeam }} VS {{ match.awayTeam }}
              <img :src="fullImageUrl(match.awayLogo)" class="team-logo" alt="客队徽" />
            </div>
            <div><strong>场地：</strong>{{ match.venue }}</div>
            <div><strong>比分：</strong>{{ match.score }}</div>
  
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
              <ul>
                <li v-for="event in match.events" :key="event.id">
                  {{ event.period }} - 第{{ event.event_minute }}分钟 - {{ event.team_name }} - {{ event.scorer_name }} {{ event.card_type || "" }}
                </li>
              </ul>
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
  </style>
  