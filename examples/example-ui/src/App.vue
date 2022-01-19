<template>
  <div class="app-container">
    <div class="nav">
      <div class="nav-container">
        Nomad
        <n-button v-if="!address" @click="connect">Connect Wallet</n-button>
        <n-tag v-else round type="primary">{{ truncateAddr(address) }}</n-tag>
      </div>
    </div>
    <h1>Nomad SDK Example UI</h1>
    <a href="https://www.npmjs.com/package/@nomad-xyz/sdk" target="_blank" class="link">NPM Package</a>
    <a href="https://docs.nomad.xyz" target="_blank" class="link">Docs</a>
    <div class="main">
      <bridge @connect="connect" :address="address" />
      <balances v-if="address" :address="address" />
      <div v-else class="spacer"></div>
      <history v-if="address" :address="address" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { connectWallet, truncateAddr } from '@/utils/sdk'
import Bridge from './components/Bridge.vue';
import Balances from './components/Balances.vue';
import History from './components/History.vue';

export default defineComponent({
  name: 'App',
  components: {
    Bridge,
    Balances,
    History,
    NButton,
    NTag
  },
  data() {
    return {
      truncateAddr,
      address: ''
    }
  },
  methods: {
    async connect() {
      try {
        const address = await connectWallet()
        this.address = address || ''
      } catch {
        console.error('error connecting wallet')
        this.address = ''
      }
    }
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.app-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.nav {
  width: 100%;
  display: flex;
  justify-content: center;
}
.nav-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px 20px 20px 40px;
}
.main {
  width: 100%;
  max-width: 500px;
  margin: 50px 20px;
}
.link {
  color: #41BA83;
}
.spacer {
  height: 20px;
}
</style>
