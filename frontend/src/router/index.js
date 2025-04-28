import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from '../views/Login.vue';
import Fan from '../views/fans/fan.vue';
import Manager from '../views/manager/manager.vue';
import Medic from '../views/medic/medic.vue';
import Review from '../views/coach/Review.vue'
//导入球员界面
import Phome from "../views/player/Phome.vue";
import Pnotice from "../views/player/Pnotice.vue";

//导入教练界面
import Chome from "../views/coach/Chome.vue";
import Cnotice from "../views/coach/Notice/Cnotice.vue";
import Cschedule from "../views/coach/Schedule/Cschedule.vue";
import Cnotice_del from "../views/coach/Notice/Cnotice_del.vue";
import Edit_training from "../views/coach/Schedule/Edit_training.vue";
import Edit_match from "../views/coach/Schedule/Edit_match.vue";
import { pa } from "element-plus/es/locales.mjs";
const routes = [
  { path: "/", component: Home },
  { path: '/login', component: Login },
  { path: '/fans', component: Fan },
  { path: '/manager', component: Manager },
  { path: '/medic', component: Medic },
  { path: '/chome/review', component: Review },
  { path: "/phome", component: Phome},
  { path: "/pnotice", component: Pnotice},
  { path: "/chome", component: Chome},
  { path: "/cnotice", component: Cnotice},
  { path: "/cschedule", component: Cschedule},
  { path: "/cnotice_del", component: Cnotice_del},
  { path: "/edit_training", component: Edit_training},
  { path: "/edit_match", component: Edit_match}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


// 解析 JWT token
function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (err) {
    console.error("Token解析失败", err);
    return {};
  }
}

// 🔥 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/" && to.path !== "/login") {
    // 未登录访问保护页面，跳回登录
    ElMessage.error("请先登录");
    return next("/login");
  }

  if (token) {
    const payload = parseJwt(token);
    const userId = payload.userId;
    const userRole = payload.type;

    console.log(`🛡️ 当前用户 ID: ${userId}`);
    console.log(`🛡️ 当前用户身份: ${userRole}`);

    if (to.meta.role && userRole !== to.meta.role) {
      // 跳转目标需要特定身份，但用户身份不符
      ElMessage.error("无权访问该页面");
      return next("/login");
    }
  }

  next();
});
  
export default router;