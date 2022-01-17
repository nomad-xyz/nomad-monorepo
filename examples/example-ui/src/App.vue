<template>
  <div class="app-container">
    <h1>Nomad SDK Example UI</h1>
    <a href="https://www.npmjs.com/package/@nomad-xyz/sdk" target="_blank" class="link">NPM Package</a>
    <a href="https://docs.nomad.xyz" target="_blank" class="link">Docs</a>
    <home />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Home from './components/Home.vue';

export default defineComponent({
  name: 'App',
  components: {
    Home
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.app-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.link {
  color: #41BA83;
}
</style>
