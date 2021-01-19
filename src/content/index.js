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

watchAppRoot()

// 观察初始app加载
function watchAppRoot() {
  let count = 0
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        count++
        if (count === 3) {
          console.log('聊天列表展示')
          setTimeout(() => {
            // initCustomPanel2()
            // 停止观察
            observer.disconnect()
            // 观察聊天列表
            watchChatWindows()
          }, 2000)
        }
      }
    }
  })
  observer.observe(document.querySelector('#app'), { attributes: true, childList: true, subtree: false })
}

// 观察聊天窗口
function watchChatWindows() {
  const observer = new MutationObserver((mutationsList, observer) => {
    console.log(mutationsList)
    let target = null
    if (mutationsList.length) {
      target = mutationsList[mutationsList.length - 1]
      console.log(target)
      setTimeout(() => {
        watchChatList()
      }, 1000)
    }
  })
  observer.observe(document.querySelector('.i5ly3._2l_Ww:last-child'), {
    attributes: true,
    childList: true,
    subtree: false,
  })
}

// 观察聊天信息列表
let observerChat = null
function watchChatList() {
  console.log('开始监控消息列表')
  // 停止观察
  observerChat && observerChat.disconnect()
  observerChat = new MutationObserver((mutationsList, observer) => {
    let last = mutationsList[mutationsList.length - 1]
    if (last) {
      let target = last.target.childNodes[last.target.childNodes.length - 1]
      let selectable = last.addedNodes[0].querySelector('.selectable-text')
      let targetText = selectable.innerText
      console.log('targetText: ', targetText)

      // 发送消息向background进行翻译
      window.postMessage({ cmd: 'invoke', code: sendMessageToBackground(targetText, selectable) }, '*')
    }
  })
  observerChat.observe(document.querySelector('.tSmQ1'), {
    attributes: false,
    childList: true,
    subtree: false,
  })
}

// 主动发送消息给后台&接收结果
function sendMessageToBackground(message, node) {
  console.log('message', message)
  chrome.runtime.sendMessage({ world: message }, function (response) {
    console.log('response', response)
    // tip('收到来自后台的回复：' + response)
    let transResult = document.createElement('div')

    transResult.innerHTML = `<h2 class="trasnt">${response}</h2>`
    node.appendChild(transResult)
  })
}

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
