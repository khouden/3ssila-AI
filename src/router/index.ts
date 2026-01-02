import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";
import HistoryView from "../views/HistoryView.vue";
import { auth } from "../stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView as any,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView as any,
  },
  {
    path: "/signup",
    name: "signup",
    component: SignupView as any,
  },
  {
    path: "/history",
    name: "history",
    component: HistoryView as any,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Redirect authenticated users away from login/signup pages
router.beforeEach((to, _from, next) => {
  if (auth.isAuthenticated() && (to.name === "login" || to.name === "signup")) {
    next("/");
  } else {
    next();
  }
});

export default router;
