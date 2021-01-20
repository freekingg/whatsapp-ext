// 存储
export const setStorage = (key, value) => {
  localStorage.setItem(`kk-${key}`, JSON.stringify(value))
}

// 获取存储
export const getStorage = key => {
  const data = localStorage.getItem(`kk-${key}`)
  if (!data) return false
  return JSON.parse(data)
}

// 判断字符中是否包含某个字符串
export const testStr = (source, target) => {
  const reg = new RegExp(`${target}`)
  return reg.test(source)
}

export default {}
