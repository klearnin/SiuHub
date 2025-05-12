<template>
    <div class="notice-item">
      <div class="notice-type">{{ type.toUpperCase() }} 公告</div>
  
      <div class="notice-header">
        <input type="text" class="notice-title" placeholder="请输入公告标题" v-model="title" />
        <span class="notice-time">{{ currentTime }}</span>
      </div>
  
      <textarea class="notice-content" placeholder="请输入公告内容" v-model="content"></textarea>
  
      <button @click="send">发送</button>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { ElMessage } from 'element-plus'; // ✅ 加了ElMessage
  
  export default {
    props: {
      type: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        title: "",
        content: "",
        currentTime: new Date().toLocaleString(),
        timer: null
      };
    },
    mounted() {
      this.timer = setInterval(() => {
        this.currentTime = new Date().toLocaleString();
      }, 1000);
    },
    beforeUnmount() { // ⚡ Vue3正确写法
      clearInterval(this.timer);
    },
    methods: {
      async send() {
        if (!this.title.trim() || !this.content.trim()) {
          ElMessage.warning("标题和内容不能为空！");
          return;
        }
  
        try {
          const postData = {
            title: this.title,
            content: this.content,
            publish_time: this.currentTime,
            type: this.type
          };
  
          const response = await axios.post("http://localhost:5000/api/notice/create", postData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
  
          if (response.data.code === 0) {
            ElMessage.success(`${this.type} 公告创建成功！`); // ✅ 用ElMessage.success，不再用alert
            this.title = "";
            this.content = "";
          } else {
            ElMessage.error(`创建失败：${response.data.msg}`);
          }
        } catch (error) {
          console.error("请求失败:", error);
          ElMessage.error(`错误：${error.response?.data?.msg || error.message}`);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .notice-item {
    width: 500px;
    min-height: 400px;
    border: 2px solid #0088ff;
    border-radius: 12px;
    padding: 25px;
    margin: 20px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 12px rgba(0, 136, 255, 0.2);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .notice-type {
    font-size: 20px;
    font-weight: bold;
    color: #0088ff;
    margin-bottom: 15px;
    text-align: center;
    border-bottom: 1px solid #ccc;
    padding-bottom: 10px;
  }
  
  .notice-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  .notice-title {
    flex: 1;
    padding: 10px;
    font-size: 18px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .notice-time {
    font-size: 14px;
    color: #666;
    margin-left: 15px;
    align-self: center;
  }
  
  .notice-content {
    width: 100%;
    height: 180px;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    resize: none;
    margin-bottom: 20px;
  }
  
  button {
    padding: 12px 30px;
    background-color: #0088ff;
    color: white;
    border: none;
    border-radius: 25px;
    align-self: center;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  </style>
  