<template>
    <div class="player-home">
      <!-- 顶部导航栏 -->
      <div class="nav-buttons">
        <router-link to="/forum" class="nav-button">论坛</router-link>
        <router-link to="/team" class="nav-button">主队查看</router-link>
        <router-link to="/schedule" class="nav-button">球队日程</router-link>
        <router-link to="/Pnotice" class="nav-button">球队公告</router-link>
        <router-link to="/tactics" class="nav-button">球队战术</router-link>
      </div>
  
      <!-- 右侧个人信息区 -->
      <div class="profile-section">
        <div class="avatar-circle">
          <!-- 头像占位图 -->
          <img src="/picture/db2f98717e0dbd0304840072562a1770.png" alt="球员头像" class="avatar">
        </div>
        <button @click="handleLogout" class="logout-button">退出</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PlayerHome',
    methods: {
      handleLogout() {
        // 处理退出登录逻辑
        this.$router.push('/login')
      }
    }
  }
  </script>
  
  <style scoped>
  .player-home {
    display: flex;
    justify-content: space-between;
    padding: 20px;
  }
  
  .nav-buttons {
    display: flex;
    gap: 15px;
  }
  
  .nav-button {
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    transition: background-color 0.3s;
  }
  
  .nav-button:hover {
    background-color: #2980b9;
  }
  
  .profile-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .avatar-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #3498db;
  }
  
  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .logout-button {
    padding: 8px 16px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .logout-button:hover {
    background-color: #c0392b;
  }
  </style>
  