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

import { pa } from "element-plus/es/locales.mjs";
import Test from "../views/test.vue";   
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
    { path: "/", component: Home },
    { path: "/login", component: Login },
    {path: "/phome", component: Phome},
    {path: "/pnotice", component: Pnotice},
    {path: "/chome", component: Chome},
    {path: "/cnotice", component: Cnotice},
    {path: "/cschedule", component: Cschedule},
    {path: "/cnotice_del", component: Cnotice_del},
    ,{path: "/test", component: Test}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/', '/login'];
  const authRequired = !publicPages.includes(to.path);
  const token = localStorage.getItem('token');

  if (authRequired && !token) {
    return next('/login');
  }

  next();
});

  
export default router;