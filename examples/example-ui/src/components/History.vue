<template>
  <n-data-table
    :columns="columns"
    :data="txHistory"
    :loading="loading"
    :pagination="{ pageSize: 10 }"
  />
</template>

<script lang="ts">
import { defineComponent, h } from 'vue';
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
  components: {
    NDataTable
  },
  props: {
    txHistory: {
      type: Array
    }
  },
  data() {
    return {
      loading: false,
      columns: createColumns(),
    }
  },
});
</script>
