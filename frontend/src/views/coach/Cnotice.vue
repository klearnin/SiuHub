<template>
    <div class="notice-container">
      <div class="notice-item">
        <div class="notice-header">
          <input type="text" class="notice-title" placeholder="通知标题"v-model="title">
          <span class="notice-time">{{ currentTime }}</span>
        </div>
        <textarea class="notice-content" placeholder="通知内容"v-model="content"></textarea>
      </div> 
      <button @click="send">发送</button>
    </div>
  
  </template>
  

<script>

import axios from 'axios';
export default {


  data() {
    return {
      title: "",       // 存储标题输入
      content: "",     // 存储内容输入
      currentTime: new Date().toLocaleString()
    };
  },
  mounted() {
    this.timer = setInterval(() => {
      this.currentTime = new Date().toLocaleString();
    }, 1000); // 每秒更新一次
  },
  beforeDestroy() {
    clearInterval(this.timer); // 组件销毁时清除定时器
  },


  methods:{
     async send(){
         // 1. 校验数据
      if (!this.title.trim()) {
        alert("标题不能为空！");
        return;
      }
      if (!this.content.trim()) {
        alert("内容不能为空！");
        return;
      }
      // 2. 构造请求数据
      const postData = {
        title: this.title,
        content: this.content,
        time: this.currentTime
      };
      try {
        // 3. 发送 POST 请求（替换为你的实际 API 地址）
        const response = await axios.post('https://your-api-endpoint.com/notices', postData, {
          headers: {
            'Content-Type': 'application/json' // 根据后端要求设置请求头
          }
        });

        // 4. 处理成功响应
        if (response.data.success) {
          alert("通知发送成功！");
          this.title = "";  // 清空输入
          this.content = "";
        } else {
          alert(`发送失败：${response.data.message}`);
        }
      } catch (error) {
        // 5. 处理错误
        console.error("请求失败:", error);
        alert(`发送失败：${error.message || "网络错误"}`);
      }
    }
     

  }
};
</script>



  <style scoped>
  .notice-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px 0;
  }
  
  button {
    margin-top: 20px;
    padding: 12px 30px;
    background-color: #0088ff;
    color: white;
    border-radius: 25px;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  .notice-item {
    width: 80%;
    max-width: 600px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .notice-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  .notice-title {
    flex: 1;
    padding: 8px;
    font-size: 18px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .notice-time {
    margin-left: 15px;
    font-size: 14px;
    color: #666;
    align-self: center;
  }
  
  .notice-content {
    width: 100%;
    height: 150px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: none;
  }
  </style>
  