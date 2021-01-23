// 存储
export const setStorage = (key, value) => {
  // localStorage.setItem(`kk-${key}`, JSON.stringify(value))
  const keys = `kk-${key}`
  chrome.storage.local.set({ [keys]: value }, () => {
    console.log(`Value is set to ${keys}`, value)
  })
}

// 获取存储
export const getStorage = key =>
  // const data = localStorage.getItem(`kk-${key}`)
  new Promise((resolve, reject) => {
    const keys = `kk-${key}`
    chrome.storage.local.get(keys, result => {
      if (!result) {
        resolve(false)
      } else {
        resolve(result[keys])
      }
    })
  })

// 判断字符中是否包含某个字符串
export const testStr = (source, target) => {
  const reg = new RegExp(`${target}`)
  return reg.test(source)
}

export const isArray = o => Object.prototype.toString.call(o) === '[object Array]'

export default {}
