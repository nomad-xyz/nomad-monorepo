## Nomad Provider

Nomad Provider is a management system for
[ethers.js](https://docs.ethers.io/v5/) providers and signers that helps
developers connect to multiple networks simultaneously. It is part
of the [Nomad](https://github.com/nomad-xyz/nomad-monorepo) project, but may
be useful to other multi-chain systems.

This package includes the `MultiProvider`, as well as an `NomadContext` for
interacting with deployed Nomad systems. The dev, staging, and mainnet Nomad
systems have pre-built objects for quick development.

### Intended Usage

```ts
import * as ethers from 'ethers';

import { mainnet } from 'nomad-sdk';

// Set up providers and signers
const someEthersProvider = ethers.providers.WsProvider('...');
const someEthersSigner = new AnySigner(...);
mainnet.registerProvider('ethereum', someEthersProvider);
mainnet.registerSigner('ethereum', someEthersSigner);

// We have shortcuts for common provider/signer types
mainnet.registerRpcProvider('celo', 'https://forno.celo.org');
mainnet.registerWalletSigner('celo', '0xabcd...');

// Interact with the Nomad Bridge
// Send ETH from ethereum to celo
await mainnet.sendNative(
    'ethereum', // source
    'celo',  // destination
    ethers.constants.WeiPerEther, // amount
    '0x1234...',  // recipient
);

// Send Tokens from celo to ethereum
await mainnet.send(
    'celo',  // source
    'ethereum', // destination
    { domain: 'ethereum', id: "0xabcd..."} // token information
    ethers.constants.WeiPerEther, // amount
    '0x1234...'  // recipient
    { gasLimit: 300_000 } // standard ethers tx overrides
);

// so easy.
```

# Updating SDK Contracts
When we deploy a new non-prod environment, the contract addresses must be updated in `nomad-sdk/src/nomad/domains/${environment}.ts`

Here's a checklist for you when doing so: 
- Update Contract Addresses
- Update Deployed Block Height
- Bump SDK Version `npm version patch`
- Release SDK `npm publish`
- Update SDK Version pin anywhere it needs to be (ex. `nomad-monitor`)

# Release Process 
```
$ npm version patch 
$ npm publish
```