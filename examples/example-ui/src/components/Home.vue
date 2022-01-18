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
        <n-button v-if="!address" @click="connect">Connect Wallet</n-button>
        <n-button v-else @click="send">Bridge Tokens</n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NButton, NCard } from 'naive-ui';
import { tokens, networks, TokenName, NetworkName } from '@/config'
import { connectWallet, switchNetwork, registerNewSigner, send } from '@/utils/sdk'

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
  name: 'Home',
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
      // if address exists, user is connected to wallet
      address: '',
    }
  },
  methods: {
    async connect() {
      try {
        const address = await connectWallet()
        this.address = address || ''
      } catch {
        console.error('error connecting wallet')
        this.address = ''
      }
    },
    async send() {
      console.log('send')
      const { amount, token, originNetwork, destinationNetwork } = this.formValue.sendData
      if (!amount || !token || !originNetwork || !destinationNetwork || !this.address) return

      // switch to origin network and register signer
      await switchNetwork(originNetwork)
      await registerNewSigner(originNetwork)

      const transferMessage = await send(originNetwork, destinationNetwork, amount, token, this.address)
      console.log(transferMessage)
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
