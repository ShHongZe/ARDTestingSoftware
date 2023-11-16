import { Message, MessageBox } from 'element-ui'
const Decimal = require('decimal.js')

function showMessage(message, type, callback = () => {}) {
  Message({
    message: message,
    type: type,
    onClose: callback
  })
}

function showMessageBox(message, title = '提示', type = 'error', callback = () => {}) {
  MessageBox.alert(message, title, {
    type: type,
    showClose: false,
    callback: action => {
      if (action === 'confirm' && typeof callback === 'function') {
        callback()
      }
    }
  })
}

function isWithinRange(str1, str2) {
  const num1 = new Decimal(str1)
  const num2 = new Decimal(str2)
  const difference = num1.minus(num2).abs()
  return difference.lte(0.3)
}

function isNumericOrFloat(str) {
  const numericFloatPattern = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
  return numericFloatPattern.test(str);
}

function generatePrintBarcode(testScheme, resultType) {
  const time = getFormattedDate();
  return resultType === 'error'
    ? `Fail${testScheme}${time}`
    : `${testScheme}${time}`;
}

function getFormattedDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatNumber(num) {
  return num < 10 ? `0${num}` : num;
}

export { showMessage, showMessageBox, isWithinRange, isNumericOrFloat, generatePrintBarcode }
