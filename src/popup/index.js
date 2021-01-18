import Vue from 'vue'
import { Button, Card } from 'element-ui'
import App from './App.vue'

Vue.use(Button).use(Card)

// eslint-disable-next-line
new Vue({
  el: '#app',
  render: h => h(App),
})
