import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '@/views/Login.vue'
import TesterWorkbench from '@/views/TesterWorkbench.vue'
import EngineerWorkbench from '@/views/EngineerWorkbench.vue'
import PrintTest from '@/views/PrintTest.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/tester-workbench',
    component: TesterWorkbench
  },
  {
    path: '/engineer-workbench',
    component: EngineerWorkbench
  },
  {
    path: '/print-test',
    component: PrintTest
  }
]

const router = new VueRouter({
  routes
})

export default router
