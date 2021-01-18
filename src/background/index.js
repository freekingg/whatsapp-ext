/* eslint-disable */

const menus = ['翻译']

console.log('background.js')

// 添加右键菜单
menus.forEach((menu, index) => {
  chrome.contextMenus.create({
    title: menu,
    contexts: ['selection'],
    onclick: function (info, tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'action_name',
        category: menu,
      })
    },
  })
})

// 监听请求响应
// chrome.webRequest.onBeforeRequest.addListener(
//   function (details) {
//     console.log('修改前的请求地址' + details.url)
//     var url = details.url
//     url = url.replace('http', 'https')
//     details.url = url
//     console.log('修改后的请求地址' + details.url)
//     return true
//   },
//   { urls: ['<all_urls>'] },
//   ['blocking'],
// )

let allUrl = []
// 监听http请求
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    console.log('请求', JSON.stringify(details))
    let name = details.url.substring(details.url.lastIndexOf('.') + 1)
    return { requestHeaders: details.requestHeaders }
  },
  { urls: ['wss://web.whatsapp.com/*'], types: ['xmlhttprequest', 'websocket'] },
  ['blocking', 'requestHeaders'],
)

window.addEventListener('load', () => {
  console.log('load', document)
  let _1RAno = document.querySelectorAll('._1RAno')
  console.log(_1RAno)
})

chrome.runtime.onMessage.addListener(function (message, callback) {
  console.log('bgd-onMessage', message)
  // if (message.data == 'setAlarm') {
  //   chrome.alarms.create({ delayInMinutes: 5 })
  // } else if (message.data == 'runLogic') {
  //   chrome.tabs.executeScript({ file: 'logic.js' })
  // } else if (message.data == 'changeColor') {
  //   chrome.tabs.executeScript({ code: 'document.body.style.backgroundColor="orange"' })
  // }
})
