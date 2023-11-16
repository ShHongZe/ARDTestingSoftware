'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const Ajv = require('ajv')
const ajv = new Ajv()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS)
  //   } catch (e) {
  //     console.error('Vue Devtools failed to install:', e.toString())
  //   }
  // }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// -------------------------------------------------------------------------------------------

ipcMain.on('select-test-scheme-request', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  }).then((result) => {
    if (!result.canceled) {
      const filePath = result.filePaths[0]
      fs.readFile(filePath, 'utf8', (error, data) => {
        if (error) {
          console.log(error)
          event.reply('select-test-scheme-response', 
          { status: 'error', message: '测试方案选择失败' })
        } else {
          const isValid = validateTestData(data)
          if (isValid) {
            const fileName = filePath.substring(filePath.lastIndexOf("\\") + 1).replace(".txt", "")
            event.reply('select-test-scheme-response', 
            { status: 'success', message: '测试方案选择成功', fileName, fileContent: data })
          } else {
            event.reply('select-test-scheme-response', 
            { status: 'error', message: '测试方案数据格式不正确' })
          }
        }
      })
    } else {
      event.reply('select-test-scheme-response', 
      { status: 'canceled', message: '测试方案选择取消' })
    }
  }).catch((error) => {
    console.log(error)
    event.reply('select-test-scheme-response', 
    { status: 'error', message: '对话框出现错误' })
  })
})

function validateTestData(data) {
  const schema = {
    type: 'object',
    required: ['featureList', 'barcodeList', 'processList'],
    properties: {
      featureList: { type: 'array' },
      barcodeList: { type: 'array' },
      processList: { type: 'array' }
    }
  }
  const jsonData = JSON.parse(data)
  const valid = ajv.validate(schema, jsonData)
  return valid
}

// -------------------------------------------------------------------------------------------

ipcMain.on('save-excel-and-local', (event, data) => {
  const testResult = data.testResult
  const resultMessage = data.resultMessage
  const testScheme = data.testScheme
  const printBarcode = data.printBarcode
  const { date, time } = getCurrentDateAndTime()
  const { exists, filePath } = checkIfFileExists(testScheme)
  let response = {}
  if (exists) {
    try {
      updateExcelFile(filePath, date, time, resultMessage, testResult, printBarcode)
      response.status = 'success'
      response.message = '测试数据Excel文件更新成功'
    } catch (error) {
      response.status = 'fail'
      response.message = error.message
    }
  } else {
    try {
      createExcelFile(filePath, date, time, resultMessage, testResult, printBarcode)
      response.status = 'success'
      response.message = '测试数据Excel文件新建并保存成功'
    } catch (error) {
      response.status = 'fail'
      response.message = error.message
    }
  }
  event.reply('save-excel-and-local-response', response)
})

function checkIfFileExists(fileName) {
  fileName = fileName + '.xlsx'
  const filePath = path.join(require('os').homedir(), 'Desktop', '测试数据', fileName)
  if (fs.existsSync(filePath)) {
    return { exists: true, filePath }
  } else {
    return { exists: false, filePath }
  }
}

function getCurrentDateAndTime() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = currentDate.getDate().toString().padStart(2, '0')
    const hours = currentDate.getHours().toString().padStart(2, '0')
    const minutes = currentDate.getMinutes().toString().padStart(2, '0')
    const dateFormatted = `${year}-${month}-${day}`
    const timeFormatted = `${hours}:${minutes}`
    return { date: dateFormatted, time: timeFormatted }
}

function createExcelFile(filePath, date, time, resultMessage, testResult, printBarcode) {
  try {
    const headers = ['测试日期', '测试时间', '测试结果', '条码数据', '测试数据']
    const excelData = [headers, [
      date, time, resultMessage, printBarcode, JSON.stringify(testResult)
    ]]
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buffer = XLSX.write(wb, { type: 'buffer' })
    fs.writeFileSync(filePath, buffer)
  } catch (error) {
    throw new Error(`${error.message}`)
  }
}

function updateExcelFile(filePath, date, time, resultMessage, testResult, printBarcode) {
  try {
    const file = fs.readFileSync(filePath)
    const wb = XLSX.read(file, { type: 'buffer' })
    const ws = wb.Sheets['Sheet1']
    const excelData = [date, time, resultMessage, printBarcode, JSON.stringify(testResult)]
    const range = XLSX.utils.decode_range(ws['!ref'])
    const newRow = range.e.r + 1
    excelData.forEach((value, index) => {
      const cell = XLSX.utils.encode_cell({ r: newRow, c: index })
      ws[cell] = { t: 's', v: value, h: value, w: value }
    })
    if (range.e.c < excelData.length - 1) {
      range.e.c = excelData.length - 1
    }
    range.e.r = newRow
    ws['!ref'] = XLSX.utils.encode_range(range)
    const buffer = XLSX.write(wb, { type: 'buffer' })
    fs.writeFileSync(filePath, buffer)
  } catch (error) {
    throw new Error(`${error.message}`)
  }
}

// -------------------------------------------------------------------------------------------

ipcMain.on('generate-test-scheme-request', (event, data) => {
  let { featureList, barcodeList, processList, testScheme } = data
  featureList = processFeatureList(featureList)
  processList = processProcessList(processList)
  const combinedData = {
    featureList,
    barcodeList,
    processList
  }
  const jsonData = JSON.stringify(combinedData, null, 2)
  dialog.showSaveDialog({
    title: '生成测试方案',
    defaultPath: testScheme + '.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  }).then((result) => {
    if (!result.canceled) {
      const filePath = result.filePath
      fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
          console.log(err)
          event.reply('generate-test-scheme-response', 
          { status: 'error', message: '测试方案生成失败' })
        } else {
          event.reply('generate-test-scheme-response', 
          { status: 'success', message: '测试方案生成成功' })
        }
      })
    } else {
      event.reply('generate-test-scheme-response', 
      { status: 'canceled', message: '测试方案生成取消' })
    }
  }).catch((error) => {
    console.log(error)
    event.reply('generate-test-scheme-response', 
    { status: 'error', message: '对话框出现错误' })
  })
})

function processFeatureList(featureList) {
  return featureList.map(feature => {
    if (feature === '扫码') {
      return 'scan'
    } else if (feature === '打印') {
      return 'print'
    }
    return feature
  })
}

function processProcessList(processList) {
  return processList.map(item => {
    const channel = Array.isArray(item.channel) ? item.channel[1] || item.channel[0] : item.channel
    return {
      ...item,
      channel: channel
    }
  })
}
