/* eslint-disable */
import Vue from 'vue'
import App from './App.vue'

// 向页面注入JS
import { injectCustomJs } from '../utils/chrome'

const AppConstructor = Vue.extend(App)
const instance = new AppConstructor()
instance.$mount()
document.body.appendChild(instance.$el)

console.log('content.js')

// 注入自定义JS
injectCustomJs()
// initCustomPanel()
initCustomPanel2()
initCustomEventListen()

const ls = document.querySelectorAll('._1wlJG')
console.log('ls', ls)

// 接收来自后台的消息
chrome.extension.onMessage.addListener(async function (request, sender, sendMessage) {
  console.log('接收来自后台的消息', request)
  instance.onMessage(request)
})

function initCustomPanel() {
  var panel = document.createElement('div')
  panel.className = 'chrome-plugin-demo-panel'
  panel.innerHTML = `
		<h2>演示区</h2>
		<div class="btn-area">
			<a href="javascript:sendMessageToContentScriptByPostMessage('你好，我是普通页面！')">通过postMessage发送消息给content-script</a><br>
			<a href="javascript:sendMessageToContentScriptByEvent('你好啊！我是通过DOM事件发送的消息！')">通过DOM事件发送消息给content-script</a><br>
			<a href="javascript:invokeContentScript('sendMessageToBackground()')">发送消息到后台或者popup</a><br>
		</div>
		<div id="my_custom_log">
		</div>
	`
  document.body.appendChild(panel)
}

function initCustomPanel2() {
  var panel = document.createElement('div')
  panel.className = 'chrome-plugin-demo-panel2'
  panel.innerHTML = `
		<h2 onclick="sendMessageToContentScriptByEvent('开始监听')">开启翻译</h2>
	`
  document.body.appendChild(panel)
}

function initCustomEventListen() {
  var hiddenDiv = document.getElementById('myCustomEventDiv')
  if (!hiddenDiv) {
    hiddenDiv = document.createElement('div')
    hiddenDiv.style.display = 'none'
    hiddenDiv.id = 'myCustomEventDiv'
    document.body.appendChild(hiddenDiv)
  }

  hiddenDiv.addEventListener('myCustomEvent', function () {
    var eventData = document.getElementById('myCustomEventDiv').innerText
    // 收到自定义事件：
    tip(eventData)

    const ls = document.querySelectorAll('._1wlJG')
    console.log('ls', ls)
  })
}

var tipCount = 0
// 简单的消息通知
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
