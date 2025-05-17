import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css"; 
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { Pointer } from '@element-plus/icons-vue'
import { createHead } from '@vueuse/head'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faPen, faEraser } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faPen, faEraser)

// 先创建 app
const app = createApp(App);
const head = createHead()
// 使用插件
app.use(ElementPlus);
app.use(router);
app.use(createPinia());
app.use(Antd);
app.component('Pointer', Pointer)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(head);
// 挂载
app.mount("#app");
