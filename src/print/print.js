import axios from 'axios'
import qs from 'qs'
import { showMessageBox } from '@/utils'
import { Notification } from 'element-ui'

function print(barcodeValue, callback) {
  let data = {}
  data.reqParam = "1"
  let printparamsJsonArray = []
  printparamsJsonArray.push({"OpenPort": "255"})
  printparamsJsonArray.push({"PTK_PcxGraphicsDel": "*"})
  printparamsJsonArray.push({"PTK_ClearBuffer": ""})
  printparamsJsonArray.push({"PTK_SetDirection": "B"})
  printparamsJsonArray.push({"PTK_SetPrintSpeed": "4"})
  printparamsJsonArray.push({"PTK_SetDarkness": "12"})
  printparamsJsonArray.push({"PTK_SetLabelHeight": "100,16,0,false"})
  printparamsJsonArray.push({"PTK_SetLabelWidth": "800"})
  printparamsJsonArray.push({"PTK_DrawBarcode": `1,20,0,1,4,4,100,B,${barcodeValue}`})
  printparamsJsonArray.push({"PTK_PrintLabel": "1,1"})
  printparamsJsonArray.push({"PTK_CloseUSBPort": ""})
  data.printparams = JSON.stringify(printparamsJsonArray)
  const url = "http://127.0.0.1:888/postek/print"
  axios.post(url, qs.stringify(data), {})
  .then(response => {
    console.log('POST发送Axios请求成功', response)
    if (response.data.retval === "0") {
      Notification({
        title: '条码打印成功',
        type: 'success',
        duration: 2500
      })
      callback()
    } else {
      showMessageBox(response.data, undefined, undefined, callback)
    }
  })
  .catch(response => {
    console.log('POST发送Axios请求失败', response)
    showMessageBox(response, undefined, undefined, callback)
  })
}

export { print }
