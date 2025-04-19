import { createRouter, createWebHistory } from "vue-router";
import FanView from '../views/fans/fan.vue'
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";

const routes = [
    { path: '/fans', component: FanView },
    { path: "/", component: Home },
    { path: "/login", component: Login }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
