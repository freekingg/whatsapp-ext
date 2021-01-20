import Vue from 'vue'
import { Button } from 'element-ui'
import App from './App.vue'

Vue.use(Button)

// eslint-disable-next-line
new Vue({
  el: '#app',
  render: h => h(App),
})
