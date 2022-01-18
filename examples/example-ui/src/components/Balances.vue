<template>
  <n-data-table :columns="columns" :data="data" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NDataTable } from 'naive-ui';
import { getNomadBalances, connectWallet } from '@/utils/sdk';
import { tokens, TokenName } from '@/config';

async function formatData() {
  return await Object.keys(tokens).map(async (t: string) => {
    // TODO: get address once connected
    return await getNomadBalances(t as TokenName, '0x9791c9dF02D34F2e7d7322D655535d9849E8da5c')
  });
}

export default defineComponent({
  name: 'Home',
  components: {
    NDataTable,
  },
  data() {
    return {
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
      data: [] as any[]
    }
  },
  async mounted() {
    await connectWallet()
    // console.log(await getNomadBalances(tokens['WETH'].tokenIdentifier, '0x9791c9dF02D34F2e7d7322D655535d9849E8da5c'))
    this.data = await formatData()
    console.log('data', this.data[0])
  },
});
</script>
