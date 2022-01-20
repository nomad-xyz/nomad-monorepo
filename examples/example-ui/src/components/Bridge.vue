<template>
  <n-card class="card">
    <n-form
      inline
      :label-width="80"
      :model="formValue"
      :rules="rules"
      :ref="formRef"
      class="form"
    >
      <!-- amount -->
      <div class="amount form-row">
        <n-form-item label="Amount" path="sendData.amount" class="amount__item">
          <n-input v-model:value="formValue.sendData.amount" placeholder="Enter amount" />
        </n-form-item>
        <n-form-item label="Token" path="sendData.token" class="amount__item">
          <n-select
            v-model:value="formValue.sendData.token"
            :options="tokenOptions"
            placeholder="Select token"
          />
        </n-form-item>
      </div>
      <!-- origin/destination networks -->
      <n-form-item label="Origin Network" path="sendData.originNetwork" class="form-row">
        <n-select
          v-model:value="formValue.sendData.originNetwork"
          :options="networkOptions"
          placeholder="Select origin network"
        />
      </n-form-item>
      <n-form-item label="Destination Network" path="sendData.destinationNetwork" class="form-row">
        <n-select
          v-model:value="formValue.sendData.destinationNetwork"
          :options="networkOptions"
          placeholder="Select destination network"
        />
      </n-form-item>
      <!-- actions -->
      <n-form-item>
        <!-- if no address, user is not connected -->
        <n-button v-if="!address" @click="$emit('connect')">Connect Wallet</n-button>
        <n-button
          v-else
          @click="send"
          :loading="sending"
          :disabled="sending"
          icon-placement="left"
        >
          Bridge Tokens
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NButton, NCard } from 'naive-ui';
import { tokens, networks, TokenName, NetworkName } from '@/config'
import { switchNetwork, registerNewSigner, send, TXData } from '@/utils/sdk'

function generateTokenOptions() {
  return Object.keys(tokens).map(t => {
    const symbol = tokens[t].symbol
    return { label: symbol, value: symbol }
  })
}

function generateNetworkOptions() {
  return Object.keys(networks).map(n => {
    return { label: n, value: n }
  })
}

interface SendData {
  amount: number | null
  token: TokenName | null
  originNetwork: NetworkName | null
  destinationNetwork: NetworkName | null
}

export default defineComponent({
  name: 'Bridge',
  emits: ['connect', 'newTx'],
  props: {
    address: {
      type: String,
      required: false
    }
  },
  components: {
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NCard,
  },
  setup () {
    const formRef = ref(null)
    return {
      formRef,
      tokenOptions: generateTokenOptions(),
      networkOptions: generateNetworkOptions(),
      formValue: ref({
        sendData: {
          amount: null,
          token: null,
          originNetwork: null,
          destinationNetwork: null,
        } as SendData,
      }),
      rules: {
        sendData: {
          amount: {
            required: true,
            message: 'Required',
            trigger: 'blur',
          },
          token: {
            required: true,
            message: 'Required',
            trigger: 'blur',
          },
          originNetwork: {
            required: true,
            message: 'Required',
            trigger: 'blur',
          },
          destinationNetwork: {
            required: true,
            message: 'Required',
            trigger: 'blur',
          },
        },
      },
    }
  },
  data() {
    return {
      sending: false
    }
  },
  methods: {
    async send() {
      this.sending = true
      // TODO: validate before sending
      console.log('send')
      const { amount, token, originNetwork, destinationNetwork } = this.formValue.sendData
      if (!amount || !token || !originNetwork || !destinationNetwork || !this.address) return

      // switch to origin network and register signer
      await switchNetwork(originNetwork)
      await registerNewSigner(originNetwork)

      // send and receive transferMessage
      let transferMessage
      try {
        transferMessage = await send(originNetwork, destinationNetwork, amount, token, this.address)
        this.sending = false
        console.log('Transaction dispatched successfully!', transferMessage)
      } catch(e) {
        this.sending = false
        console.error(e)
      }

      if (transferMessage) {
        // emit new transaction
        const txData: TXData = {
          origin: originNetwork,
          destination: destinationNetwork,
          hash: transferMessage.receipt.transactionHash
        }
        this.$emit('newTx', txData)
      }
    }
  }
});
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
}
.form-row {
  flex-grow: 1;
  width: 100% !important;
}
.amount {
  display: flex;
}
.amount__item {
  flex-grow: 1;
}
.n-form-item {
  text-align: left;
}
</style>
