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

      <!-- 邮箱：右侧追加“发送验证码”按钮 -->
      <div class="form-group" v-if="isRegister">
        <el-input v-model.trim="form.email" placeholder="邮箱" clearable>
          <template #append>
            <el-button
              :disabled="sendDisabled"
              :loading="sendLoading"
              @click="onSendEmailCode"
              type="primary"
              plain
            >
              {{ sendBtnText }}
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 新增：验证码输入框（紧跟在邮箱项下方） -->
      <div class="form-group" v-if="isRegister">
        <el-input
          v-model.trim="form.emailCode"
          maxlength="6"
          placeholder="请输入6位验证码（不区分大小写）"
          show-word-limit
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

        <div class="aux-actions">
          <el-button
            type="text"
            class="toggle-btn toggle-btn--inline"
            @click="openResetDialog"
          >
            忘记密码
          </el-button>
          <el-button
            type="text"
            class="toggle-btn toggle-btn--inline"
            @click="isRegister = !isRegister"
          >
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 忘记密码弹窗 -->
  <el-dialog v-model="showResetDialog" title="找回密码" width="420px">
    <div class="form-group">
      <el-input v-model.trim="resetForm.phone" placeholder="手机号" clearable />
    </div>
    <div class="form-group">
      <el-select v-model="resetForm.userType" placeholder="选择身份" style="width: 100%">
        <el-option label="球迷" value="fan" />
        <el-option label="教练" value="coach" />
        <el-option label="球员" value="player" />
        <el-option label="经理" value="manager" />
        <el-option label="队医" value="medic" />
      </el-select>
    </div>
    <div class="form-group">
      <el-input v-model.trim="resetForm.email" placeholder="邮箱" clearable>
        <template #append>
          <el-button
            :disabled="resetSendDisabled"
            :loading="resetSendLoading"
            @click="onSendResetCode"
            type="primary"
            plain
          >
            {{ resetSendBtnText }}
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 新增：验证码输入框 -->
    <div class="form-group">
      <el-input
        v-model.trim="resetForm.code"
        maxlength="6"
        placeholder="请输入邮箱验证码（6位）"
        show-word-limit
        clearable
      />
    </div>

    <!-- 新密码 + 确认密码 -->
    <div class="form-group">
      <el-input
        v-model.trim="resetForm.newPwd"
        type="password"
        placeholder="请输入新密码（6~18位）"
        show-password
      />
    </div>
    <div class="form-group">
      <el-input
        v-model.trim="resetForm.confirmPwd"
        type="password"
        placeholder="请再次输入新密码"
        show-password
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showResetDialog = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="resetSubmitLoading"
          @click="onDoResetPassword"
        >
          重置密码
        </el-button>
      </span>
    </template>
  </el-dialog>

</template>

<script setup>
import { ref, computed, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";

const router = useRouter();
const sendLoading = ref(false);
const cooldown = ref(0);
let _timer = null;

const isRegister = ref(false);
const form = ref({
  name: "",
  phone: "",
  email: "",
  emailCode: "",
  emailCodeToken: "",
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
    fan: "/fhome",
    coach: "/chome",
    player: "/phome",
    manager: "/mhome",
    medic: "/dhome",
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

// 发送按钮可用与文案
const sendDisabled = computed(() => {
  if (sendLoading.value || cooldown.value > 0) return true;
  const email = (form.value.email || '').trim();
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
});

const sendBtnText = computed(() =>
  cooldown.value > 0 ? `重新发送(${cooldown.value}s)` : '获取验证码'
);

function _startCooldown(sec = 60) {
  cooldown.value = sec;
  _timer && clearInterval(_timer);
  _timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0) {
      clearInterval(_timer);
      _timer = null;
    }
  }, 1000);
}
onUnmounted(() => _timer && clearInterval(_timer));

// 点击“发送验证码”
async function onSendEmailCode() {
  if (sendDisabled.value) return;
  sendLoading.value = true;
  try {
    const { data } = await axios.post("http://localhost:5000/api/auth/validate-Mail", {
      email: form.value.email,
    });
    // 后端返回 { token }（3分钟有效）
    form.value.emailCodeToken = data?.token || '';
    if (!form.value.emailCodeToken) throw new Error('未获取到验证码token');
    ElMessage.success('验证码已发送，请在3分钟内完成验证');
    _startCooldown(60);
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '发送失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    sendLoading.value = false;
  }
}

// 用户改了邮箱 → 清空旧验证码与令牌，重置倒计时
watch(() => form.value.email, () => {
  form.value.emailCode = '';
  form.value.emailCodeToken = '';
  cooldown.value = 0;
  if (_timer) { clearInterval(_timer); _timer = null; }
});

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
  if (!form.value.emailCodeToken) {
    ElMessage.error("请先获取邮箱验证码");
    return;
  }
  if (!form.value.emailCode || form.value.emailCode.length !== 6) {
    ElMessage.error("请输入6位邮箱验证码");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("name", form.value.name);
    formData.append("phone", form.value.phone);
    formData.append("email", form.value.email);
    formData.append("emailCode", form.value.emailCode);
    formData.append("emailCodeToken", form.value.emailCodeToken);
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

// —— 忘记密码弹窗状态 —— //
const showResetDialog = ref(false);
const resetForm = ref({
  phone: "",
  userType: "",
  email: "",
  code: "",
  newPwd: "",
  confirmPwd: "",
});
const resetToken = ref("");
const resetSendLoading = ref(false);
const resetSubmitLoading = ref(false);

// 倒计时控制
const resetCooldown = ref(0);
let _resetTimer = null;

const resetSendDisabled = computed(() => {
  if (resetSendLoading.value || resetCooldown.value > 0) return true;
  const phoneOk = /^1[3-9]\d{9}$/.test(resetForm.value.phone);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetForm.value.email);
  return !(phoneOk && emailOk && resetForm.value.userType);
});

const resetSendBtnText = computed(() =>
  resetCooldown.value > 0 ? `重新发送(${resetCooldown.value}s)` : "获取验证码"
);

function _startResetCooldown(sec = 60) {
  resetCooldown.value = sec;
  _resetTimer && clearInterval(_resetTimer);
  _resetTimer = setInterval(() => {
    resetCooldown.value -= 1;
    if (resetCooldown.value <= 0) {
      clearInterval(_resetTimer);
      _resetTimer = null;
    }
  }, 1000);
}
onUnmounted(() => _resetTimer && clearInterval(_resetTimer));

// 打开弹窗
const openResetDialog = () => {
  showResetDialog.value = true;
  Object.assign(resetForm.value, {
    phone: form.value.phone || "",
    userType: form.value.userType || "",
    email: form.value.email || "",
    code: "",
    newPwd: "",
    confirmPwd: "",
  });
  resetToken.value = "";
  resetCooldown.value = 0;
};

// 点击“获取验证码”
async function onSendResetCode() {
  if (resetSendDisabled.value) return;
  resetSendLoading.value = true;
  try {
    const { data } = await axios.post("http://localhost:5000/api/auth/send-reset-code", {
      phone: resetForm.value.phone,
      type: resetForm.value.userType,
      email: resetForm.value.email,
    });
    resetToken.value = data?.token || "";
    if (!resetToken.value) throw new Error("未获取到重置 token");
    ElMessage.success("验证码已发送，请在3分钟内完成验证");
    _startResetCooldown(60);
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "发送失败，请稍后重试";
    ElMessage.error(msg);
  } finally {
    resetSendLoading.value = false;
  }
}

// 点击“重置密码”
async function onDoResetPassword() {
  const { code, newPwd, confirmPwd } = resetForm.value;

  if (!code || code.length !== 6) {
    ElMessage.error("请输入6位邮箱验证码");
    return;
  }
  if (newPwd.length < 6 || newPwd.length > 18) {
    ElMessage.error("密码长度需为6~18位");
    return;
  }
  if (newPwd !== confirmPwd) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }
  if (!resetToken.value) {
    ElMessage.error("请先获取验证码");
    return;
  }

  resetSubmitLoading.value = true;
  try {
    const payload = {
      token: resetToken.value,
      code: code.trim().toUpperCase(),
      newPassword: newPwd,
    };
    await axios.post("http://localhost:5000/api/auth/reset-password", payload);
    ElMessage.success("密码重置成功，请使用新密码登录");
    showResetDialog.value = false;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "重置失败，请稍后重试";
    ElMessage.error(msg);
  } finally {
    resetSubmitLoading.value = false;
  }
}

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
/* 第二行两个文本按钮左右分布 */
.aux-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 复用原有 .toggle-btn 样式，但去掉强制 100% 宽度以便并排 */
.toggle-btn--inline {
  width: auto !important;
  display: inline-block;
  margin-top: 0; /* 在行内统一高度 */
}

</style>
