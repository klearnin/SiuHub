<template>
    <div class="editor-overlay" v-if="visible">
      <div class="editor-box">
        <h3>{{ title || '选择对手' }}</h3>
        <select v-model="selectedTeam">
          <option disabled value="">请选择一个对手</option>
          <option v-for="team in teamlist" :key="team.id" :value="team.name">
            {{ team.name }}
          </option>
        </select>
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
      confirm() {
        if (this.selectedTeam) {
          this.$emit('confirm', this.selectedTeam);
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
  }
  
  .editor-box {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 280px;
    text-align: center;
  }
  
  .editor-box select {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    font-size: 14px;
  }
  
  .btn-row {
    display: flex;
    justify-content: space-around;
  }
  
  .btn-row button {
    padding: 8px 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 45px;
    cursor: pointer;
    margin-right: 10px;
    margin-bottom: 10px;
  }
  
  .btn-row button:hover {
    background-color: #2980b9;
  }
  </style>
  