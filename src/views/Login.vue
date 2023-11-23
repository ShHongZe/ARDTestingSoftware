<template>
  <div class="container">
    <div class="login-container">
      <div class="login-title">
        <span>慧灵 ARD 测试软件</span>
        <span>登录</span>
      </div>

      <div class="login-prompt">
        <span>工程师 - engineer</span>
        <span>测试员 - tester</span>
        <span>打印服务 POSTEK Browser Print Server</span>
      </div>

      <div class="login-input">
        <el-input v-model="role" clearable>
          <template slot="prepend"><i class="el-icon-user"></i></template>
        </el-input>
      </div>

      <el-button type="primary" id="login-button" @click="logIn">
        登录
      </el-button>
    </div>
  </div>
</template>

<script>
import { showMessage } from '@/utils'
export default {
  data() {
    return {
      role: ''
    }
  },
  methods: {
    logIn() {
      document.getElementById('login-button').blur()
      if (this.role === 'engineer') {
        this.$router.replace({path: '/engineer-workbench'})
      } else if (this.role === 'tester') {
        this.$router.replace({path: '/tester-workbench'})
      } else if (this.role === 'print') {
        this.$router.replace({path: '/print-test'})
      } else {
        showMessage('登录提交有误，请重试', 'error')
        this.role = ''
      }
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  /* border: 1px solid red; */
  width: 350px;
}

.login-title {
  display: flex;
  flex-direction: column;
  font-size: 30px;
  font-weight: bold;
  font-family: monospace;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  /* font-weight: bold; */
  font-family: 'Courier New', Courier, monospace;
  margin: 20px 0px;
}

#login-button {
  margin-top: 20px;
  width: 100%;
}
</style>
