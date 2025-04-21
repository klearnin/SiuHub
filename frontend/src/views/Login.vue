<template>
  <div class="login-container">
    <h2>{{ isRegister ? '注册' : '登录' }}</h2>

    <div class="form-group" v-if="isRegister">
      <input v-model="form.name" type="text" placeholder="姓名" />
    </div>

    <div class="form-group">
      <input v-model="form.phone" type="text" placeholder="手机号" />
    </div>

    <div class="form-group">
      <input v-model="form.password" type="password" placeholder="密码" />
    </div>

    <div class="form-group" v-if="isRegister">
      <input v-model="form.email" type="email" placeholder="邮箱" />
    </div>

    <div class="form-group">
      <select v-model="form.userType" @change="handleUserTypeChange">
        <option disabled value="">选择身份</option>
        <option value="fan">球迷</option>
        <option value="coach">教练</option>
        <option value="player">球员</option>
        <option value="manager">经理</option>
        <option value="medic">队医</option>
      </select>
    </div>

    <!-- 教练特有字段 -->
    <div v-if="isRegister && showTeamNameFields">
      <div class="form-group">
        <input v-model="form.teamName" type="text" placeholder="球队名称" />
      </div>
      <div class="form-group">
        <input v-model="form.teamAbbr" type="text" placeholder="球队简称" />
      </div>
      <div class="form-group">
        <input type="file" @change="handleLogoUpload" />
      </div>
    </div>

    <!-- 球迷选择球队 -->
    <div v-if="isRegister && showSelectTeamField" class="form-group">
      <select v-model="form.teamId">
        <option disabled value="">请选择主队</option>
        <option v-for="team in teams" :key="team._id" :value="team._id">
          {{ team.name }}（{{ team.abbr }}）
        </option>
      </select>
    </div>

    <!-- 球员/经理/队医邀请码 -->
    <div v-if="isRegister && showInviteCodeField" class="form-group">
      <input v-model="form.teamId" type="text" placeholder="邀请码（球队 ID）" />
    </div>

    <div class="form-actions">
      <button @click="isRegister ? register() : login()">
        {{ isRegister ? '注册' : '登录' }}
      </button>
      <button class="toggle" @click="isRegister = !isRegister">
        {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const isRegister = ref(false);
const form = ref({
  name: "",
  phone: "",
  email: "",
  password: "",
  userType: "",
  teamName: "",
  teamAbbr: "",
  teamId: "",
  file: null,
});

const teams = ref([]);

const handleLogoUpload = (e) => {
  form.value.file = e.target.files[0];
};

const login = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      phone: form.value.phone,
      password: form.value.password,
      type: form.value.userType,
    });
    console.log("登录返回数据", res.data);
    localStorage.setItem("token", res.data.token);
    alert("登录成功");

    if (res.data.user.type === "fan") {
      router.push("/fans");
    } else if (res.data.user.type === "coach") {
      router.push("/coach");
    } else if (res.data.user.type === "player") {
      router.push("/player");
    } else if (res.data.user.type === "manager") {
      router.push("/manager");
    } else if (res.data.user.type === "medic") {
      router.push("/medic");
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
    formData.append("teamId", form.value.teamId);
    formData.append("teamName", form.value.teamName);
    formData.append("teamAbbr", form.value.teamAbbr);
    if (form.value.file) {
      formData.append("logo", form.value.file);
    }

    const res = await axios.post(
      `http://localhost:5000/api/auth/register/${form.value.userType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    alert(res.data.message);
    isRegister.value = false;
  } catch (err) {
    alert(err.response?.data?.message || "注册失败");
  }
};

const showTeamNameFields = computed(() => form.value.userType === "coach");
const showInviteCodeField = computed(() =>
  ["player", "manager", "medic"].includes(form.value.userType)
);
const showSelectTeamField = computed(() => form.value.userType === "fan");

// 拉取球队列表（只在选择 fan 时触发）
const handleUserTypeChange = async () => {
  if (form.value.userType === "fan") {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/get-all-teams");
      teams.value = res.data.teams || [];
    } catch (err) {
      console.error("获取球队失败", err);
    }
  }
};
</script>

<style scoped>
.login-container {
  width: 300px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

input,
select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions {
  margin-top: 20px;
}

button.toggle {
  background-color: transparent;
  color: #409eff;
  text-decoration: underline;
  margin-top: 10px;
}
</style>
