// 日期格式化工具函数

/**
 * 格式化日期为标准格式 YYYY-MM-DD HH:mm
 * @param {string|Date|number} date - 日期值（字符串、Date对象或时间戳）
 * @param {string} format - 输出格式模板，默认为 'YYYY-MM-DD HH:mm'
 * @param {boolean} useUTC - 是否使用UTC时间，默认为false（使用本地时间）
 * @returns {string} 格式化后的日期字符串或错误提示
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm', useUTC = false) {
  console.log('dateUtils.formatDateTime - 原始日期:', date, '类型:', typeof date);
  
  if (!date) {
    console.log('dateUtils.formatDateTime - 日期为空');
    return '';
  }
  
  try {
    // 确保日期格式标准化
    let dateValue = processDateValue(date);
    const d = new Date(dateValue);
    
    console.log('dateUtils.formatDateTime - Date对象创建结果:', d);
    
    // 检查日期是否有效
    if (isNaN(d.getTime())) {
      console.error('dateUtils.formatDateTime - 创建的日期无效');
      return '无效日期';
    }
    
    // 提取日期组件，根据useUTC参数决定使用本地时间还是UTC时间
    const year = useUTC ? d.getUTCFullYear() : d.getFullYear();
    const month = String((useUTC ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
    const day = String(useUTC ? d.getUTCDate() : d.getDate()).padStart(2, '0');
    const hours = String(useUTC ? d.getUTCHours() : d.getHours()).padStart(2, '0');
    const minutes = String(useUTC ? d.getUTCMinutes() : d.getMinutes()).padStart(2, '0');
    const seconds = String(useUTC ? d.getUTCSeconds() : d.getSeconds()).padStart(2, '0');
    
    // 根据格式模板替换
    const formattedDate = format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
    
    console.log('dateUtils.formatDateTime - 格式化成功:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('dateUtils.formatDateTime - 日期格式化失败:', error, '原始日期:', date);
    return '日期格式错误';
  }
}

/**
 * 处理不同类型的日期输入，确保可以被正确解析
 * @param {string|Date|number} dateValue - 原始日期值
 * @returns {string|Date|number} 处理后的日期值
 */
function processDateValue(dateValue) {
  // 如果已经是Date对象或时间戳，直接返回
  if (dateValue instanceof Date || typeof dateValue === 'number') {
    return dateValue;
  }
  
  // 处理字符串类型的日期
  if (typeof dateValue === 'string') {
    // 清理可能的空白字符
    dateValue = dateValue.trim();
    
    // 处理ISO 8601格式
    if (dateValue.includes('T')) {
      // 标准ISO格式处理: 2023-04-20T12:34:56Z 或 2023-04-20T12:34:56.789Z
      if (dateValue.endsWith('Z')) {
        return dateValue.replace('Z', '+00:00'); // 转换为带有时区的格式
      }
      
      // 处理已有时区的ISO格式: 2023-04-20T12:34:56+08:00
      if (dateValue.includes('+') || dateValue.includes('-')) {
        return dateValue;
      }
    }
    
    // 处理MySQL日期格式: 2023-04-20 12:34:56
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // 处理简化日期格式: 2023-04-20
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue + ' 00:00:00';
    }
    
    // 处理斜杠分隔的日期格式: 2023/04/20
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateValue)) {
      return dateValue.replace(/\//g, '-') + ' 00:00:00';
    }
    
    // 尝试直接返回字符串，让Date构造函数尝试解析
    return dateValue;
  }
  
  return dateValue;
}

/**
 * 检查日期是否有效
 * @param {string|Date|number} date - 要检查的日期
 * @returns {boolean} 日期是否有效
 */
export function isValidDate(date) {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * 获取相对时间描述（例如：3分钟前、2小时前、1天前）
 * @param {string|Date|number} date - 日期值
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!isValidDate(date)) {
    return '无效日期';
  }
  
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  } else {
    // 超过一周显示具体日期
    return formatDateTime(date);
  }
}