<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover">
      <h2>{{ isRegister ? '注册' : '登录' }}</h2>

      <div class="form-group" v-if="isRegister">
        <el-input
          v-model="form.name"
          :placeholder="form.userType === 'fan' ? '用户名' : '姓名'"
          prefix-icon="User"
          clearable
        />
      </div>

      <div class="form-group">
        <el-input
          v-model="form.phone"
          placeholder="手机号"
          prefix-icon="Phone"
          clearable
        />
      </div>

      <div class="form-group">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          prefix-icon="Lock"
          show-password
        />
      </div>

      <div class="form-group" v-if="isRegister">
        <el-input
          v-model="form.email"
          placeholder="邮箱"
          prefix-icon="Message"
          clearable
        />
      </div>

      <div class="form-group">
        <el-select v-model="form.userType" placeholder="选择身份" @change="handleUserTypeChange">
          <el-option label="球迷" value="fan" />
          <el-option label="教练" value="coach" />
          <el-option label="球员" value="player" />
          <el-option label="经理" value="manager" />
          <el-option label="队医" value="medic" />
        </el-select>
      </div>

      <!-- 教练信息 -->
      <div v-if="isRegister && showTeamNameFields">
        <el-input v-model="form.teamName" placeholder="球队名称" class="form-group" />
        <el-input v-model="form.teamAbbr" placeholder="球队简称" class="form-group" />
        <div class="form-group">
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="handleLogoUpload"
          >
            <el-button type="primary" plain>上传队徽</el-button>
          </el-upload>
        </div>
      </div>

      <!-- 球迷选择主队 -->
      <div v-if="isRegister && showSelectTeamField" class="form-group">
        <el-select v-model="form.teamId" placeholder="请选择主队">
          <el-option
            v-for="team in teams"
            :key="team.id"
            :label="team.name"
            :value="team.id"
          />
        </el-select>
      </div>

      <!-- 球员/经理/队医邀请码 -->
      <div v-if="isRegister && showInviteCodeField" class="form-group">
        <el-input v-model="form.inviteCode" placeholder="邀请码" />
      </div>

      <!-- 上传头像 -->
      <div v-if="isRegister" class="form-group">
        <el-upload
          :show-file-list="false"
          :auto-upload="false"
          accept="image/*"
          :on-change="handleAvatarUpload"
        >
          <el-button type="primary" plain>上传头像</el-button>
        </el-upload>
      </div>

      <div class="form-actions">
        <el-button type="primary" @click="isRegister ? register() : login()" size="large" style="width: 100%">
          {{ isRegister ? '注册' : '登录' }}
        </el-button>
        <el-button type="text" @click="isRegister = !isRegister" class="toggle">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";  // ✅ 新增 Element Plus 消息组件

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
  teamId: "",       // 球迷选择的主队 ID
  inviteCode: "",   // 球员/经理/队医的邀请码
  file: null,
  avatarFile: null,     // 用户头像
});

const teams = ref([]);

const handleLogoUpload = (e) => {
  form.value.file = e.target.files[0];
};

// ✅ 新增：处理头像上传
const handleAvatarUpload = (e) => {
  form.value.avatarFile = e.target.files[0];
};

const redirectAfterLogin = (type) => {
  const routes = {
    fan: "/fans",
    coach: "/coach",
    player: "/player",
    manager: "/manager",
    medic: "/medic",
  };
  const path = routes[type];
  if (path) {
    router.push(path);
  } else {
    ElMessage.error("该用户类型暂未设置跳转路径");  // ✅ 替换 alert
  }
};

const validateLoginForm = () => {
  console.log(form.value);  // 打印表单内容
  if (!form.value.phone) {
    ElMessage.error("请输入手机号");  // ✅ 替换 alert
    return false;
  }
  if (!form.value.password) {
    ElMessage.error("请输入密码");  // ✅ 替换 alert
    return false;
  }
  if (!form.value.userType) {
    ElMessage.error("请选择身份");  // ✅ 替换 alert
    return false;
  }
  return true;
};

const login = async () => {
  console.log("登录请求数据", {
    phone: form.value.phone,
    password: form.value.password,
    type: form.value.userType,
  });

  if (!validateLoginForm()) return;
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      phone: form.value.phone,
      password: form.value.password,
      type: form.value.userType,
    });
    console.log("登录返回数据", res.data);
    localStorage.setItem("token", res.data.token);
    ElMessage.success("登录成功");  // ✅ 替换 alert
    redirectAfterLogin(res.data.user.type);
  } catch (err) {
    console.error("登录失败详细信息：", err.response?.data);
    ElMessage.error(err.response?.data?.message || "登录失败");  // ✅ 替换 alert
  }
};

const register = async () => {
  // 正则表达式验证
  const phoneRegex = /^1[3-9]\d{9}$/; // 简单验证国内手机号
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!phoneRegex.test(form.value.phone)) {
    ElMessage.error("请输入合法的手机号");  // ✅ 替换 alert
    return;
  }

  if (!emailRegex.test(form.value.email)) {
    ElMessage.error("请输入合法的邮箱地址");  // ✅ 替换 alert
    return;
  }

  if (!form.value.password || form.value.password.length < 6 || form.value.password.length > 18) {
    ElMessage.error("密码长度需为 6~18 位");  // ✅ 替换 alert
    return;
  }

  try {
    const formData = new FormData();
    formData.append("name", form.value.name);
    formData.append("phone", form.value.phone);
    formData.append("email", form.value.email);
    formData.append("password", form.value.password);
    if (form.value.userType === "fan") {                // 设置 teamId: fan 用 teamId，其他用 inviteCode
      formData.append("teamId", form.value.teamId);
    } else {
      formData.append("teamId", form.value.inviteCode);  // 作为邀请码处理
    }
    formData.append("teamName", form.value.teamName);
    formData.append("teamAbbr", form.value.teamAbbr);
    // ✅ 教练上传队徽
    if (form.value.userType === "coach" && form.value.file) {
      formData.append("logo", form.value.file);
    }

    // ✅ 所有身份上传头像（教练头像 = 队徽）
    if (form.value.avatarFile) {
      formData.append("avatar", form.value.avatarFile);
    }

    const res = await axios.post(
      `http://localhost:5000/api/auth/register/${form.value.userType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    // 注册成功提示
    let message = res.data.message || "注册成功";
    if (form.value.userType === "coach" && res.data.inviteCode) {
      message += `，你的球队邀请码是：${res.data.inviteCode}`;
    }
    ElMessage.success(message);  // ✅ 替换 alert

    // 注册成功后切换到登录界面
    isRegister.value = 0;

  } catch (err) {
    console.error("注册失败详细信息：", err);
    ElMessage.error(err.response?.data?.message || "注册失败");  // ✅ 替换 alert
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
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: white;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #409eff;
}

.form-group {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 25px;
  text-align: center;
}

.toggle {
  display: block;
  margin-top: 10px;
  text-align: center;
  width: 100%;
  font-size: 14px;
  color: #909399;
}
</style>

