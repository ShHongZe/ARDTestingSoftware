const { defineConfig } = require('@vue/cli-service')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { IgnorePlugin } = require('webpack')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new NodePolyfillPlugin()]
  },
  pluginOptions: {
    plugins: [
      new IgnorePlugin({
        resourceRegExp: /serialport/
      })
    ],
    electronBuilder: {
      nodeIntegration: true,
      customFileProtocol: "./",
      externals: ['serialport']
    }
  }
})
