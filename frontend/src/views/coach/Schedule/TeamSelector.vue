<template>
  <div class="editor-overlay" v-if="visible">
    <div class="editor-box">
      <h3>{{ title || '选择或输入对手' }}</h3>
      <el-autocomplete
        v-model="selectedTeam"
        :fetch-suggestions="querySearch"
        placeholder="请选择或输入对手"
        trigger-on-focus
        popper-class="custom-autocomplete"
        @select="handleSelect"
      >
        <template #default="{ item }">
          <div class="custom-item">
            <img class="team-logo" :src="item.avatar" alt="logo" />
            <span>{{ item.value }}</span>
          </div>
        </template>
      </el-autocomplete>
      <div class="btn-row">
        <button @click="confirm">确定</button>
        <button @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {

    myteamname: String,
    visible: Boolean,
    title: String,
    
    teamlist: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedTeam: ''
    };
  },
  methods: {
    querySearch(queryString, cb) {
    const myTeamName = this.myteamname.toLowerCase();
    
    const filtered = this.teamlist.filter(team => {
      if (team.name.toLowerCase() === myTeamName) return false;
      return team.name.toLowerCase().includes(queryString.toLowerCase());
    });

    // 关键修改点：去掉 logo_path 中的 /public 前缀
    const results = filtered.map(team => ({
      value: team.name,
      avatar: `http://localhost:5000${team.logo_path}`
    }));

    cb(queryString ? results : 
      this.teamlist
        .filter(team => team.name.toLowerCase() !== myTeamName)
        .map(t => ({
          value: t.name,
          avatar: `http://localhost:5000${t.logo_path}`,
        }))
    );
  },
    handleSelect(item) {
      this.selectedTeam = item.value;
    },
    confirm() {
      if (this.selectedTeam.trim()) {
        this.$emit('confirm', this.selectedTeam.trim());
        this.selectedTeam = '';
      }
    }
  }
};
</script>

<style scoped>
.editor-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.editor-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  text-align: center;
}

.btn-row {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.btn-row button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 45px;
  cursor: pointer;
}

.btn-row button:hover {
  background-color: #2980b9;
}
</style>

<!-- 自定义下拉菜单样式 -->
<style>
.custom-autocomplete {
  background-color: #fff0f0;
  border-radius: 10px;
  border: 1px solid #a0cfff;
}

.custom-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;
  background-color: #ffffff;
  
}

.custom-item:hover {
  background-color: #cde8ff;
  
  cursor: pointer;
}

.team-logo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
