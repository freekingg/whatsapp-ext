/* eslint-disable */
import Vue from 'vue'
import App from './App.vue'

// 向页面注入JS
import { injectCustomJs } from '../utils/chrome'
import { setStorage, getStorage } from '../utils/help'

const AppConstructor = Vue.extend(App)
const instance = new AppConstructor()
instance.$mount()
document.body.appendChild(instance.$el)

console.log('content.js')

// 当前用户
let currentUserId = null

// 注入自定义JS
injectCustomJs()

// 监控app根dom加载完成后再进行其它相关事件的监听
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
            // 停止观察
            observer.disconnect()
            // 观察聊天列表
            watchChatWindows()
          }, 1000)
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
      let current = {}
      if (target.addedNodes.length) {
        current = target.addedNodes[0].querySelector('header._1UuMR')
        // 用户名
        let userId = current.querySelector('span._1XH7x').innerText.trim()
        // 上线时间
        let lastSee = current.querySelector('span._3Id9P') ? current.querySelector('span._3Id9P').innerText.trim() : ''
        currentUserId = userId
        setStorage(`${userId}`, { userId, lastSee })
      }

      setTimeout(() => {
        watchChatList()
      }, 500)
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
  if (observerChat) {
    observerChat.disconnect()
    // observerChat = null
  }

  // 所有消息的父元素容器
  let tSmQ1 = document.querySelector('.tSmQ1')
  console.log('切换了聊天用户', tSmQ1)

  // 获取最近的15条消息
  let last15 = Array.from(tSmQ1.childNodes).slice(-15)
  console.log(last15)
  let chatList = getStorage(`${currentUserId}-chat`)
  console.log('chatList: ', chatList)
  for (const it of chatList) {
    for (const it2 of last15) {
      if (it2.dataset.id === it.nodeId) {
        let selectable = it2.querySelector('.selectable-text')
        let transResult = document.createElement('div')
        transResult.innerHTML = `<h2 class="trasnt">${it.tgt}</h2>`
        selectable.appendChild(transResult)
      }
    }
  }

  observerChat = new MutationObserver((mutationsList, observer) => {
    console.log('mutationsList', mutationsList)
    let last = mutationsList[mutationsList.length - 1]
    if (last) {
      let addedNodes = last.addedNodes[0]
      let selectable = addedNodes.querySelector('.selectable-text')
      let targetText = selectable ? selectable.innerText : ''

      // 发送消息向background进行翻译
      window.postMessage({ cmd: 'invoke', code: sendMessageToBackground(targetText, selectable, addedNodes) }, '*')
    }
  })
  observerChat.observe(tSmQ1, {
    attributes: false,
    childList: true,
    subtree: false,
  })
}

// 主动发送消息给后台&接收结果
function sendMessageToBackground(message, node, addedNodes) {
  chrome.runtime.sendMessage({ world: message }, function (response) {
    // tip('收到来自后台的回复：' + response)
    let transResult = document.createElement('div')
    transResult.innerHTML = `<h2 class="trasnt">${response}</h2>`
    node.appendChild(transResult)

    // 将翻译记录本地存储
    let chatList = getStorage(`${currentUserId}-chat`)
    let tempData = {
      origin: message,
      tgt: response,
      nodeId: addedNodes.dataset.id,
    }
    if (!chatList) {
      setStorage(`${currentUserId}-chat`, [tempData])
      return
    }
    setStorage(`${currentUserId}-chat`, [...chatList, tempData])
  })
}

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
