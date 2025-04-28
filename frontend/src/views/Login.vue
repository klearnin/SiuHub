<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover">
      <h2>{{ isRegister ? '注册' : '登录' }}</h2>

      <div class="form-group" v-if="isRegister">
        <el-input
          v-model="form.name"
          :placeholder="form.userType === 'fan' ? '用户名' : '姓名'"
          clearable
        />
      </div>

      <div class="form-group">
        <el-input
          v-model="form.phone"
          placeholder="手机号"
          clearable
        />
      </div>

      <div class="form-group">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          show-password
        />
      </div>

      <div class="form-group" v-if="isRegister">
        <el-input
          v-model="form.email"
          placeholder="邮箱"
          clearable
        />
      </div>

      <div class="form-group">
        <el-select
          v-model="form.userType"
          placeholder="选择身份"
          @change="handleUserTypeChange"
          style="width: 100%"
        >
          <el-option label="球迷" value="fan" />
          <el-option label="教练" value="coach" />
          <el-option label="球员" value="player" />
          <el-option label="经理" value="manager" />
          <el-option label="队医" value="medic" />
        </el-select>
      </div>

      <!-- 教练特有字段 -->
      <div v-if="isRegister && showTeamNameFields">
        <el-input v-model="form.teamName" placeholder="球队名称" class="form-group" clearable />
        <el-input v-model="form.teamAbbr" placeholder="球队简称" class="form-group" clearable />
        <div class="form-group">
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="handleLogoUpload"
          >
            <el-button type="primary" plain>上传队徽</el-button>
          </el-upload>
          <div v-if="logoPreview" class="preview">
            <img :src="logoPreview" alt="队徽预览" />
          </div>
        </div>
      </div>

      <!-- 球迷选择球队 -->
      <div v-if="isRegister && showSelectTeamField" class="form-group">
        <el-select
          v-model="form.teamId"
          placeholder="请选择主队"
          style="width: 100%"
        >
          <el-option
            v-for="team in teams"
            :key="team.id"
            :label="team.name + '（' + team.abbr + '）'"
            :value="team.id"
          />
        </el-select>
        <div class="form-group" style="margin-top: 10px;">
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="handleAvatarUpload"
          >
            <el-button type="primary" plain>上传头像</el-button>
          </el-upload>
          <div v-if="avatarPreview" class="preview">
            <img :src="avatarPreview" alt="头像预览" />
          </div>
        </div>
      </div>

      <!-- 球员/经理/队医邀请码 -->
      <div v-if="isRegister && showInviteCodeField" class="form-group">
        <el-input v-model="form.inviteCode" placeholder="邀请码" clearable />
        <div class="form-group" style="margin-top: 10px;">
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="handleAvatarUpload"
          >
            <el-button type="primary" plain>上传头像</el-button>
          </el-upload>
          <div v-if="avatarPreview" class="preview">
            <img :src="avatarPreview" alt="头像预览" />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="isRegister ? register() : login()"
        >
          {{ isRegister ? '注册' : '登录' }}
        </el-button>
        <el-button
          type="text"
          class="toggle-btn"
          @click="isRegister = !isRegister"
        >
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";

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
  inviteCode: "",
  file: null,
  avatarFile: null,
});

const teams = ref([]);
const avatarPreview = ref("");
const logoPreview = ref("");

const handleAvatarUpload = (uploadFile) => {
  form.value.avatarFile = uploadFile.raw;
  avatarPreview.value = URL.createObjectURL(uploadFile.raw);
  ElMessage.success("头像上传成功！");
};

const handleLogoUpload = (uploadFile) => {
  form.value.file = uploadFile.raw;
  logoPreview.value = URL.createObjectURL(uploadFile.raw);
  ElMessage.success("队徽上传成功！");
};

const redirectAfterLogin = (type) => {
  const routes = {
    fan: "/fans",
    coach: "/chome",
    player: "/phome",
    manager: "/manager",
    medic: "/medic",
  };
  const path = routes[type];
  if (path) {
    router.push(path);
  } else {
    ElMessage.error("该用户类型暂未设置跳转路径");
  }
};

const validateLoginForm = () => {
  if (!form.value.phone) {
    ElMessage.error("请输入手机号");
    return false;
  }
  if (!form.value.password) {
    ElMessage.error("请输入密码");
    return false;
  }
  if (!form.value.userType) {
    ElMessage.error("请选择身份");
    return false;
  }
  return true;
};

const login = async () => {
  if (!validateLoginForm()) return;
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      phone: form.value.phone,
      password: form.value.password,
      type: form.value.userType,
    });
    localStorage.setItem("token", res.data.token);
    ElMessage.success("登录成功");
    redirectAfterLogin(res.data.user.type);
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "登录失败");
  }
};

const register = async () => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!phoneRegex.test(form.value.phone)) {
    ElMessage.error("请输入合法的手机号");
    return;
  }
  if (!emailRegex.test(form.value.email)) {
    ElMessage.error("请输入合法的邮箱地址");
    return;
  }
  if (!form.value.password || form.value.password.length < 6 || form.value.password.length > 18) {
    ElMessage.error("密码长度需为 6~18 位");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("name", form.value.name);
    formData.append("phone", form.value.phone);
    formData.append("email", form.value.email);
    formData.append("password", form.value.password);
    formData.append("teamId", form.value.userType === "fan" ? form.value.teamId : form.value.inviteCode);
    formData.append("teamName", form.value.teamName);
    formData.append("teamAbbr", form.value.teamAbbr);
    if (form.value.userType === "coach" && form.value.file) {
      formData.append("logo", form.value.file);
    }
    if (form.value.avatarFile) {
      formData.append("avatar", form.value.avatarFile);
    }

    const res = await axios.post(
      `http://localhost:5000/api/auth/register/${form.value.userType}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    let message = res.data.message || "注册成功";
    if (form.value.userType === "coach" && res.data.inviteCode) {
      message += `，你的球队邀请码是：${res.data.inviteCode}`;
    }
    ElMessage.success(message);
    isRegister.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "注册失败");
  }
};

const showTeamNameFields = computed(() => form.value.userType === "coach");
const showInviteCodeField = computed(() =>
  ["player", "manager", "medic"].includes(form.value.userType)
);
const showSelectTeamField = computed(() => form.value.userType === "fan");

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
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #e0f7fa, #fce4ec);
}

.login-card {
  width: 380px;
  padding: 30px 20px;
  border-radius: 16px;
  background: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #409eff;
}

.form-group {
  margin-bottom: 20px;
}

.preview {
  margin-top: 10px;
  text-align: center;
}
.preview img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.form-actions {
  margin-top: 20px;
}

.submit-btn {
  width: 100%;
  transition: background-color 0.3s;
}
.submit-btn:hover {
  background-color: #66b1ff;
}

.toggle-btn {
  display: block;
  margin-top: 10px;
  text-align: center;
  width: 100%;
  font-size: 14px;
  color: #909399;
  transition: color 0.3s;
}
.toggle-btn:hover {
  color: #409eff;
}
</style>
