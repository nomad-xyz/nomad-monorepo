<template>
  <n-data-table
    :columns="columns"
    :data="history"
    :loading="loading"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NDataTable } from 'naive-ui';

export default defineComponent({
  name: 'Home',
  components: {
    NDataTable
  },
  data() {
    return {
      loading: false,
      columns: [
        {
          title: 'Origin Network',
          key: 'origin'
        },
        {
          title: 'Destination Network',
          key: 'destination'
        },
        {
          title: 'Transaction Hash',
          key: 'hash'
        },
      ],
      // history: ref([]),
      history: [
        {
          origin: 'kovan',
          destination: 'moonbasealpha',
          hash: '0x1111...2222'
        },
        {
          origin: 'kovan',
          destination: 'moonbasealpha',
          hash: '0x1111...2222'
        }
      ]
    }
  },
  async mounted() {
    // this.getHistory()
  },
  methods: {
    async getHistory() {
      // this.loading = true
      // let balances: any = []
      // for (const token in tokens) {
      //   const tokenBalances = await getNomadBalances(token as TokenName, '0x9791c9dF02D34F2e7d7322D655535d9849E8da5c')
      //   balances.push({ asset: tokens[token].symbol, ...tokenBalances })
      // }
      // this.balances = balances
      // this.loading = false
    }
  }
});
</script>

<style scoped>

</style>
