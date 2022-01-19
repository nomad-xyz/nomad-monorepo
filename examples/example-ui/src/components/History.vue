<template>
  <n-data-table
    :columns="columns"
    :data="history"
    :loading="loading"
    :pagination="{ pageSize: 10 }"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NDataTable } from 'naive-ui';
import { truncateAddr } from '@/utils/sdk';
import { NetworkName } from '@/config';

type RowData = {
  originNetwork: NetworkName
  destinationNetwork: NetworkName
  hash: string
}

const createColumns = () => {
  return [
    // {
    //   type: 'expand',
    //   expandable: true,
    //   renderExpand: (rowData: RowData) => {
    //     return rowData.hash
    //   }
    // },
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
      render (row: RowData) {
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
      history: [
        {
          origin: 'kovan',
          destination: 'moonbasealpha',
          hash: '0xa99650ad988ed11ad4c970edc42325576149ad7baa0dbe6fae54a0e3da395792'
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
      // get history
      // this.history = history
      // this.loading = false
    }
  }
});
</script>

<style scoped>

</style>
