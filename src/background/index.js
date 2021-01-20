/* eslint-disable */

const menus = ['翻译']

console.log('background.js')

// 添加右键菜单
menus.forEach((menu, index) => {
  chrome.contextMenus.create({
    title: menu,
    contexts: ['selection'],
    onclick: function (info, tab) {
      translate(info.selectionText).then(result => {
        if (result && result.errorCode === 0) {
          let translateResult = result.translateResult
          chrome.tabs.sendMessage(tab.id, {
            action: 'translate',
            origin: info.selectionText,
            tgt: translateResult[0][0].tgt,
          })
        }
      })
    },
  })
})

// 翻译
function translate(world) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        let result = JSON.parse(xhr.responseText)
        resolve(result)
      }
    }
    xhr.open('GET', `http://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${world}`, true)
    xhr.send()
  })
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('收到来自content-script的消息：')
  console.log(request, sender, sendResponse)
  let { world } = request
  translate(world).then(result => {
    if (result && result.errorCode === 0) {
      let translateResult = result.translateResult
      sendResponse(translateResult[0][0].tgt)
    } else {
      sendResponse('faile')
    }
  })
  return true
})
