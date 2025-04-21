import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from '../views/Login.vue';
import Fan from '../views/fans/fan.vue';
import Coach from '../views/coach/coach.vue';
import Player from '../views/player/player.vue';
import Manager from '../views/manager/manager.vue';
import Medic from '../views/medic/medic.vue';

const routes = [
  { path: "/", component: Home },
  { path: '/login', component: Login },
  { path: '/fans', component: Fan },
  { path: '/coach', component: Coach },
  { path: '/player', component: Player },
  { path: '/manager', component: Manager },
  { path: '/medic', component: Medic },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// //路由守卫：登录后才能访问角色页面,检查是否有 token，没有就跳转登录页：
// router.beforeEach((to, from, next) => {
//     const publicPages = ['/', '/login'];
//     const authRequired = !publicPages.includes(to.path);
//     const token = localStorage.getItem('token');
  
//     if (authRequired && !token) {
//       return next('/');
//     }
  
//     next();
//   });
  
export default router;
