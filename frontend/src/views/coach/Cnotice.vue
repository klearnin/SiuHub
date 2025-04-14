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
      type: "",  // 默认类型
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
        // 1. 校验必填字段
        if (!this.title.trim() || !this.content.trim()) {
        alert("标题和内容不能为空！");
        return;
      }

       try {
        // 2. 构造符合后端接口的数据（字段名需与后端一致）
        const postData = {
          title: this.title,
          content: this.content,
          publish_time: this.currentTime, // 字段名改为 publish_time
          type: 'team'               // 新增类型字段
        };

        // 3. 发送 POST 请求到 /create
        const response = await axios.post("http://localhost:5000/api/notice/create", postData);

        // 4. 根据后端返回的 code 判断结果
        if (response.data.code === 0) {
          alert("创建成功！");
          this.title = "";
          this.content = "";
          this.type = "通知"; // 重置类型
        } else {
          alert(`创建失败：${response.data.msg}`);
        }
      } catch (error) {
        console.error("请求失败:", error);
        alert(`错误：${error.response?.data?.msg || error.message}`);
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
  