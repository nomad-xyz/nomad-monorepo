# example-ui

This is an example bridge ui integration using the [Nomad SDK](https://www.npmjs.com/package/@nomad-xyz/sdk).

Further documentation available [here](https://docs.nomad.xyz/bridge).

## Project setup

Install Vue 3
```bash
npm install -g @vue/cli
```

Add RPC URLs to `.env` (see `.env.example`)

Commands:
```bash
npm install

// compiles and hot-reloads for development
npm run serve

// compiles in production environment
npm run serve-prod

// compiles and minifies for production
npm run build

// lints and fixes files
npm run lint

// runs unit tests
npm run test:unit
```

## Integration notes

IMPORTANT: The current testnet deploy does not include a bridge between Kovan and Moonbase Alpha. This is known as the Hub and Spokes model. On Mainnet, we think of Rinkeby (on mainnet: Ethereum) as the hub which would be connected to every other Nomad-supported chain. The spokes (Kovan and Moonbase Alpha) would be connected to Rinkeby, but would not be connected to each other.

Validation:
 - Some native assets should be disabled on non-native chains. For example, native ETH is not available on Moonbeam, user should select WETH
 - Origin and destination networks must be different
 - Origin/destination must be supported (cannot select Kovan/Moonbase Alpha)
 - Send amount must not exceed user's balance
 - User should be connected to their wallet
 - User should be on the origin network
 - Origin and destination addresses should be valid addresses
 - User's wallet address should be the default destination address. Changing the destination address should be and "Advanced" feature. Sending funds to an address you don't controll can result in a permanent loss of funds

Gas:
 - There are no additional fees associated with Nomad, just pay gas!
 - Gas fees are paid in the native token on each chain (e.g. ETH on Ethereum or GLMR on Moonbeam). Thus, the amount of x token sent is the amount they will receive on the destination chain

Other:
 - Bridging takes on average 35-60 minutes and, depending on the destination chain, user may need to return to pay for processing to receive their funds.
