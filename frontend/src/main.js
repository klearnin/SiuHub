import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css"; 
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { Pointer } from '@element-plus/icons-vue'


// 先创建 app
const app = createApp(App);

// 使用插件
app.use(ElementPlus);
app.use(router);
app.use(createPinia());
app.use(Antd);
app.component('Pointer', Pointer)

// 挂载
app.mount("#app");
