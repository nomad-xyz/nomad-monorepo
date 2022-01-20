<template>
  <div>
    <div>Transaction: {{ tx.hash }}</div>
    <div>Amount: {{ amount }} {{ tokenSymbol }}</div>
    <div>Sender: {{ originAddr }}</div>
    <div>Recipient: {{ destAddr }}</div>
    <div>Status: {{ statusText }}</div>

    <n-button
      v-if="readyToProcess"
      @click="process"
      :loading="processing"
      :disabled="processing"
      icon-placement="left"
    >
      Claim
    </n-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { utils, BigNumber } from 'ethers'
import { TransferMessage } from '@nomad-xyz/sdk/nomad/messages/BridgeMessage'
import { NButton } from 'naive-ui'
import {
  getTxMessage,
  TXData,
  fromBytes32,
  resolveRepresentation,
  getStatusText,
  processTx
} from '@/utils/sdk';

export default defineComponent({
  name: 'Transaction Data',
  props: {
    tx: {
      type: Object,
      required: true
    }
  },
  components: {
    NButton
  },
  async mounted() {
    this.getTx()
  },
  data() {
    return {
      processing: false,
      originAddr: '',
      destAddr: '',
      token: '',
      tokenSymbol: '',
      amount: '',
      status: 0,
      confirmAt: BigNumber.from(0)
    }
  },
  methods: {
    async getTx() {
      const { hash, origin } = this.tx
      console.log('data', hash, origin)
      const message = await getTxMessage(this.tx as TXData)
      console.log(message)
      // destination/origin addr
      this.originAddr = message.receipt.from
      this.destAddr = fromBytes32(message.to)
      // get token
      const token = await resolveRepresentation(
        message.origin,
        message.token
      )
      // token symbol
      this.tokenSymbol = await token?.symbol()!
      // amount as BN
      const amountBN = message.amount.toString()
      // amount divided by decimals
      this.amount = await utils.formatUnits(amountBN, await token!.decimals())
      // status
      await this.getStatus(message)

      setInterval(() => {
        if (this.status < 3) {
          this.getStatus(message)
        }
      }, 60000)
    },
    async getStatus(message: TransferMessage) {
      if (!message) return
      const status = (await message.events()).status
      console.log('status: ', status)
      this.status = status
      // if status is 2, get confirmAt timestamp
      if (this.status === 2 && !this.confirmAt) {
        this.confirmAt = await message.confirmAt()
      }
    },
    async process() {
      // set processing spinner, disable button
      this.processing = true
      try {
        await processTx(this.tx as TXData)
        this.processing = false
        console.log('Processed successfully!')
      } catch(e) {
        this.processing = false
        console.error(e)
      }
    }
  },
  computed: {
    statusText() {
      return getStatusText(this.status)
    },
    readyToProcess(): boolean {
      // networks not subsidized, require user to return to claim funds
      const manualProcessNets = ['ethereum', 'kovan']
      if (!this.confirmAt) return false
      // get timestamp in seconds
      const now = BigNumber.from(Date.now()).div(1000)
      // check if confirmAt time has passed
      // check if network is one that needs manual processing
      return now.gt(this.confirmAt) && manualProcessNets.includes(this.tx.destinationNetwork)
    }
  }
});
</script>
