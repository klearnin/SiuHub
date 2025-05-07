<template>
    <div class="notice-container">
      <div class="notice-box">
        <NoticeItem type="team" />
        <NoticeItem type="fan" />
      </div>
  
      <button class="back-button" @click="goBack">返回</button>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import NoticeItem from './NoticeItem.vue';
  
  const router = useRouter();
  
  const goBack = () => {
    router.push('/dhome');
  };
  
  onMounted(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userType = payload.type;
  
      console.log(`👮 页面内部检查身份: ${userType}`);
  
      if (userType !== "medic") {
        ElMessage.error("无权访问该页面");
        router.replace("/login");
      }
    } else {
      ElMessage.error("请先登录");
      router.replace("/login");
    }
  });
  </script>
  
  <style scoped>
  .notice-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px;
  }
  
  .notice-box {
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  /* 修改返回按钮样式 */
  .back-button {
    width: 150px;
    height: 50px;
    font-size: 18px;
    background-color: #ccc;
    color: #333;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    margin-top: 30px;
    transition: background-color 0.3s;
  }
  
  .back-button:hover {
    background-color: #4ddbee;
  }
  </style>
  