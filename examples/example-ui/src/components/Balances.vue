<template>
  <n-data-table :columns="columns" :data="getData" />
</template>

<script lang="ts">
import { defineComponent, unref, ref } from 'vue';
import { NDataTable } from 'naive-ui';
import { getNomadBalances, connectWallet } from '@/utils/sdk';
import { tokens, TokenName } from '@/config';

async function formatData() {
  let balances: any = []
  await Object.keys(tokens).map(async (t: string) => {
    // TODO: get address once connected
    const tokenBalances = await getNomadBalances(t as TokenName, '0x9791c9dF02D34F2e7d7322D655535d9849E8da5c')
    balances.push(tokenBalances)
  });
  return balances
}

export default defineComponent({
  name: 'Home',
  components: {
    NDataTable,
  },
  data() {
    return {
      unref,
      columns: [
        {
          title: 'Kovan',
          key: '3000'
        },
        {
          title: 'Moonbase Alpha',
          key: '5000'
        }
      ],
      data: ref([])
    }
  },
  async mounted() {
    await connectWallet()
    const data = await formatData()
    setTimeout(() => {
      this.data = data
    }, 3000)
  },
  computed: {
    getData() {
      const d = this.data as any
      return JSON.parse(JSON.stringify(d))
    }
  }
});
</script>
