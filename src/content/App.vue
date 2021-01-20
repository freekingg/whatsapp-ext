<template>
  <div class="chrome-extension-template-content">
    <img :src="imgURL" class="yi-img" />
  </div>
</template>

<script>
import { injectCustomJs } from '../utils/chrome'
import { setStorage, getStorage, testStr } from '../utils/help'

export default {
  name: 'app',
  data() {
    return {
      // 当前用户
      currentUserId: null,
      // 聊天列表监控器实例
      observerChatInstance: null,
      // 聊天发送消息按钮监控器实例
      sendBoxInstance: null,
      // 输入信息是否翻译完成
      done: false,
      imgURL: chrome.extension.getURL('../assets/yi.png'),
    }
  },

  mounted() {
    // 注入自定义JS

    injectCustomJs()
    // 监控app根dom加载完成后再进行其它相关事件的监听
    this.watchAppRoot()

    const imgURL = chrome.extension.getURL('../assets/yi.png')
  },
  methods: {
    // 观察初始app加载
    watchAppRoot() {
      let count = 0
      const observerInstance = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            count += 1
            if (count === 3) {
              console.log('聊天列表展示')
              setTimeout(() => {
                // 停止观察
                observerInstance.disconnect()
                // 观察聊天列表
                this.watchChatWindows()
              }, 1000)
            }
          }
        }
      })
      observerInstance.observe(document.querySelector('#app'), { attributes: true, childList: true, subtree: false })
    },
    watchChatWindows() {
      const observer = new MutationObserver(mutationsList => {
        console.log(mutationsList)
        let target = null
        if (mutationsList.length) {
          target = mutationsList[mutationsList.length - 1]
          let current = {}
          if (target.addedNodes.length) {
            current = target.addedNodes[0].querySelector('header._1UuMR')
            // 用户名
            const userId = current.querySelector('span._1XH7x').innerText.trim()
            // 上线时间
            const lastSee = current.querySelector('span._3Id9P')
              ? current.querySelector('span._3Id9P').innerText.trim()
              : ''
            this.currentUserId = userId
            setStorage(`${userId}`, { userId, lastSee })
          }

          setTimeout(() => {
            this.watchChatList()
          }, 500)
        }
      })
      observer.observe(document.querySelector('.i5ly3._2l_Ww:last-child'), {
        attributes: true,
        childList: true,
        subtree: false,
      })
    },
    // 观察聊天信息列表
    watchChatList() {
      console.log('开始监控消息列表')
      // 停止观察
      if (this.observerChatInstance) {
        this.observerChatInstance.disconnect()
        // observerChat = null
      }

      // 所有消息的父元素容器
      const tSmQ1 = document.querySelector('.tSmQ1')
      // 消息输入框
      const input = document.querySelector('.DuUXI ._1awRl')
      // 消息发送按钮
      const sendBox = document.querySelector('._3qpzV:last-child')

      // 切换了聊天用户
      console.log('%c 切换了聊天用户', 'color: #4fc3f7')

      // 每次切换聊天窗口后，将之前监听事件清除
      input.removeEventListener('keydown', this.sendEnterHandle)

      // 获取最近的15条消息
      const last15 = Array.from(tSmQ1.childNodes).slice(-20)
      const chatListAll = getStorage(`${this.currentUserId}-chat`)
      if (chatListAll) {
        const chatList = chatListAll.slice(-20)
        for (const it of chatList) {
          for (const it2 of last15) {
            if (it2.dataset.id === it.nodeId) {
              const selectable = it2.querySelector('.selectable-text')
              const transResult = document.createElement('div')
              transResult.innerHTML = `<h2 class="trasnt">${it.tgt}</h2>`
              selectable.appendChild(transResult)
            }
          }
        }
      }
      // 每次翻译后滚动窗口
      this.scrollToBottom()

      this.observerChatInstance = new MutationObserver(mutationsList => {
        const last = mutationsList[mutationsList.length - 1]
        console.log('observerChatInstance', last)
        if (last) {
          const addedNodes = last.addedNodes[0]
          const selectable = addedNodes.querySelector('.selectable-text')
          const targetText = selectable ? selectable.innerText : ''

          // 发送消息向background进行翻译
          window.postMessage(
            { cmd: 'invoke', code: this.sendMessageToBackground(targetText, selectable, addedNodes) },
            '*',
          )
        }
      })
      this.observerChatInstance.observe(tSmQ1, {
        attributes: false,
        childList: true,
        subtree: false,
      })

      // 添加发送消息监听事件
      this.listenEnterAndSenderHandle()
    },

    // 添加回车与发送按钮相关监听事件
    listenEnterAndSenderHandle() {
      // 消息输入框
      const input = document.querySelector('.DuUXI ._1awRl')
      const sendBox = document.querySelector('._3qpzV:last-child')
      if (this.sendBoxInstance) {
        this.observerChatInstance.disconnect()
      }

      this.sendBoxInstance = new MutationObserver(mutationsList => {
        const last = mutationsList[mutationsList.length - 1]
        if (last) {
          const addedNodes = last.addedNodes[0]
          // 表示此时发送按钮已经显示
          if (addedNodes.className === '_2Ujuu') {
            // 消息发送按钮
            const sendBtn = document.querySelector('button._2Ujuu')
            sendBtn.removeEventListener('click', this.sendBtnHandle)
            sendBtn.addEventListener('click', this.sendBtnHandle)
          }
        }
      })
      this.sendBoxInstance.observe(sendBox, {
        attributes: false,
        childList: true,
        subtree: false,
      })

      // 监听输入框 enter按下事件
      input.addEventListener('keydown', this.sendEnterHandle)
    },

    // 点击回车后拦截的处理方法
    sendEnterHandle(e) {
      const DuUXI = document.querySelector('.DuUXI')
      const input = DuUXI.querySelector('._1awRl')

      const { innerHTML, innerText } = input

      // 监听
      if (e.keyCode === 13) {
        if (this.done === true) {
          this.done = false
          return true
        }
        if (!testStr(innerText, '正在翻译中...')) {
          input.innerHTML = `(${innerText})  正在翻译中...`
          // 发送消息向background进行翻译
          window.postMessage({ cmd: 'invoke', code: this.sendMessageToBackgroundTranslate(innerText, input) }, '*')
          e.preventDefault()
          this.done = true
        }
      }
    },
    // 点击发送按钮后拦截的处理方法
    sendBtnHandle(e) {
      const DuUXI = document.querySelector('.DuUXI')
      const input = DuUXI.querySelector('._1awRl')

      const { innerHTML, innerText } = input

      // 监听
      if (this.done === true) {
        this.done = false
        return true
      }
      if (!testStr(innerText, '正在翻译中...')) {
        input.innerHTML = `(${innerText})  正在翻译中...`
        // 发送消息向background进行翻译
        window.postMessage({ cmd: 'invoke', code: this.sendMessageToBackgroundTranslate(innerText, input) }, '*')
        e.preventDefault()
        e.stopPropagation()
        this.done = true
      }
    },

    // 主动发送消息给后台&接收结果
    sendMessageToBackground(message, node, addedNodes) {
      chrome.runtime.sendMessage({ world: message }, response => {
        // tip('收到来自后台的回复：' + response)
        console.log(`收到来自后台的回复：${response}`)
        const transResult = document.createElement('div')
        transResult.innerHTML = `<h2 class="trasnt">${response}</h2>`
        node.appendChild(transResult)

        // 每次翻译后滚动窗口
        this.scrollToBottom()

        // 将翻译记录本地存储
        const chatList = getStorage(`${this.currentUserId}-chat`)
        const tempData = {
          origin: message,
          tgt: response,
          nodeId: addedNodes.dataset.id,
        }
        if (!chatList) {
          setStorage(`${this.currentUserId}-chat`, [tempData])
          return
        }
        setStorage(`${this.currentUserId}-chat`, [...chatList, tempData])
      })
    },

    // 主动发送消息给后台&接收结果
    sendMessageToBackgroundTranslate(message, nodes) {
      chrome.runtime.sendMessage({ world: message }, response => {
        // tip('收到来自后台的回复：' + response)
        // console.log(`收到来自后台的回复：${response}`)

        // eslint-disable-next-line no-param-reassign
        nodes.innerHTML = `${response}`
        const event = new InputEvent('input', { bubbles: true })
        nodes.dispatchEvent(event)

        const sendBtn = document.querySelector('button._2Ujuu')
        // 翻译完成后 自动发送
        setTimeout(() => {
          sendBtn.click()
        }, 1000)
      })
    },
    scrollToBottom() {
      const RUGMB = document.querySelector('._26MUt')
      RUGMB.scrollTo(0, 60000)
    },
    /**
     * 接收消息
     */
    onMessage({ action, tgt, origin }) {
      console.log(action, tgt, origin)
    },
  },
}
</script>
<style lang="scss"></style>
