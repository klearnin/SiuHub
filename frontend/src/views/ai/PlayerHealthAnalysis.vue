<template>
  <div class="ai-analysis-page">
    <div class="top-bar">
      <el-button @click="goBack" class="back-button" type="primary">返回首页</el-button>
    </div>

    <div class="main-content">
      <!-- 左侧面板：球员选择和分析请求 -->
      <div class="left-panel">
        <div class="panel-section">
          <h3 class="section-title">选择球员</h3>
          <el-select v-model="selectedPlayerId" placeholder="请选择要分析的球员" class="w-full">
            <el-option
              v-for="player in players"
              :key="player.id"
              :label="player.player_name"
              :value="player.id"
            />
          </el-select>
        </div>

        <!-- 球员基本信息展示 -->
        <div class="panel-section" v-if="selectedPlayer">
          <h3 class="section-title">球员信息</h3>
          <div class="player-info">
            <div class="info-item">
              <span class="info-label">姓名：</span>
              <span class="info-value">{{ selectedPlayer.player_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">号码：</span>
              <span class="info-value">{{ selectedPlayer.player_number }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄：</span>
              <span class="info-value">{{ selectedPlayer.age }}岁</span>
            </div>
            <div class="info-item">
              <span class="info-label">身高：</span>
              <span class="info-value">{{ selectedPlayer.height }}cm</span>
            </div>
            <div class="info-item">
              <span class="info-label">体重：</span>
              <span class="info-value">{{ selectedPlayer.weight }}kg</span>
            </div>
            <div class="info-item">
              <span class="info-label">惯用脚：</span>
              <span class="info-value">{{ selectedPlayer.dominant_foot }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">健康状态：</span>
              <span class="info-value" :class="selectedPlayer.health === 'healthy' ? 'status-healthy' : 'status-injured'">
                {{ selectedPlayer.health === 'healthy' ? '健康' : '受伤' }}
              </span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3 class="section-title">分析参数</h3>
          <el-form :model="analysisForm" label-width="100px">
            <el-form-item label="分析重点">
              <el-select v-model="analysisForm.focusPoint" placeholder="请选择分析重点">
                <el-option label="伤病恢复" value="recovery" />
                <el-option label="训练负荷" value="training_load" />
                <el-option label="比赛风险" value="match_risk" />
                <el-option label="全面评估" value="comprehensive" />
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
            :disabled="!selectedPlayerId || isAnalyzing"
          >
            {{ isAnalyzing ? '分析中...' : '请求AI分析' }}
          </el-button>
        </div>
      </div>

      <!-- 右侧面板：分析结果展示 -->
      <div class="right-panel">
        <div class="analysis-title-wrapper">
          <h2 class="analysis-title">AI球员分析</h2>
        </div>
        <!-- 分析中加载状态 -->
        <div class="loading-container" v-if="isAnalyzing">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <div class="loading-text">
            <h3>AI智能分析中</h3>
            <p>正在为您的球员生成详细分析报告，请稍候...</p>
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
              <h3>{{ analysisResult.playerName }} - 分析结果</h3>
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
            <p>请选择一个球员并点击"请求AI分析"按钮</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { marked } from 'marked';
import { formatDateTime } from '../../utils/dateUtils.js';

const router = useRouter();

// 状态变量
const players = ref([]);
const selectedPlayerId = ref('');
const analysisForm = ref({
  focusPoint: '',
  specialNotes: ''
});
const isAnalyzing = ref(false);
const analysisResult = ref(null);

// 计算属性：当前选中的球员信息
const selectedPlayer = computed(() => {
  return players.value.find(p => p.id === selectedPlayerId.value);
});

// 初始化加载球员列表
onMounted(() => {
  loadPlayers();
});

// 监听选中球员变化，清除分析结果
watch(selectedPlayerId, () => {
  analysisResult.value = null;
});

// 加载球队球员列表
async function loadPlayers() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/player/list', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // 过滤掉信息不完整的球员
    players.value = (res.data.userlist || []).filter(player => 
      player.player_name && 
      player.player_number !== undefined && 
      player.age !== undefined &&
      player.height !== undefined &&
      player.weight !== undefined
    );
  } catch (err) {
    ElMessage.error('加载球员列表失败');
    console.error('加载球员列表失败:', err);
  }
}

// 请求AI分析
async function requestAnalysis() {
  if (!selectedPlayerId.value) {
    ElMessage.warning('请先选择一个球员');
    return;
  }

  isAnalyzing.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      'http://localhost:5000/api/ai/analyze-player-health',
      { playerId: selectedPlayerId.value, ...analysisForm.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.code === 0) {
      // 获取对应的球员名称
      const player = players.value.find(p => p.id === selectedPlayerId.value);
      analysisResult.value = {
        ...res.data.data,
        playerName: player?.player_name || '未知球员',
        createdAt: new Date()
      };
      ElMessage.success('球员分析成功');
    } else {
      ElMessage.error(res.data.msg || '球员分析失败');
    }
  } catch (err) {
      ElMessage.error('球员分析请求失败');
      console.error('球员分析请求失败:', err);
  } finally {
    isAnalyzing.value = false;
  }
}

// 不再使用历史记录功能

// 格式化分析结果为HTML
function formatAnalysisResult(result) {
  try {
    // 配置marked选项
    marked.setOptions({
      breaks: true, // 转换换行符为<br>
      gfm: true,    // 启用GitHub风格的Markdown
      sanitize: false, // 允许HTML标签
      headerIds: false, // 禁用自动生成id
      mangle: false     // 禁用邮件地址混淆
    });
    
    // 使用marked库解析Markdown内容
    let html = marked.parse(result);
    
    // 为标题添加自定义类名，保持与原有样式一致
    html = html.replace(/<h([1-6])>/g, '<h$1 class="result-heading">');
    
    return html;
  } catch (error) {
    console.error('Markdown渲染失败:', error);
    // 回退到简单的文本显示，如果渲染失败
    return result.replace(/\n/g, '<br>');
  }
}

// 处理历史记录删除事件
function handleHistoryDelete(id) {
  // 可以在这里添加额外的删除逻辑或状态更新
  console.log('历史记录已删除:', id);
}

// 处理历史记录刷新事件
function handleHistoryRefresh() {
  // 可以在这里添加额外的刷新逻辑
  console.log('历史记录已刷新');
}

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
    inputValue: `${analysisResult.value.playerName}分析报告_${formatDateTime(new Date())}`
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
      router.push('/');
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

.panel-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.player-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  color: #666;
  font-size: 14px;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.status-healthy {
  color: #52c41a;
  font-weight: bold;
}

.status-injured {
  color: #ff4d4f;
  font-weight: bold;
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