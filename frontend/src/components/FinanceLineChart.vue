<!-- src/components/FinanceLineChart.vue -->
<template>
  <div ref="chartRef" style="width: 100%; height: 300px;"></div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: Array
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '资金变动趋势',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.created_at.split('T')[0])
    },
    yAxis: {
      type: 'value',
      name: '余额'
    },
    series: [
      {
        name: '余额',
        type: 'line',
        data: props.data.map(item => item.balance)
      }
    ]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  renderChart()
})

watch(() => props.data, () => {
  renderChart()
})
</script>
