<template>
  <h1>Hello</h1>
  <n-card class="card">
    <n-form
      inline
      :label-width="80"
      :model="formValue"
      :rules="rules"
      :ref="formRef"
      class="form"
    >
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
      <n-form-item>
        <n-button @click="handleValidateClick">Validate</n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NButton, NCard } from 'naive-ui';
import { tokens, networks } from '@/config'

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
        },
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
      handleValidateClick (e: any) {
        e.preventDefault()
        // if (!formRef.value) return
        // formRef.value.validate((errors) => {
        //   if (!errors) {
        //     message.success('Valid')
        //   } else {
        //     console.log(errors)
        //     message.error('Invalid')
        //   }
        // })
      }
    }
  },
});
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 450px;
  margin: 50px 20px;
}
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
