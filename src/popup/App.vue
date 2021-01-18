<template>
  <div class="chrome-extension-template-popup">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>whats-app</span>
        <el-button style="float: right; padding: 3px 0" type="text">click</el-button>
      </div>
      <div v-for="o in 4" :key="o" class="text item">
        {{ 'list ' + o }}
      </div>
    </el-card>
  </div>
</template>

<script>
import { executeScriptToCurrentTab } from '../utils/chrome'

export default {
  name: 'app',
  methods: {
    setDom() {
      executeScriptToCurrentTab('document.body.style.backgroundColor="red";')
    },
  },
}
</script>

<style>
.chrome-extension-template-newtab {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.box-card {
  width: 200px;
}
</style>
