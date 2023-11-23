<template>
  <div>
    <el-button @click="print">打印</el-button>
  </div>
</template>

<script>
import axios from 'axios'
import qs from 'qs'
export default {
  methods: {
    print() {
      let barcodeValue = "Fail20231120"
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
      printparamsJsonArray.push({"PTK_SetLabelWidth": "500"})
      printparamsJsonArray.push({"PTK_DrawBarcode": `1,20,0,1,4,4,100,B,${barcodeValue}`})
      printparamsJsonArray.push({"PTK_PrintLabel": "1,1"})
      data.printparams = JSON.stringify(printparamsJsonArray)
      const url = "http://127.0.0.1:888/postek/print"
      axios.post(url, qs.stringify(data), {})
	    .then(response => {
        console.log('post发送Ajax请求,请求成功',response.data)
	    })
	    .catch(response => {
        console.log('post发送Ajax请求,请求失败',response)
	    })
    }
  }
}
</script>
