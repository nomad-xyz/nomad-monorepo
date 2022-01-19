<template>
  <n-data-table
    :columns="columns"
    :data="history"
    :loading="loading"
    :pagination="{ pageSize: 10 }"
  />
</template>

<script lang="ts">
import { defineComponent, h, ref } from 'vue';
import { NDataTable } from 'naive-ui';
import { truncateAddr, TXData } from '@/utils/sdk';
import TxData from './TxData.vue'

const createColumns = () => {
  return [
    {
      type: 'expand',
      expandable: () => true,
      renderExpand: (rowData: TXData) => {
        return h(
          TxData,
          { tx: rowData }
        )
      }
    },
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
      key: 'hash',
      render (row: TXData) {
        return truncateAddr(row.hash)
      }
    }
  ]
}

export default defineComponent({
  name: 'History',
  props: {
    address: {
      type: String,
      required: true
    }
  },
  components: {
    NDataTable
  },
  data() {
    return {
      loading: false,
      columns: createColumns(),
      // history: ref([]),
      // TODO: save transactions in localstorage
      history: ref([
        {
          key: 0,
          origin: 'kovan',
          destination: 'moonbasealpha',
          hash: '0xa99650ad988ed11ad4c970edc42325576149ad7baa0dbe6fae54a0e3da395792'
        },
        {
          key: 1,
          origin: 'kovan',
          destination: 'moonbasealpha',
          hash: '0x1111...2222'
        }
      ])
    }
  },
  async mounted() {
    // this.getHistory()
  },
  methods: {
    async getHistory() {
      // this.loading = true
      // get history
      // this.history = history
      // this.loading = false
    }
  }
});
</script>

<style scoped>

</style>
