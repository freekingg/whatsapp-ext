/* eslint-disable */
import Vue from 'vue'
import App from './App.vue'
import { Button } from 'element-ui'
Vue.use(Button)
const AppConstructor = Vue.extend(App)
const instance = new AppConstructor()
instance.$mount()
document.body.appendChild(instance.$el)

console.log('content.js')

// 接收来自后台的消息
chrome.extension.onMessage.addListener(async function (request, sender, sendMessage) {
  console.log('接收来自后台的消息', request)
  instance.onMessage(request)
})

// 简单的消息通知
let tipCount = 0
function tip(info) {
  info = info || ''
  var ele = document.createElement('div')
  ele.className = 'chrome-plugin-simple-tip slideInLeft'
  ele.style.top = tipCount * 70 + 20 + 'px'
  ele.innerHTML = `<div>${info}</div>`
  document.body.appendChild(ele)
  ele.classList.add('animated')
  tipCount++
  setTimeout(() => {
    ele.style.top = '-100px'
    setTimeout(() => {
      ele.remove()
      tipCount--
    }, 400)
  }, 3000)
}
