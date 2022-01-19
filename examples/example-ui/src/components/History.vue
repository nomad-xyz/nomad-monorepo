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
      // get history
      // this.history = history
      // this.loading = false
    }
  }
});
</script>

<style scoped>

</style>
