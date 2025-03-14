<template>
    <div>
      <h1>登录</h1>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />
      <button @click="login">登录</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import axios from "axios";
  
  const username = ref("");
  const password = ref("");
  
  const login = async () => {
    const res = await axios.post("http://localhost:5000/api/auth/login", { username: username.value, password: password.value });
    localStorage.setItem("token", res.data.token);
  };
  </script>
  