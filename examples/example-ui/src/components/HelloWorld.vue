<template>
  <div class="inputs">
    <div>
      <!-- amount -->
      <label for="amount">Amount: </label>
      <input type="number" id="amount"/>
      <select name="asset" id="asset">
        <option value="ETH">ETH</option>
        <option value="WETH">WETH</option>
        <option value="USDT">USDT</option>
      </select>
    </div>
    <div>
      <label for="origin">Origin: </label>
      <select name="origin" id="origin">
        <option value="kovan">Kovan</option>
        <option value="moonbasealpha">Moonbase Alpha</option>
      </select>
    </div>
    <div>
      <label for="destination">Destination: </label>
      <select name="destination" id="destination">
        <option value="kovan">Kovan</option>
        <option value="moonbasealpha">Moonbase Alpha</option>
      </select>
    </div>
    <div>
      <label for="originAddr">Sender: </label>
      <input :value="address" readonly id="originAddr"/>
    </div>
    <div>
      <label for="destinationAddr">Destination: </label>
      <input :value="address" readonly id="destinationAddr"/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      address: '' // your address here
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.inputs {
  width: 400px;
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  /* align-items: center; */
  margin: auto;
}
</style>
