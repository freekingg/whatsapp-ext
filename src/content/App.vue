<template>
  <div class="chrome-extension-template-content" v-if="show">
    <div class="fix-box">
      <div class="datouwang">
        <input type="checkbox" id="dn" v-model="onOff" />
        <label for="dn" class="toggle"><span class="toggle__handler"></span></label>
      </div>
      <div class="select">
        <select name="slct" id="slct">
          <option selected>中文</option>
          <option value="1">越南语</option>
          <option value="2">印度尼西亚语</option>
          <option value="3">阿拉伯语</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { injectCustomJs } from '../utils/chrome'
import { setStorage, getStorage, testStr, isArray } from '../utils/help'

export default {
  name: 'app',
  watch: {
    onOff(newValue, oldValue) {
      const main = document.querySelector('#main')
      if (!this.observerWindowsInstance) {
        if (main) {
          this.watchChatWindows(true)
        } else {
          this.watchChatWindows()
        }
      }
    },
  },
  data() {
    return {
      show: false,
      onOff: false,
      // 当前用户
      currentUserId: null,
      // 聊天列表监控器实例
      observerChatInstance: null,
      // 聊天发送消息按钮监控器实例
      sendBoxInstance: null,
      observerWindowsInstance: null,
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
    // chrome.storage.local.clear()
    // chrome.storage.local.get(null, obj => {
    //   console.log('storage', obj)
    // })
  },
  methods: {
    onOffChange(e) {
      console.log(e.target.value)
    },
    // 观察初始app加载
    watchAppRoot() {
      const observerInstance = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            if (mutation.addedNodes[0].className === '_36Q2N two') {
              console.log('加载完了')
              setTimeout(() => {
                this.show = true
              }, 500)
              observerInstance.disconnect()
            }
          }
        }
      })
      observerInstance.observe(document.querySelector('#app'), {
        attributes: false,
        childList: true,
        subtree: true,
      })
    },
    // trigger 代表是否需要手动触发一次dom更新
    watchChatWindows(trigger) {
      const mainBox = document.querySelector('.i5ly3._2l_Ww:last-child')
      this.observerWindowsInstance = new MutationObserver(mutationsList => {
        let target = null
        console.log(mutationsList)
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
      this.observerWindowsInstance.observe(mainBox, {
        attributes: true,
        childList: true,
        subtree: false,
      })
      if (trigger) {
        mainBox.style.background = 'red'
      }
    },
    // 观察聊天信息列表
    async watchChatList() {
      console.log('开始监控消息列表')
      // 停止观察
      if (this.observerChatInstance) {
        this.observerChatInstance.disconnect()
        this.observerChatInstance = null
      }

      // 所有消息的父元素容器
      const tSmQ1 = document.querySelector('.tSmQ1')
      // 消息输入框
      const input = document.querySelector('.DuUXI ._1awRl')
      // 消息发送按钮
      const sendBox = document.querySelector('._3qpzV:last-child')

      // 切换了聊天用户
      console.log('%c 切换了聊天用户', 'color: #4fc3f7')

      if (!this.onOff) {
        console.log('翻译开关已经关闭，返回')
      }

      // 每次切换聊天窗口后，将之前监听事件清除
      input.removeEventListener('keydown', this.sendEnterHandle)

      // 获取最近的15条消息
      const last15 = Array.from(tSmQ1.childNodes).slice(-20)
      const chatListAll = await getStorage(`${this.currentUserId}-chat`)
      if (isArray(chatListAll) && chatListAll.length) {
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
        this.sendBoxInstance.disconnect()
        this.sendBoxInstance = null
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
      if (!this.onOff) return

      const DuUXI = document.querySelector('.DuUXI')
      const input = DuUXI.querySelector('._1awRl')

      const { innerHTML, innerText } = input

      // 监听
      if (e.keyCode === 13) {
        if (this.done === true) {
          this.done = false
          return true
        }
        if (!testStr(innerText, '正在翻译中...') && innerText.trim()) {
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
      if (!this.onOff) return
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
      chrome.runtime.sendMessage({ world: message }, async response => {
        // tip('收到来自后台的回复：' + response)
        // console.log(`收到来自后台的回复：${response}`)
        const transResult = document.createElement('div')
        transResult.innerHTML = `<h2 class="trasnt">${response}</h2>`
        node.appendChild(transResult)

        // 每次翻译后滚动窗口
        this.scrollToBottom()

        // 将翻译记录本地存储
        const chatList = await getStorage(`${this.currentUserId}-chat`)
        const tempData = {
          origin: message,
          tgt: response,
          nodeId: addedNodes.dataset.id,
        }
        if (isArray(chatList) && !chatList.length) {
          setStorage(`${this.currentUserId}-chat`, [tempData])
          return
        }
        // eslint-disable-next-line no-underscore-dangle
        const _chatList = isArray(chatList) ? chatList : []
        setStorage(`${this.currentUserId}-chat`, [..._chatList, tempData])
      })
    },

    // 主动发送消息给后台&接收结果
    sendMessageToBackgroundTranslate(message, nodes) {
      if (!this.onOff) return
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
