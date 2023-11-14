<template>
  <div class="container">
    <div class="header">
      <div class="header-left">
        测试员工作台
      </div>
      <div class="header-right" @click="logOut">
        登出
      </div>
    </div>

    <div class="main">
      <div class="main-content">
        <div class="test-scheme-selection-container">
          <el-button 
            id="select-test-scheme-button" 
            type="primary" 
            plain 
            @click="selectTestScheme"
            :disabled="selectButtonDisabled">
            选择测试方案
          </el-button>
          <el-tag :type="testScheme ? 'success' : 'info'" effect="plain" style="margin: 0px 30px;">
            {{ testScheme ? testScheme : '暂未选择' }}
          </el-tag>
          <el-button 
            plain 
            type="info" 
            v-if="enterVerificationButtonShow"
            id="enter-verification-button"
            @click="enterVerification">
            产品条形码验证
          </el-button>
        </div>

        <div class="serial-card-container" v-if="serialCardShow">
          <el-card>
            <div class="serial-card-content">
              <div class="serial-card-content-select">
                <span>串口</span>
                <el-select 
                  v-model="selectedSerialPort" 
                  placeholder="请选择" 
                  @visible-change="fetchSerialPort"
                  :disabled="selectDisabled">
                  <el-option v-for="(item, index) in serialPortList" :key="index" :label="item.path" :value="item.path">
                  </el-option>
                </el-select>
              </div>
              <div class="serial-card-content-switch">
                <span>通信测试</span>
                <el-switch 
                  v-model="switchValue" 
                  active-color="#13ce66" 
                  @change="handleSwitchChange"
                  :disabled="switchDisabled">
                </el-switch>
              </div>
              <div class="serial-card-content-button">
                <el-button 
                  type="success" 
                  plain 
                  id="open-test-button"
                  :disabled="testButtonDisabled"
                  @click="openTest">
                  开启测试
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <div class="test-result-card-container" v-if="testResultCardShow">
          <el-card>
            <el-table border :data="testResult">
              <el-table-column label="通道" prop="channel" align="center">
              </el-table-column>
              <el-table-column label="标准值" prop="standardValue" align="center">
              </el-table-column>
              <el-table-column label="测试值" prop="testValue" align="center">
              </el-table-column>
              <el-table-column label="对比结果" prop="valueComparison" align="center">
                <template slot-scope="scope">
                  <el-tag
                    v-if="scope.row.valueComparison"
                    :type="scope.row.valueComparison === '对比通过' ? 'success' : 'danger'"
                    effect="dark">
                    {{ scope.row.valueComparison }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </div>

    <el-drawer
      :visible.sync="scanDrawer"
      direction="ltr"
      size="50%"
      :show-close="false"
      :close-on-press-escape="false"
      :wrapperClosable="false"
      :withHeader="false"
      @opened="setFocusOnInput">
      <div class="scan-drawer-container">
        <div class="drawer-button-container">
          <el-button plain type="info" id="reset-verification-button" @click="handleResetVerificationClick">
            重置验证
          </el-button>
          <el-button plain type="danger" id="exit-verification-button" @click="exitVerification">
            退出验证
          </el-button>
        </div>
        <div class="drawer-input-container">
          <el-input 
            v-model="scanBarcode" 
            ref="barcodeInput" 
            @change="barcodeCompare" 
            :placeholder="`${currentIndex + 1}`">
          </el-input>
        </div>
        <div class="drawer-table-container">
          <el-table border :data="barcodeList">
            <el-table-column label="对照条形码" align="center">
              <template slot-scope="scope">
                {{ scope.row }}
              </template>
            </el-table-column>
            <el-table-column label="验证结果" align="center">
              <template slot-scope="scope">
                <el-tag 
                  v-if="compareResultList[scope.$index]" 
                  :type="compareResultList[scope.$index] === '成功' ? 'success' : 'danger'"
                  size="small"
                  effect="dark">
                  {{ compareResultList[scope.$index] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
import { showMessage, showMessageBox, isWithinRange, isNumericOrFloat } from '@/utils.js'
import { channelArray } from '@/channelOptions'
export default {
  data() {
    return {
      showMessageBoxTitle: '提示',
      testScheme: '',
      featureList: [],
      barcodeList: [],
      processList: [],
      scanDrawer: false,
      scanBarcode: '',
      currentIndex: 0,
      compareResultList: [],
      selectedSerialPort: '',
      serialPortList: [],
      switchValue: false,
      serialPort: null,
      selectButtonDisabled: false,
      selectDisabled: false,
      switchDisabled: false,
      testButtonDisabled: true,
      serialCardShow: false,
      enterVerificationButtonShow: false,
      testResult: [],
      testResultCardShow: false,
      enableScanner: false,
      enablePrinter: false,
      passFlag: 0
    }
  },

  methods: {
    logOut() {
      this.$router.replace({
        path: '/login'
      })
    },

    selectTestScheme() {
      document.getElementById('select-test-scheme-button').blur()
      // this.switchHandle()
      ipcRenderer.removeAllListeners('select-test-scheme-response')
      ipcRenderer.send('select-test-scheme-request')
      ipcRenderer.on('select-test-scheme-response', (event, response) => {
        switch (response.status) {
          case 'success':
            showMessage(response.message, 'success')
            this.testScheme = response.fileName
            const fileContentObject = JSON.parse(response.fileContent)
            this.featureList = fileContentObject.featureList
            this.barcodeList = fileContentObject.barcodeList
            this.processList = fileContentObject.processList
            this.statusReset()
            if (this.featureList.includes('print')) {
              this.enablePrinter = true
            } else {
              this.enablePrinter = false
            }
            if (this.featureList.includes('scan')) {
              this.enableScanner = true
              this.scanDrawer = !this.scanDrawer
            } else {
              this.enableScanner = false
              this.serialCardShow = true
            }
            break
          case 'error':
            showMessageBox(response.message)
            break
          case 'canceled':
            showMessage(response.message, 'warning')
            break
        }
      })
    },

    setFocusOnInput() {
      this.$nextTick(() => {
        this.$refs.barcodeInput.focus()
      })
    },

    barcodeCompare() {
      const matchedBarcode = this.barcodeList[this.currentIndex]
      if (this.scanBarcode === matchedBarcode) {
        this.compareResultList.push('成功')
        this.currentIndex++
        this.scanBarcode = ''
        if (this.currentIndex === this.barcodeList.length) {
          showMessage('产品条形码验证成功', 'success')
          this.currentIndex = 0
          this.compareResultList = []
          this.scanDrawer = !this.scanDrawer
          this.serialCardShow = true
          if (this.passFlag !== 0) {
            this.selectButtonDisabled = true
            this.switchDisabled = false
            this.testButtonDisabled = false
          }
          this.passFlag++
        }
      } else {
        this.compareResultList.push('失败')
        showMessageBox('产品条形码验证失败', this.showMessageBoxTitle, 'error', () => {
          this.resetVerification()
        })
      }
    },

    fetchSerialPort() {
      SerialPort.list().then((ports) => {
        this.serialPortList = ports.filter((element) => {
          return element.manufacturer !== 'Microsoft'
        })
      })
    },

    handleSwitchChange(value) {
      if (value) {
        if (this.selectedSerialPort === '') {
          showMessage('串口未选择', 'warning')
          this.switchValue = !this.switchValue
        } else {
          this.connectSerialPort()
        }
      } else {
        this.closeSerialPort()
        this.selectButtonDisabled = false
        this.selectDisabled = false
        this.testButtonDisabled = true
      }
    },

    connectSerialPort() {
      this.serialPort = new SerialPort({
        path: this.selectedSerialPort,
        baudRate: 115200,
        autoOpen: false
      })
      this.serialPort.open((error) => {
        if (error) {
          showMessageBox(error, this.showMessageBoxTitle, 'error', () => {
            this.switchValue = !this.switchValue
          })
        } else {
          showMessage('通信测试成功', 'success')
          this.selectButtonDisabled = true
          this.selectDisabled = true
          this.testButtonDisabled = false
        }
      })
    },

    closeSerialPort() {
      if (this.serialPort && this.serialPort.isOpen) {
        this.serialPort.close(() => {})
      }
    },

    resetVerification() {
      this.currentIndex = 0
      this.scanBarcode = ''
      this.compareResultList = []
    },

    handleResetVerificationClick() {
      document.getElementById('reset-verification-button').blur()
      this.resetVerification()
      this.setFocusOnInput()
    },

    exitVerification() {
      document.getElementById('exit-verification-button').blur()
      this.resetVerification()
      this.scanDrawer = !this.scanDrawer
      this.enterVerificationButtonShow = !this.enterVerificationButtonShow
      if (this.passFlag !== 0) {
        this.selectButtonDisabled = false
        this.switchDisabled = true
        this.testButtonDisabled = true
      }
    },

    enterVerification() {
      document.getElementById('enter-verification-button').blur()
      this.scanDrawer = !this.scanDrawer
      this.enterVerificationButtonShow = !this.enterVerificationButtonShow
    },

    async openTest() {
      document.getElementById('open-test-button').blur()
      this.switchDisabled = true
      this.testButtonDisabled = true
      this.testResultCardShow = true
      let endState = 'pass'
      this.testResult = this.processList.map(item => ({
        channel: channelArray[item.channel - 1],
        standardValue: item.standardValue,
        testValue: '',
        valueComparison: ''
      }))
      for (let i = 0; i < this.processList.length; i++) {
        const item = this.processList[i]
        this.serialPort.write(item.channel + '\r\n')
        const testValue = await this.handleSerialPortReception()
        this.testResult[i].testValue = testValue
        if (!isNumericOrFloat(testValue)) {
          this.testResult[i].valueComparison = '测试值异常'
          endState = 'fail1'
          break
        }
        if (!isWithinRange(testValue, item.standardValue)) {
          this.testResult[i].valueComparison = '测试值对比不通过'
          endState = 'fail2'
          break
        }
        this.testResult[i].valueComparison = '对比通过'
        await new Promise(resolve => setTimeout(resolve, item.delay * 1000))
      }
      const stateMappings = {
        'pass': { resultMessage: '测试通过', resultType: 'success' },
        'fail1': { resultMessage: '测试未通过，测试值异常', resultType: 'error' },
        'fail2': { resultMessage: '测试未通过，测试值对比不通过', resultType: 'error' }
      }
      const result = stateMappings[endState]
      const { resultMessage, resultType } = result
      showMessageBox(resultMessage, this.showMessageBoxTitle, resultType, () => {
        this.saveExcelAndLocal(this.testResult, resultMessage, this.testScheme, () => {
          if (this.enablePrinter) {
            console.log('进入打印流程...')
          }
          if (this.enableScanner) {
            this.scanDrawer = !this.scanDrawer
          }
          this.switchDisabled = false
          this.testButtonDisabled = false
        })
      })
    },

    handleSerialPortReception() {
      return new Promise((resolve) => {
        const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))
        parser.on('data', (data) => {
          resolve(data)
        })
      })
    },

    saveExcelAndLocal(testResult, resultMessage, testScheme, callback) {
      ipcRenderer.removeAllListeners('save-excel-and-local-response')
      const dataToPass = {
        testResult: testResult,
        resultMessage: resultMessage,
        testScheme: testScheme
      }
      ipcRenderer.send('save-excel-and-local', dataToPass)
      ipcRenderer.on('save-excel-and-local-response', (event, data) => {
        if (data.status === 'success') {
          showMessage(data.message, 'success', callback)
        } else {
          showMessageBox(data.message, this.showMessageBoxTitle, 'error', callback)
        }
      })
    },

    statusReset() {
      this.passFlag = 0
      this.testResult = []
      this.testResultCardShow = false
      this.serialCardShow = false
      this.enterVerificationButtonShow = false
      this.selectButtonDisabled = false
    }
  },

  destroyed() {
    this.closeSerialPort()
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
  max-height: calc(100vh - 60px);
  /* border: 1px solid blue; */
  /* flex: 1; */
}

.main-content {
  display: flex;
  flex-direction: column;
  padding: 30px 60px 60px;
  /* border: 1px solid yellow; */
}

.test-scheme-selection-container,
.serial-card-container {
  /* border: 1px solid green; */
  margin-bottom: 30px;
}

.scan-drawer-container {
  /* border: 1px solid red; */
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.drawer-button-container {
  height: 40px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  border-bottom: 3px dashed lightgray;
}

.drawer-input-container {
  height: 40px;
  padding: 30px 50px;
  border-bottom: 3px dashed lightgray;
}

.drawer-table-container {
  flex-grow: 1;
  padding: 50px;
  /* border: 1px solid red; */
}

.serial-card-content {
  display: flex;
  /* justify-content: space-between; */
}

.serial-card-content-switch {
  display: flex;
  align-items: center;
  margin: 0px 80px;
  /* border: 1px solid red; */
}

.serial-card-content-select > span,
.serial-card-content-switch > span {
  margin-right: 10px;
  font-size: 20px;
  font-family: monospace;
}
</style>
