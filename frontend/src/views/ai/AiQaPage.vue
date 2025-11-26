<template>
  <div class="ai-qa-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
    </div>

    <div class="qa-container">
      <div class="analysis-title-wrapper">
        <h2 class="analysis-title">全能型球队管家</h2>
      </div>
      <!-- 问答历史区域 -->
      <div class="qa-history" ref="qaHistoryRef">
        <div v-if="qaMessages.length === 0" class="empty-qa-history">
          <p>开始向AI提问关于战术、球员健康或足球知识的问题吧！</p>
        </div>
        <div v-for="(msg, index) in qaMessages" :key="index" :class="['message', msg.role]">
          <div class="message-content">
            <div class="message-role">{{ msg.role === 'user' ? '你' : 'AI管家' }}:</div>
            <!-- AI思考中状态 -->
            <div v-if="msg.role === 'ai' && msg.isLoading" class="loading-message">
              <el-spinner size="small" />
              <span>正在思考中，请稍候...</span>
            </div>
            <div v-else v-html="formatAnalysisResult(msg.content)"></div>
            <!-- 为AI回答添加重试按钮 -->
            <div v-if="msg.role === 'ai' && msg.error" class="retry-section">
              <el-button size="small" type="warning" @click="retryQuestion(index)">重试</el-button>
              <span class="error-message">{{ msg.error }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 提问输入区域 -->
      <div class="qa-input">
        <el-input
          type="textarea"
          v-model="currentQuestion"
          placeholder="请输入你的问题（例如：这个战术如何应对4-3-3阵型？球员的恢复周期需要多久？如何提高球队的防守能力？）"
          :rows="3"
          :disabled="isAsking"
          @keyup.enter.ctrl="askQuestion"
          class="question-input"
        />
        <div class="qa-actions">
          <el-button
            class="primary-action-button"
            type="primary"
            @click="askQuestion"
            :loading="isAsking"
            :disabled="!currentQuestion.trim() || isAsking"
          >
            {{ isAsking ? '思考中...' : '发送' }}
          </el-button>
          <el-button class="ghost-button" @click="clearMessages">清空对话</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { marked } from 'marked';

const router = useRouter();

// 状态变量
const qaMessages = ref([]);
const currentQuestion = ref('');
const isAsking = ref(false);
const qaHistoryRef = ref(null);

// 初始化加载数据
onMounted(() => {
  // 初始不自动加载数据
});

// 向AI提问 - 简化版本
async function askQuestion() {
  // 防止重复提交
  if (!currentQuestion.value.trim() || isAsking.value) {
    return;
  }
  
  const question = currentQuestion.value.trim();
  
  // 检查用户是否登录
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error('请先登录');
    return;
  }
  
  // 添加用户问题到消息历史
    qaMessages.value.push({
      role: 'user',
      content: question
    });
    
    // 添加AI正在思考的临时消息
    const loadingMessageIndex = qaMessages.value.length;
    qaMessages.value.push({
      role: 'ai',
      content: '',
      isLoading: true
    });
    
    isAsking.value = true;
    currentQuestion.value = '';
  
  try {
    // 确保DOM更新后再滚动
    await nextTick();
    scrollToBottom();
    
    const apiEndpoint = 'http://localhost:5000/api/ai/team-question';
    
    // 简单的API请求
    const res = await axios.post(
      apiEndpoint,
      { question },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000 // 修改为2分钟超时
      }
    );
    
    // 获取AI回答
    let aiAnswer = '';
    
    // 简化的响应格式处理
    if (res.data && res.data.code === 0 && res.data.data && res.data.data.answer) {
      aiAnswer = res.data.data.answer;
    } else if (res.data && res.data.answer) {
      aiAnswer = res.data.answer;
    } else {
      throw new Error('无法从响应中获取AI回答');
    }
    
    if (aiAnswer) {
      // 移除加载消息并添加实际回答
      qaMessages.value.splice(loadingMessageIndex, 1, {
        role: 'ai',
        content: aiAnswer,
        error: null,
        isLoading: false
      });
      
      // 确保DOM更新后再滚动
      await nextTick();
      scrollToBottom();
    }
  } catch (err) {
    console.error('请求错误:', err);
    
    // 简化的错误消息处理
    let errorMessage = '获取回答时发生错误';
    
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = '登录已过期，请重新登录';
      } else if (err.response.status >= 500) {
        errorMessage = '服务器错误，请稍后再试';
      } else if (err.response.data && (err.response.data.msg || err.response.data.message)) {
        errorMessage = err.response.data.msg || err.response.data.message;
      }
    } else if (err.message && err.message.includes('timeout')) {
      errorMessage = '请求超时，请检查网络或稍后重试';
    }
    
    ElMessage.error(errorMessage);
    // 移除加载消息并添加错误消息
    qaMessages.value.splice(loadingMessageIndex, 1, {
      role: 'ai',
      content: '',
      error: errorMessage,
      isLoading: false
    });
    
    // 确保DOM更新后再滚动
    nextTick(() => {
      scrollToBottom();
    });
  } finally {
    isAsking.value = false;
  }
}

// 添加错误消息 - 简化版
function addErrorMessage(errorMsg) {
  const aiMessage = {
    role: 'ai',
    content: '',
    error: errorMsg
  };
  qaMessages.value.push(aiMessage);
  
  // 确保DOM更新后再滚动
  nextTick(() => {
    scrollToBottom();
  });
}

// 重试问题 - 简化版
async function retryQuestion(aiIndex) {
  if (aiIndex <= 0 || qaMessages.value[aiIndex].role !== 'ai') {
    return;
  }
  
  // 获取对应的用户问题
  const userIndex = aiIndex - 1;
  if (userIndex >= 0 && qaMessages.value[userIndex].role === 'user') {
    const question = qaMessages.value[userIndex].content;
    
    // 移除错误的AI回答
    qaMessages.value.splice(aiIndex, 1);
    
    // 重新提问
    currentQuestion.value = question;
    await askQuestion();
  }
}

// 滚动到聊天历史底部 - 简化版
function scrollToBottom() {
  if (qaHistoryRef.value) {
    try {
      qaHistoryRef.value.scrollTop = qaHistoryRef.value.scrollHeight;
    } catch (err) {
      console.warn('滚动到底部失败:', err);
    }
  }
}

// 格式化回答结果为HTML - 简化版
function formatAnalysisResult(result) {
  if (!result) return '';
  
  // 使用marked库解析Markdown为HTML
  try {
    return marked.parse(result);
  } catch (error) {
    console.error('Markdown解析失败:', error);
    return result;
  }
}

// 清空对话记录
function clearMessages() {
  qaMessages.value = [];
}

// 返回首页
function goBack() {
  // 根据用户类型返回不同的首页
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userType = payload.type;
      
      if (userType === 'coach') {
        router.push('/chome');
      } else if (userType === 'medic') {
        router.push('/dhome');
      } else if (userType === 'manager') {
        router.push('/mhome');
      } else if (userType === 'player') {
        router.push('/phome');
      } else {
        router.push('/fhome');
      }
    } catch (err) {
      console.error('解析token失败:', err);
      router.push('/chome'); // 默认返回教练首页
    }
  } else {
    router.push('/');
  }
}
</script>

<style scoped>

.ai-qa-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  margin-right: 20px;
}

.back-button,
.primary-action-button {
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  padding: 0 30px;
  height: 46px;
  line-height: 46px;
  border: none;
  background: linear-gradient(135deg, #a0a7bc, #2563eb);
  color: #fff;
  box-shadow: 0 12px 26px rgba(30, 64, 175, 0.25);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.back-button:hover,
.primary-action-button:hover {
  background: linear-gradient(135deg, #1a358f, #1d4ed8);
  box-shadow: 0 10px 22px rgba(30, 64, 175, 0.35);
  transform: translateY(-1px);
}

.back-button:focus-visible,
.primary-action-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
}

.qa-container {
  max-width: 1400px;
  margin: 10px auto 0;
  background: linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
  border-radius: 16px;
  box-shadow: 0 15px 45px rgba(15, 23, 42, 0.15);
  padding: 40px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
}

.analysis-title-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.analysis-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e3a8a;
  text-shadow: 0 6px 20px rgba(30, 58, 138, 0.2);
  letter-spacing: 1px;
}

.qa-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 30px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  border: 1px solid rgba(30, 64, 175, 0.12);
}

.empty-qa-history {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #364152;
  font-size: 18px;
  text-align: center;
  font-weight: 600;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 6px;
}

.message.user {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  margin-left: 20px;
  margin-right: auto;
  max-width: 80%;
}

.message.ai {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05));
  margin-right: 20px;
  margin-left: auto;
  max-width: 80%;
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  color: #666;
}

.loading-message span {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.message-content {
  word-break: break-word;
}

.message-role {
  font-weight: bold;
  margin-bottom: 5px;
}

.retry-section {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
}

.qa-input {
  border-top: 1px solid rgba(30, 64, 175, 0.1);
  padding-top: 30px;
}

.question-input :deep(textarea::placeholder) {
  font-weight: 600;
  color: rgba(52, 75, 113, 0.65);
}

.qa-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}

.primary-action-button {
  padding: 0 34px;
}



.ghost-button {
  font-size: 16px;
  font-weight: 600;
  padding: 0 30px;
  height: 46px;
  line-height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(30, 64, 175, 0.3);
  color: #1e3a8a;
  background: rgba(255, 255, 255, 0.9);
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.ghost-button:hover {
  color: #1a358f;
  border-color: rgba(30, 64, 175, 0.6);
  background: rgba(30, 64, 175, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-qa-page {
    padding: 10px;
  }
  
  .qa-container {
    height: calc(100vh - 150px);
  }
  
  .message.user,
  .message.ai {
    max-width: 90%;
    margin-left: 10px;
    margin-right: 10px;
  }
}
</style>