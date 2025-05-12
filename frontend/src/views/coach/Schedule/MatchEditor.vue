<template>
    <div class="editor-overlay" v-if="visible">
      <div class="editor-box">
        <h3>{{ title }}</h3>
        <textarea 
        v-model="inputValue" 
        placeholder="请输入..."
        @input="autoResize"
        class="auto-resize-input" 
      ></textarea>
        <div class="btn-row">
          <button @click="confirm">确定</button>
          <button @click="cancel">取消</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['visible', 'title'],
    data() {
      return {
        inputValue: ''
      };
    },
    methods: {
      autoResize(e) {
        e.target.style.height = 'auto'
        e.target.style.height = e.target.scrollHeight + 'px'
      },
      confirm() {
        this.$emit('confirm', this.inputValue)
        this.inputValue = ''
        // 重置高度
        document.querySelector('.auto-resize-input').style.height = 'auto'
      },
      cancel(){
        this.$emit('cancel'),
        this.inputValue = ''
      }
    }
  };
  </script>
  
  <style scoped>
  .editor-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .editor-box {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 280px;
    text-align: center;
  }
  
  .editor-box input {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    font-size: 14px;
  }
  
  .btn-row {
    display: flex;
    justify-content: space-around;
  }

  .btn-row button {
    padding: 8px 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 45px;
    cursor: pointer;
    margin-right: 10px;
    margin-bottom: 10px;
  }
  .btn-row button:hover {
  background-color: #2980b9;
}
.auto-resize-input {
  width: 100%;
  min-height: 40px;  /* 初始高度 */
  max-height: 200px; /* 最大高度 */
  padding: 8px;
  margin: 10px 0;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;       /* 禁止手动调整 */
  overflow-y: hidden; /* 隐藏滚动条 */
  transition: height 0.2s;
}
  </style>
  