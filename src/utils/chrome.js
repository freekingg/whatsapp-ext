// 获取当前选项卡ID
export const getCurrentTabId = callback => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (callback) callback(tabs.length ? tabs[0].id : null)
  })
}

// 向content-script注入JS片段
export const executeScriptToCurrentTab = code => {
  getCurrentTabId(tabId => {
    chrome.tabs.executeScript(tabId, { code })
  })
}

// 向页面注入JS
export const injectCustomJs = path => {
  const jsPath = path || 'assets/inject.js'
  const temp = document.createElement('script')
  temp.setAttribute('type', 'text/javascript')
  // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
  temp.src = chrome.extension.getURL(jsPath)
  // eslint-disable-next-line func-names
  temp.onload = function () {
    this.parentNode.removeChild(this)
  }
  document.head.appendChild(temp)
}

export default {}
