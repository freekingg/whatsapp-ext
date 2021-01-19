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

export default {}
