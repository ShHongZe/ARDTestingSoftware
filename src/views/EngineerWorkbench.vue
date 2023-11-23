<template>
  <div class="container">
    <div class="header">
      <div class="header-left">工程师工作台</div>
      <div class="header-right" @click="logOut">登出</div>
    </div>

    <div class="main">
      <div class="basic-configuration-card">
        <el-card>
          <div slot="header">
            <span class="card-title">基础配置</span>
          </div>
          <div>
            <el-checkbox-group v-model="featureList">
              <el-checkbox label="扫码" border></el-checkbox>
              <el-checkbox label="打印" border></el-checkbox>
            </el-checkbox-group>
          </div>
          <div v-if="featureList.includes('扫码')">
            <el-divider></el-divider>
            <div v-for="(_, index) in barcodeList" :key="index" class="barcode-data-container">
              <el-input class="data-item" v-model="barcodeList[index]" placeholder="请输入条形码数据"></el-input>
              <el-button type="danger" plain id="delete-barcode-data-button" @click="deleteBarcodeData(index)">
                删除</el-button>
            </div>
            <el-button type="primary" plain id="add-barcode-data-button" @click="addBarcodeData">
              添加条形码数据
            </el-button>
          </div>
        </el-card>
      </div>

      <div class="workflow-configuration-card">
        <el-card>
          <div slot="header">
            <span class="card-title">流程配置</span>
          </div>
          <div>
            <div v-for="(item, index) in processList" :key="index" class="test-step-container">
              <el-cascader class="step-item" v-model="item.channel" placeholder="请选择通道" 
                :options="options" :props="props" @change="handleChannelChange(index)"></el-cascader>
              <el-input class="step-item" v-model="item.standardValue" placeholder="请输入标准值" 
                :disabled="item.disabled"></el-input>
              <el-input class="step-item" v-model="item.delay" placeholder="请输入延时">
              </el-input>
              <el-button class="step-item-button" type="danger" plain 
                id="delete-test-step-button" @click="deleteTestStep(index)">
                删除</el-button>
            </div>
            <el-button type="primary" plain id="add-test-step-button" @click="addTestStep">
              添加测试步骤
            </el-button>
          </div>
        </el-card>
      </div>

      <div class="configuration-area">
        <div class="configuration-area-input">
          <el-input placeholder="请输入测试方案名" v-model="testScheme" clearable>
          </el-input>
        </div>
        <el-button type="success" plain 
          id="generate-test-scheme-button" @click="generateTestScheme" :disabled="!testScheme.trim()">
          生成测试方案</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { channelOptions } from '@/channelOptions'
import { showMessageBox, showMessage } from '@/utils'
import { ipcRenderer } from 'electron'
export default {
  data() {
    return {
      featureList: [],
      barcodeList: [],
      processList: [],
      testScheme: '',
      options: channelOptions,
      props: {
        value: 'value',
        label: 'label',
        children: 'children'
      }
    }
  },
  methods: {
    logOut() {
      this.$router.replace({path: '/login'})
    },

    addTestStep() {
      document.getElementById("add-test-step-button").blur()
      // const defaultStep = { channel: '', standardValue: '', delay: '0' }
      const defaultStep = { channel: '', standardValue: '', delay: '0', disabled: false }
      if (this.processList.length === 0 || !this.hasEmptyProperty()) {
        this.processList.push({ ...defaultStep })
      } else {
        showMessageBox('请确保已添加测试步骤信息不存在空白后继续')
      }
      this.$nextTick(() => {
        const container = document.querySelector('.main')
        container.scrollTop = container.scrollHeight
      })
    },

    hasEmptyProperty() {
      return this.processList.some(step => Object.values(step).some(value => value === ''))
    },

    deleteTestStep(index) {
      const activeElement = document.activeElement
      if (activeElement.tagName === "BUTTON" && activeElement.getAttribute("id") === "delete-test-step-button") {
        activeElement.blur()
      }
      this.processList.splice(index, 1)
    },

    addBarcodeData() {
      document.getElementById("add-barcode-data-button").blur()
      const defaultBarcode = ""
      if (this.barcodeList.length === 0 || !this.hasEmptyBarcode()) {
        this.barcodeList.push(defaultBarcode)
      } else {
        showMessageBox('请确保已添加条形码数据不存在空白后继续')
      }
    },

    hasEmptyBarcode() {
      return this.barcodeList.some(barcode => barcode.trim() === '')
    },

    deleteBarcodeData(index) {
      const activeElement = document.activeElement
      if (activeElement.tagName === "BUTTON" && activeElement.getAttribute("id") === "delete-barcode-data-button") {
        activeElement.blur()
      }
      this.barcodeList.splice(index, 1)
    },

    generateTestScheme() {
      document.getElementById("generate-test-scheme-button").blur()
      ipcRenderer.removeAllListeners('generate-test-scheme-response')
      if (this.dataCheck()) {
        ipcRenderer.send('generate-test-scheme-request', {
          featureList: this.featureList,
          barcodeList: this.barcodeList,
          processList: this.processList,
          testScheme: this.testScheme
        })
        ipcRenderer.on('generate-test-scheme-response', (event, response) => {
          if (response.status === 'success') {
            showMessage(response.message, 'success')
            this.featureList = []
            this.barcodeList = []
            this.processList = []
            this.testScheme = ''
          } else if (response.status === 'canceled') {
            showMessage(response.message, 'warning')
          } else {
            showMessageBox(response.message)
          }
        })
      }
    },

    dataCheck() {
      if (this.featureList.includes('扫码') && this.barcodeList.length === 0) {
        showMessageBox('请添加至少一个条形码数据')
        return false
      }
      if (this.processList.length === 0) {
        showMessageBox('请添加至少一个测试步骤')
        return false
      }
      if (this.barcodeList.length > 0 && this.hasEmptyBarcode()) {
        showMessageBox('请确保已添加条形码数据不存在空白后继续')
        return false
      }
      if (this.processList.length > 0 && this.hasEmptyProperty()) {
        showMessageBox('请确保已添加测试步骤信息不存在空白后继续')
        return false
      }
      return true
    },

    handleChannelChange(index) {
      if (this.processList[index].channel.includes('49') && this.processList[index].channel.length === 1) {
        this.processList[index].disabled = true
        this.processList[index].standardValue = '获取展示'
      } else {
        this.processList[index].disabled = false
        this.processList[index].standardValue = ''
      }
    }
  },

  watch: {
    featureList: {
      handler(newVal, oldVal) {
        if (!newVal.includes('扫码') && oldVal.includes('扫码')) {
          this.barcodeList = []
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid lightgray;
}

.header-left {
  margin-left: 25px;
  font-size: 30px;
  font-weight: bold;
  font-family: monospace;
}

.header-right {
  margin-right: 25px;
  cursor: pointer;
  font-size: 20px;
  font-family: monospace;
}

.main {
  overflow-y: auto;
  /* max-height: calc(100vh - 60px); */
  /* border: 1px solid blue; */
  flex: 1;
  padding: 50px;
}

.basic-configuration-card,
.workflow-configuration-card {
  margin-bottom: 40px;
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  font-family: monospace;
}

.configuration-area {
  display: flex;
  flex-direction: row;
  /* border: 1px solid black; */
}

.configuration-area-input {
  width: 30%;
  margin-right: 60px;
}

.test-step-container {
  display: flex;
  justify-content: space-between;
  padding-bottom: 15px;
}

.step-item {
  width: 25%;
  padding-right: 30px;
}

.step-item-button {
  flex: 1;
}

.barcode-data-container {
  display: flex;
  padding-bottom: 15px;
}

.data-item {
  width: 25%;
  padding-right: 30px;
}
</style>
