<template>
  <div class="chrome-extension-template-content">
    <el-button type="primary">35</el-button>
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
    }
  },
  mounted() {
    // 注入自定义JS

    injectCustomJs()
    // 监控app根dom加载完成后再进行其它相关事件的监听
    this.watchAppRoot()
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
      console.log('切换了聊天用户', tSmQ1)

      // 获取最近的15条消息
      const last15 = Array.from(tSmQ1.childNodes).slice(-15)
      const chatList = getStorage(`${this.currentUserId}-chat`)
      console.log('chatList: ', chatList)
      if (chatList) {
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

      const RUGMB = document.querySelector('._26MUt')
      RUGMB.scrollTo(0, 60000)

      this.observerChatInstance = new MutationObserver(mutationsList => {
        console.log('mutationsList', mutationsList)
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

      const DuUXI = document.querySelector('.DuUXI')
      const input = DuUXI.querySelector('._1awRl')
      console.log(DuUXI)
      input.addEventListener('keydown', e => {
        const { innerHTML, innerText } = input

        if (e.keyCode === 13) {
          console.log('innerHTML', innerHTML)

          console.log(innerHTML)
          if (testStr(innerText, 'result')) {
            input.focus()
            input.innerHTML = 'result:what are you doing?'
            return true
          }
          if (!testStr(innerText, '正在翻译中...')) {
            input.innerHTML = '正在翻译中...'
            setTimeout(() => {
              input.innerHTML = 'result:what are you doing?'
            }, 3000)
            e.preventDefault()
          }
        }
      })

      input.addEventListener('change', e => {
        const { innerHTML, innerText } = input
        console.log(e)
      })
    },

    // 主动发送消息给后台&接收结果
    sendMessageToBackground(message, node, addedNodes) {
      chrome.runtime.sendMessage({ world: message }, response => {
        // tip('收到来自后台的回复：' + response)
        console.log(`收到来自后台的回复：${response}`)
        const transResult = document.createElement('div')
        transResult.innerHTML = `<h2 class="trasnt">${response}</h2>`
        node.appendChild(transResult)

        const RUGMB = document.querySelector('._26MUt')
        RUGMB.scrollTo(0, 60000)

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
    /**
     * 接收消息
     */
    onMessage({ action, tgt, origin }) {
      console.log(action, tgt, origin)
    },
  },
}
</script>
<style lang="scss">
.chrome-extension-template-content {
  // display: none;
}
</style>
