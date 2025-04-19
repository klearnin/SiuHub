<template>
  <div class="auth-container">
    <div class="form-box">
      <h2>{{ isRegister ? "注册" : "登录" }}</h2>

      <div v-if="isRegister">
        <input v-model="form.name" placeholder="姓名" />
        <input v-model="form.phone" placeholder="手机号" />
        <input v-model="form.email" placeholder="邮箱" />
        <input v-model="form.password" type="password" placeholder="密码" />
        <div class="captcha-row">
          <input v-model="form.captcha" placeholder="验证码" />
          <button @click="sendCaptcha" :disabled="captchaCountdown > 0">
            {{ captchaCountdown > 0 ? `${captchaCountdown}s` : "发送验证码" }}
          </button>
        </div>

        <select v-model="form.userType">
          <option disabled value="">选择用户类型</option>
          <option value="coach">教练</option>
          <option value="fan">球迷</option>
          <option value="player">球员</option>
          <option value="manager">经理</option>
          <option value="medic">队医</option>
        </select>

        <!-- 教练专属 -->
        <div v-if="form.userType === 'coach'">
          <input v-model="form.teamName" placeholder="球队名称" />
          <input v-model="form.teamAbbr" placeholder="球队简称" />
          <input type="file" @change="handleLogoUpload" />
        </div>

        <!-- 球迷专属 -->
        <div v-if="form.userType === 'fan'">
          <input v-model="form.teamId" placeholder="支持的主队ID" />
        </div>

        <!-- 其他身份（邀请码） -->
        <div v-if="['player', 'manager', 'medic'].includes(form.userType)">
          <input v-model="form.teamId" placeholder="邀请码" />
        </div>
      </div>
      <div v-else>
        <input v-model="form.phone" placeholder="手机号" />
        <input v-model="form.password" type="password" placeholder="密码" />
        <select v-model="form.userType">
          <option disabled value="">选择登录身份</option>
          <option value="fan">球迷</option>
          <option value="coach">教练</option>
          <option value="player">球员</option>
          <option value="manager">经理</option>
          <option value="medic">队医</option>
        </select>
      </div>

      <button @click="isRegister ? register() : login()">
        {{ isRegister ? "注册" : "登录" }}
      </button>
      <p @click="isRegister = !isRegister" class="switch-mode">
        {{ isRegister ? "已有账号？点我登录" : "没有账号？点我注册" }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"; // 添加
import axios from "axios";

const router = useRouter(); // 添加

const isRegister = ref(false);
const form = ref({
  name: "",
  phone: "",
  email: "",
  password: "",
  captcha: "",
  userType: "",
  teamName: "",
  teamAbbr: "",
  teamId: "",
  logoFile: null,
});

const handleLogoUpload = (e) => {
  form.value.logoFile = e.target.files[0];
};

const login = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      phone: form.value.phone,
      password: form.value.password,
      type: form.value.userType, // 加入身份类型
    });
    // 👇 添加在这里
    console.log("登录返回数据", res.data);
    
    localStorage.setItem("token", res.data.token);
    alert("登录成功");

    // 根据用户类型跳转（这里只处理 fan 示例）
    if (res.data.user.type === "fan") {
      router.push("/fans");
    } else {
      alert("该用户类型暂未设置跳转");
    }
  } catch (err) {
    alert(err.response?.data?.message || "登录失败");
  }
};

const register = async () => {
  try {
    const formData = new FormData();
    formData.append("name", form.value.name);
    formData.append("phone", form.value.phone);
    formData.append("email", form.value.email);
    formData.append("password", form.value.password);
    formData.append("captcha", form.value.captcha);
    formData.append("teamId", form.value.teamId);
    formData.append("teamName", form.value.teamName);
    formData.append("teamAbbr", form.value.teamAbbr);
    if (form.value.logoFile) {
      formData.append("file", form.value.logoFile);
    }

    const res = await axios.post(
      `http://localhost:5000/api/auth/register/${form.value.userType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    alert(res.data.message);
  } catch (err) {
    alert(err.response?.data?.message || "注册失败");
  }
};

const captchaCountdown = ref(0);
let countdownTimer = null;

const sendCaptcha = async () => {
  try {
    await axios.post("http://localhost:5000/api/auth/send-captcha", {
      phone: form.value.phone,
    });
    alert("验证码已发送");
    captchaCountdown.value = 60;
    countdownTimer = setInterval(() => {
      captchaCountdown.value--;
      if (captchaCountdown.value <= 0) clearInterval(countdownTimer);
    }, 1000);
  } catch (err) {
    alert(err.response?.data?.message || "验证码发送失败");
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  padding: 50px 20px;
}
.form-box {
  width: 400px;
  padding: 30px;
  border: 1px solid #ccc;
  border-radius: 16px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background: white;
}
input,
select {
  display: block;
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}
button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}
.switch-mode {
  text-align: center;
  color: #007bff;
  margin-top: 10px;
  cursor: pointer;
}
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.captcha-row input {
  flex: 1;
}
.captcha-row button {
  width: 120px;
}
</style>
