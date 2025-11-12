import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from '../views/Login.vue';
import Review from '../views/coach/Review.vue'

//导入Element Plus消息提示组件
import { ElMessage } from 'element-plus';

//导入论坛界面
import Forum from "../views/forum.vue";
import ForumDetail from "../views/forumDetail.vue";

//导入球迷界面
import Fhome from "../views/fans/Fhome.vue";
import Fnotice from "../views/fans/Fnotice.vue";
import Stats from "../views/fans/TeamStats.vue";
import MatchDetail from "../views/fans/MatchDetail.vue";

//导入球员界面
import Phome from "../views/player/Phome.vue";
import Pnotice from "../views/player/Pnotice.vue";
import Pschedule from "../views/player/Schedule/Pschedule.vue";
import PtacticBoard from "../views/player/TacticBoard/PtacticBoard.vue";

//导入教练界面
import Chome from "../views/coach/Chome.vue";
import Cnotice from "../views/coach/Notice/Cnotice.vue";
import Cschedule from "../views/coach/Schedule/Cschedule.vue";
import Cnotice_del from "../views/coach/Notice/Cnotice_del.vue";
import Ctest from "../views/coach/Ctest.vue";
import CtacticBoard from "../views/coach/TacticBoard/CtacticBoard.vue";
import CtacticCanvas from "../views/coach/TacticCanvas/CtacticCanvas.vue";
import ManageTeam from "../views/coach/ManageTeam/ManageTeam.vue";

//导入经理界面
import Mhome from "../views/manager/Mhome.vue";
import Mnotice from "../views/manager/Notice/Mnotice.vue";
import Mnotice_del from "../views/manager/Notice/Mnotice_del.vue";
import Mmatch from "../views/manager/Match/Mmatch.vue";
import Mfinance from "../views/manager/Finance/Mfinance.vue";
import Mhonor from "../views/manager/Honor/Mhonor.vue";

//导入队医界面
import Dhome from "../views/medic/Dhome.vue";
import Dnotice from "../views/medic/Notice/Dnotice.vue";
import Dnotice_del from "../views/medic/Notice/Dnotice_del.vue";
import Dinjury from "../views/medic/injury.vue";

//导入AI分析界面
import TacticAnalysis from "../views/ai/TacticAnalysis.vue";
import PlayerHealthAnalysis from "../views/ai/PlayerHealthAnalysis.vue";
import AiQaPage from "../views/ai/AiQaPage.vue";

const routes = [
  // 公共路由
  { path: "/", component: Home },
  { path: '/login', component: Login },
  
  // 论坛相关路由
  { path: '/forum', component: Forum },
  { path: '/forum/:id', component: ForumDetail },
  
  // 球迷相关路由
  { path: '/fhome', component: Fhome },
  { path: '/fnotice', component: Fnotice },
  { path: '/teamstats', component: Stats },
  { path: '/matchDetail/:id', component: MatchDetail },
  
  // 经理相关路由
  { path: '/mhome', component: Mhome },
  { path: '/mnotice', component: Mnotice },
  { path: '/mnotice_del', component: Mnotice_del },
  { path: '/matchToday', component: Mmatch },
  { path: '/mfinance', component: Mfinance },
  { path: '/mhonor', component: Mhonor },
  
  // 队医相关路由
  { path: '/dhome', component: Dhome },
  { path: '/dnotice', component: Dnotice },
  { path: '/dnotice_del', component: Dnotice_del },
  { path: '/injury', component: Dinjury },
  // 队医教练AI分析路由
  { path: '/medic/ai-health', name: 'PlayerHealthAnalysis', component: PlayerHealthAnalysis, meta: { requireAuth: true, roles: ['medic', 'coach'] } },
  
  // 球员相关路由
  { path: "/phome", component: Phome },
  { path: "/pnotice", component: Pnotice },
  { path: "/ptacticboard", component: PtacticBoard },
  { path: "/pschedule", component: Pschedule },
  
  // 教练相关路由
  { path: "/chome", component: Chome },
  { path: "/cnotice", component: Cnotice },
  { path: "/cschedule", component: Cschedule },
  { path: "/cnotice_del", component: Cnotice_del },
  { path: "/ctest", component: Ctest },
  { path: "/ctacticboard", component: CtacticBoard },
  { path: "/ctacticcanvas", component: CtacticCanvas },
  { path: "/cmanageTeam", component: ManageTeam },
  { path: '/chome/review', component: Review },
  // 教练AI分析路由
  { path: '/coach/ai-tactic', name: 'TacticAnalysis', component: TacticAnalysis, meta: { requireAuth: true, roles: ['coach'] } },
  // 独立的AI问答页面，所有用户均可访问
  { path: '/ai/qa', name: 'AiQaPage', component: AiQaPage, meta: { requireAuth: true } },
  
  // 懒加载的教练路由
  // { path: '/coach/forum', name: 'Cforum', component: () => import('@/views/coach/forum/Cforum.vue'), meta: { requireAuth: true, roles: ['coach'] } },
  // { path: '/coach/team', name: 'Cteam', component: () => import('@/views/coach/team/Cteam.vue'), meta: { requireAuth: true, roles: ['coach'] } },
  // { path: '/coach/player', name: 'Cplayer', component: () => import('@/views/coach/player/Cplayer.vue'), meta: { requireAuth: true, roles: ['coach'] } },
  // { path: '/coach/tactic', name: 'Ctactic', component: () => import('@/views/coach/tactic/Ctactic.vue'), meta: { requireAuth: true, roles: ['coach'] } },
  // { path: '/coach/match', name: 'Cmatch', component: () => import('@/views/coach/match/Cmatch.vue'), meta: { requireAuth: true, roles: ['coach'] } },
  // { path: '/coach/statistic', name: 'Cstatistic', component: () => import('@/views/coach/statistic/Cstatistic.vue'), meta: { requireAuth: true, roles: ['coach'] } }
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

    if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      // 跳转目标需要特定身份，但用户身份不符
      ElMessage.error("无权访问该页面");
      return next("/login");
    }
  }

  next();
});
  
export default router;