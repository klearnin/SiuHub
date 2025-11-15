<template>
  <div class="ai-analysis-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
    </div>

    <div class="main-content">
      <!-- 左侧面板：战术选择和分析请求 -->
      <div class="left-panel">
        <div class="panel-section">
          <h3 class="section-title">选择战术</h3>
          <el-select v-model="selectedTacticId" placeholder="请选择要分析的战术" class="w-full">
            <el-option
              v-for="tactic in tactics"
              :key="tactic.id"
              :label="tactic.tactic_name"
              :value="tactic.id"
            />
          </el-select>
        </div>

        <div class="panel-section">
          <h3 class="section-title">分析参数</h3>
          <el-form :model="analysisForm" label-width="100px">
            <el-form-item label="对手类型">
              <el-select v-model="analysisForm.opponentType" placeholder="请选择对手类型">
                <el-option label="进攻型" value="offensive" />
                <el-option label="防守型" value="defensive" />
                <el-option label="均衡型" value="balanced" />
              </el-select>
            </el-form-item>
            <el-form-item label="比赛环境">
              <el-select v-model="analysisForm.matchEnvironment" placeholder="请选择比赛环境">
                <el-option label="主场" value="home" />
                <el-option label="客场" value="away" />
                <el-option label="中立场地" value="neutral" />
              </el-select>
            </el-form-item>
            <el-form-item label="特别说明">
              <el-input type="textarea" v-model="analysisForm.specialNotes" placeholder="输入额外的分析要求" />
            </el-form-item>
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button
            class="primary-action-button"
            type="primary"
            @click="requestAnalysis"
            :loading="isAnalyzing"
            :disabled="!selectedTacticId || isAnalyzing"
          >
            {{ isAnalyzing ? '分析中...' : '请求AI分析' }}
          </el-button>
        </div>
      </div>

      <!-- 右侧面板：分析结果展示 -->
      <div class="right-panel">
        <div class="analysis-title-wrapper">
          <h2 class="analysis-title">AI战术分析</h2>
        </div>
        <!-- 分析中加载状态 -->
        <div class="loading-container" v-if="isAnalyzing">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <div class="loading-text">
            <h3>AI战术分析中</h3>
            <p>正在为您的战术生成专业分析报告，请稍候...</p>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <!-- 非加载状态下显示其他内容 -->
        <template v-else>
          <div class="analysis-result" v-if="analysisResult">
            <div class="result-header">
              <h3>{{ analysisResult.tacticName }} - AI分析结果</h3>
              <span class="result-time">{{ formatDateTime(analysisResult.createdAt) }}</span>
            </div>
            <div class="result-content" v-html="formatAnalysisResult(analysisResult.result)"></div>
            <div class="result-actions">
              <el-button @click="copyResult">复制结果</el-button>
              <el-button @click="saveResult">保存报告</el-button>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-else>
            <p>请选择一个战术并点击"请求AI分析"按钮</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { marked } from 'marked';
import { formatDateTime } from '../../utils/dateUtils.js';

const router = useRouter();

// 状态变量
const tactics = ref([]);
const selectedTacticId = ref('');
const analysisForm = ref({
  opponentType: '',
  matchEnvironment: '',
  specialNotes: ''
});
const isAnalyzing = ref(false);
const analysisResult = ref(null);
// AI问答相关功能已迁移到独立页面

// 初始化加载战术列表
onMounted(() => {
  loadTactics();
});

// 加载球队战术列表
// 加载球队战术列表
async function loadTactics() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/tactics/tlist', {
      headers: { Authorization: `Bearer ${token}` }
    });
    tactics.value = res.data.tacticList || [];
  } catch (err) {
    ElMessage.error('加载战术列表失败');
    console.error('加载战术列表失败:', err);
  }
}

// 请求AI分析
async function requestAnalysis() {
  if (!selectedTacticId.value) {
    ElMessage.warning('请先选择一个战术');
    return;
  }

  isAnalyzing.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      'http://localhost:5000/api/ai/analyze-tactic',
      { tacticId: selectedTacticId.value, ...analysisForm.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.code === 0) {
      // 获取对应的战术名称
      const selectedTactic = tactics.value.find(t => t.id === selectedTacticId.value);
      analysisResult.value = {
        ...res.data.data,
        tacticName: selectedTactic?.tactic_name || '未知战术',
        createdAt: new Date()
      };
      ElMessage.success('战术分析成功');
    } else {
      ElMessage.error(res.data.msg || '战术分析失败');
    }
  } catch (err) {
    ElMessage.error('战术分析请求失败');
    console.error('战术分析请求失败:', err);
  } finally {
    isAnalyzing.value = false;
  }
}

// AI问答功能已迁移到独立页面并添加到主页导航

// 滚动功能已迁移到独立的AI问答页面

// 格式化分析结果为HTML
function formatAnalysisResult(result) {
  if (!result) return '';
  
  // 使用marked库解析Markdown为HTML
  try {
    // 配置marked选项，可以根据需要调整
    marked.setOptions({
      breaks: true,  // 将回车转换为<br>
      gfm: true,     // 启用GitHub风格Markdown
      headerIds: true, // 为标题添加id属性
      mangle: false,   // 不混淆电子邮件地址
      sanitize: false  // 不进行HTML清理，信任后端返回的内容
    });
    
    // 解析Markdown并返回HTML
    return marked.parse(result);
  } catch (error) {
    console.error('Markdown解析失败:', error);
    // 解析失败时回退到简单格式化
    return result
      .replace(/^# (.*$)/gm, '<h4 class="result-heading">$1</h4>')
      .replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\s*<ul>/gm, '')
      .replace(/\n/g, '<br>');
  }
}

// 不再使用历史记录相关功能

// 复制分析结果
function copyResult() {
  if (!analysisResult.value?.result) return;
  navigator.clipboard.writeText(analysisResult.value.result).then(() => {
    ElMessage.success('分析结果已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
}

// 保存分析报告
function saveResult() {
  if (!analysisResult.value?.result) return;
  ElMessageBox.prompt('请输入报告名称', '保存分析报告', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: `${analysisResult.value.tacticName}分析报告_${formatDateTime(new Date())}`
  }).then(({ value }) => {
    // 这里简化处理，实际项目中可以实现下载功能
    const blob = new Blob([analysisResult.value.result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${value}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('报告保存成功');
  }).catch(() => {
    // 用户取消保存
  });
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
.ai-analysis-page {
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
  background: linear-gradient(135deg, #1c3faa, #2563eb);
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

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.analysis-title-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.analysis-title {
  font-size: 24px;
  font-weight: bold;
  color: #1e3a8a;
  text-shadow: 0 4px 10px rgba(30, 58, 138, 0.15);
}

.main-content {
  display: flex;
  gap: 20px;
  align-items: stretch;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.12), rgba(129, 212, 250, 0.12));
  padding: 20px;
  border-radius: 16px;
  box-sizing: border-box;
}

.left-panel {
  width: 400px;
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  align-self: stretch;
}

.right-panel {
  flex: 1;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: auto;
}

.panel-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.primary-action-button {
  padding: 0 34px;
}

.analysis-result {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.result-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.result-time {
  font-size: 12px;
  color: #999;
}

.result-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  line-height: 1.8;
  color: #333;
}

.result-heading {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
  margin: 15px 0 10px 0;
}

.result-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.result-content li {
  margin: 5px 0;
}

.result-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.history-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.empty-state p {
  font-size: 20px;
  font-weight: 600;
  color: #364152;
  letter-spacing: 0.5px;
}

/* AI问答面板样式 */
.qa-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qa-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.qa-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.qa-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 15px;
  min-height: 300px;
}

.message {
  margin-bottom: 15px;
}

.message-content {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #1890ff;
  color: white;
  margin-left: auto;
}

.message.ai .message-content {
  background: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
}

.message-role {
  font-weight: bold;
  margin-bottom: 5px;
}

.qa-input {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.qa-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 100%;
}

.loading-center p {
  margin-top: 20px;
  color: #666;
  font-size: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  min-height: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
}

.loading-spinner {
  margin-bottom: 30px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #1890ff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  text-align: center;
  color: #333;
}

.loading-text h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #1890ff;
}

.loading-text p {
  font-size: 16px;
  margin-bottom: 20px;
  color: #666;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background-color: #1890ff;
  border-radius: 50%;
  animation: dots 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

</style>