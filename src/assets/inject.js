// 通过postMessage调用content-script
function invokeContentScript(code) {
  window.postMessage({ cmd: 'invoke', code }, '*')
}

// 发送普通消息到content-script
function sendMessageToContentScriptByPostMessage(data) {
  window.postMessage({ cmd: 'message', data }, '*')
}

;(function () {
  const customEvent = document.createEvent('Event')
  customEvent.initEvent('myCustomEvent', true, true)
  // 通过事件发送消息给content-script
  function sendMessageToContentScriptByEvent(data) {
    const data2 = data || '你好，我是injected-script!'
    const hiddenDiv = document.getElementById('myCustomEventDiv')
    hiddenDiv.innerText = data2
    hiddenDiv.dispatchEvent(customEvent)
  }
  window.sendMessageToContentScriptByEvent = sendMessageToContentScriptByEvent
})()
