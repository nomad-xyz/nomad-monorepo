<template>
  <!-- dropdown -->
  <div class="dropdown" @click="showBalances = !showBalances">
    Balances
    <svg xmlns="http://www.w3.org/2000/svg" class="caret ionicon" :class="{ open: showBalances }" viewBox="0 0 512 512"><title>Caret Down</title><path d="M98 190.06l139.78 163.12a24 24 0 0036.44 0L414 190.06c13.34-15.57 2.28-39.62-18.22-39.62h-279.6c-20.5 0-31.56 24.05-18.18 39.62z"/></svg>
  </div>

  <!-- balances -->
  <div v-if="showBalances" class="balances">
    <!-- refresh -->
    <div class="refresh">
      <n-button
        text
        class="refresh__btn"
        type="primary"
        @click="getBalances"
      >
        Refresh
      </n-button>
    </div>
    <!-- table -->
    <n-data-table
      :columns="columns"
      :data="balances"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { NDataTable, NButton } from 'naive-ui';
import { getNomadBalances, connectWallet } from '@/utils/sdk';
import { tokens, TokenName } from '@/config';

export default defineComponent({
  name: 'Balances',
  props: {
    address: {
      type: String,
      required: true
    }
  },
  components: {
    NDataTable,
    NButton
  },
  data() {
    return {
      loading: true,
      showBalances: false,
      columns: [
        {
          title: '',
          key: 'asset'
        },
        {
          title: 'Kovan',
          key: '3000'
        },
        {
          title: 'Moonbase Alpha',
          key: '5000'
        }
      ],
      balances: ref([]),
    }
  },
  async mounted() {
    await connectWallet()
    this.getBalances()
  },
  methods: {
    async getBalances() {
      this.loading = true
      let balances: any = []
      for (const token in tokens) {
        const tokenBalances = await getNomadBalances(token as TokenName, this.address)
        balances.push({ asset: tokens[token].symbol, ...tokenBalances })
      }
      this.balances = balances
      this.loading = false
    }
  }
});
</script>

<style scoped>
.dropdown {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 20px;
  cursor: pointer;
}
.caret {
  height: 14px;
  margin-left: 5px;
  transition: all 0.4s;
}
.open {
  transform: rotate(-180deg);
}
.refresh {
  display: flex;
  justify-content: flex-end;
}
.refresh__btn {
  padding: 5px 10px;
}
.balances {
  margin-bottom: 20px;
}
</style>
