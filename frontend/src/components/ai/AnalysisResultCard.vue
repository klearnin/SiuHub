<template>
  <div class="analysis-result-card">
    <div class="result-header">
      <h3 class="result-title">{{ title }}</h3>
      <span class="result-time">{{ formatDateTime(createdAt) }}</span>
    </div>
    <div class="result-content" v-html="formattedContent"></div>
    <div class="result-footer" v-if="showActions">
      <el-button link @click="onCopy" size="small">复制</el-button>
      <el-button link @click="onSave" size="small">保存</el-button>
      <el-button link @click="onPrint" size="small">打印</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatDateTime } from '../../utils/dateUtils.js';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '分析结果'
  },
  content: {
    type: String,
    default: ''
  },
  createdAt: {
    type: [Date, String],
    default: () => new Date()
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['copy', 'save', 'print']);

// 格式化内容为HTML
const formattedContent = computed(() => {
  if (!props.content) return '<p class="empty-content">暂无内容</p>';
  
  // 简单的Markdown风格格式化
  let html = props.content
    .replace(/^# (.*$)/gm, '<h4 class="heading-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h5 class="heading-2">$1</h5>')
    .replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>')
    .replace(/\n/g, '<br>');
  
  // 合并相邻的列表标签
  html = html
    .replace(/<\/ul>\s*<ul>/gm, '')
    .replace(/<\/ol>\s*<ol>/gm, '');
  
  return html;
});

// 复用通用日期格式化工具函数
// 直接使用 formatDateTime 不需要额外的别名

// 复制内容到剪贴板
function onCopy() {
  if (!props.content) {
    ElMessage.warning('没有可复制的内容');
    return;
  }
  
  navigator.clipboard.writeText(props.content).then(() => {
    ElMessage.success('内容已复制到剪贴板');
    emit('copy');
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
}

// 保存内容
function onSave() {
  if (!props.content) {
    ElMessage.warning('没有可保存的内容');
    return;
  }
  
  ElMessageBox.prompt('请输入保存名称', '保存分析结果', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: `${props.title}_${formatDateTime(new Date())}`
  }).then(({ value }) => {
    // 创建并下载文本文件
    const blob = new Blob([props.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${value}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    ElMessage.success('保存成功');
    emit('save', { name: value, content: props.content });
  }).catch(() => {
    // 用户取消保存
  });
}

// 打印内容
function onPrint() {
  if (!props.content) {
    ElMessage.warning('没有可打印的内容');
    return;
  }
  
  // 创建临时打印窗口
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${props.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1, h2, h3, h4, h5 { color: #333; }
          ul, ol { padding-left: 20px; }
          .print-time { text-align: right; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${props.title}</h1>
        <div class="print-time">生成时间：${formatDateTime(props.createdAt)}</div>
        <hr>
        ${formattedContent.value}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  
  emit('print');
}
</script>

<style scoped>
.analysis-result-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.result-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.result-time {
  font-size: 12px;
  color: #999;
}

.result-content {
  flex: 1;
  overflow-y: auto;
  line-height: 1.8;
  color: #333;
  padding: 5px 0;
}

.result-content p {
  margin: 10px 0;
}

.heading-1 {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
  margin: 15px 0 10px 0;
}

.heading-2 {
  font-size: 15px;
  font-weight: bold;
  color: #52c41a;
  margin: 12px 0 8px 0;
}

.result-content ul,
.result-content ol {
  margin: 10px 0;
  padding-left: 20px;
}

.result-content li {
  margin: 5px 0;
}

.empty-content {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.result-footer {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analysis-result-card {
    padding: 15px;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .result-title {
    font-size: 16px;
  }
  
  .result-footer {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>