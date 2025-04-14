import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
//导入球员界面
import Phome from "../views/player/Phome.vue";
import Pnotice from "../views/player/Pnotice.vue";

//导入教练界面
import Chome from "../views/coach/Chome.vue";
import Cnotice from "../views/coach/Notice/Cnotice.vue";
import Cschedule from "../views/coach/Schedule/Cschedule.vue";


const routes = [
    { path: "/", component: Home },
    { path: "/login", component: Login },
    {path: "/phome", component: Phome},
    {path: "/pnotice", component: Pnotice},
    {path: "/chome", component: Chome},
    {path: "/cnotice", component: Cnotice},
    ,{path: "/cschedule", component: Cschedule}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;