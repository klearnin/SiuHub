<template>
  <div class="history-list">
    <div class="list-header" v-if="title">
      <h3>{{ title }}</h3>
      <el-button link size="small" @click="refreshList">刷新</el-button>
    </div>
    
    <div class="list-content">
      <el-table 
        :data="historyData" 
        style="width: 100%"
        v-loading="loading"
        :empty-text="emptyText || '暂无历史记录'"
        border
        :header-cell-style="{ backgroundColor: '#fafafa' }"
      >
        <el-table-column prop="title" label="分析标题" width="200" :show-overflow-tooltip="true">
          <template #default="scope">
            <span class="analysis-title">{{ scope.row.title || scope.row.playerName || '未命名分析' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="分析类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180" :formatter="formatDate" />
        
        <el-table-column prop="user_name" label="创建人" width="120" />
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button link size="small" @click="handleDelete(scope.row.id)" danger>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="list-footer" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { formatDateTime } from '../../utils/dateUtils.js';

// Props
const props = defineProps({
  type: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '分析历史'
  },
  emptyText: {
    type: String,
    default: ''
  },
  immediateLoad: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['view', 'delete', 'refresh']);

// 状态变量
const historyData = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 初始化加载数据
onMounted(() => {
  if (props.immediateLoad) {
    loadHistoryData();
  }
});

// 监听分析类型变化
watch(() => props.type, () => {
  currentPage.value = 1;
  loadHistoryData();
});

// 加载历史数据
async function loadHistoryData() {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams();
    if (props.type) {
      urlParams.append('type', props.type);
    }
    urlParams.append('page', currentPage.value);
    urlParams.append('pageSize', pageSize.value);
    
    const res = await axios.get(`http://localhost:5000/api/ai/history?${urlParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data.code === 0) {
      historyData.value = res.data.data || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.data.msg || '加载历史记录失败');
    }
  } catch (err) {
    ElMessage.error('加载历史记录请求失败');
    console.error('加载历史记录请求失败:', err);
  } finally {
    loading.value = false;
  }
}

// 刷新列表
function refreshList() {
  currentPage.value = 1;
  loadHistoryData();
  emit('refresh');
}

// 查看历史记录
function handleView(item) {
  emit('view', item);
}

// 删除历史记录
function handleDelete(id) {
  ElMessageBox.confirm('确定要删除这条历史记录吗？删除后无法恢复。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/ai/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.code === 0) {
        ElMessage.success('删除成功');
        loadHistoryData();
        emit('delete', id);
      } else {
        ElMessage.error(res.data.msg || '删除失败');
      }
    } catch (err) {
      ElMessage.error('删除请求失败');
      console.error('删除请求失败:', err);
    }
  }).catch(() => {
    // 用户取消删除
  });
}

// 分页处理函数
function handleSizeChange(newSize) {
  pageSize.value = newSize;
  loadHistoryData();
}

function handleCurrentChange(newPage) {
  currentPage.value = newPage;
  loadHistoryData();
}

// 获取分析类型标签样式
function getTypeTagType(type) {
  const typeMap = {
    'tactic': 'primary',
    'player_health': 'success',
    'team_analysis': 'warning',
    'match_analysis': 'danger'
  };
  return typeMap[type] || 'info';
}

// 获取分析类型标签文本
function getTypeLabel(type) {
  const typeMap = {
    'tactic': '战术分析',
    'player_health': '球员健康',
    'team_analysis': '球队分析',
    'match_analysis': '比赛分析'
  };
  return typeMap[type] || '其他分析';
}

// 格式化日期
function formatDate(row, column, cellValue) {
  // 使用通用日期格式化工具函数
  return formatDateTime(cellValue);
}

// 暴露方法给父组件
defineExpose({
  refreshList,
  loadHistoryData
});
</script>

<style scoped>
.history-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.list-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-content >>> .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-content >>> .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto;
}

.analysis-title {
  font-weight: 500;
  color: #1890ff;
}

.list-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-list {
    padding: 15px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .list-footer {
    padding-top: 10px;
  }
  
  .list-footer >>> .el-pagination {
    font-size: 12px;
  }
  
  /* 在小屏幕上隐藏部分列 */
  .list-content >>> .el-table-column--120,
  .list-content >>> .el-table-column--150 {
    display: none;
  }
}
</style>