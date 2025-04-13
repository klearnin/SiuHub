<template>
  <div>
    <h1>登录</h1>
    <input v-model="username" placeholder="用户名" />
    <input v-model="password" type="password" placeholder="密码" />
    <button @click="p_login">球员登录</button>
    <button @click="c_login">教练登录</button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const router = useRouter();

const p_login = () => {
  router.push('/phome');
}
const c_login = () => {
  router.push('/chome');
}

</script>
