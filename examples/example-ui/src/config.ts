import wETHIcon from './assets/WETH.png'
import USDTIcon from './assets/USDT.png'
import DEVIcon from './assets/DEV.png'
import wADAIcon from './assets/wADA.png'

import { TokenIdentifier } from '@nomad-xyz/sdk/nomad'

export type NetworkName = 'kovan' | 'moonbasealpha' | 'rinkeby' | 'milkomedatestnet'
export type TokenName = 'WETH' | 'USDT' | 'ETH' | 'DEV'

export type TokenMetadata = {
  nativeNetwork: NetworkName // e.g. 'kovan' for 'WETH' or 'USDT'
  symbol: string
  icon: string
  decimals: number
  tokenIdentifier: TokenIdentifier // { domain: networkName, }
  nativeOnly: boolean // only exists on native network. e.g. 'ETH' can only be on Kovan. It is wrapped (WETH) on Moonbase Alpha
}

export type NetworkMetadata = {
  name: NetworkName // kovan or moonbasealpha
  chainID: number // for metamask
  domainID: number // nomad domain ID
  nativeToken: TokenMetadata
  rpcUrl: string
  blockExplorer: string
  confirmationTimeInMinutes: number // dispute period.  For testnet Kovan/Moonbase Alpha it's 2 minutes. For mainnet Ethereum/Moonbeam it's 30 minutes
}

export const WETH: TokenIdentifier = {
  domain: 'kovan', // must be lowercase
  id: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
}

export const USDT: TokenIdentifier = {
  domain: 'kovan',
  id: '0x13512979ade267ab5100878e2e0f485b568328a4',
}

export const DEV: TokenIdentifier = {
  domain: 'moonbasealpha',
  id: '0x0000000000000000000000000000000000000802',
}

export const rWETH: TokenIdentifier= {
  domain: 'rinkeby',
  id: '0xc778417e063141139fce010982780140aa0cd5ab'
}

const wADA: TokenIdentifier = {
  domain: 'milkomedatestnet',
  id: '0x1a40217B16E7329E27FDC9cED672e1F264e07Cc2'
}

export const tokens: { [key: string]: TokenMetadata } = {
  ETH: {
    nativeNetwork: 'rinkeby',
    symbol: 'Rinkeby ETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: rWETH,
    nativeOnly: true,
  },
  WETH: {
    nativeNetwork: 'rinkeby',
    symbol: 'Rinkeby WETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: rWETH,
    nativeOnly: false,
  },
  kETH: {
    nativeNetwork: 'kovan',
    symbol: 'kETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: WETH,
    nativeOnly: true,
  },
  kWETH: {
    nativeNetwork: 'kovan', // must be lowercase
    symbol: 'kWETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: WETH,
    nativeOnly: false,
  },
  USDT: {
    nativeNetwork: 'kovan',
    symbol: 'USDT',
    icon: USDTIcon,
    decimals: 6,
    tokenIdentifier: USDT,
    nativeOnly: false,
  },
  DEV: {
    nativeNetwork: 'moonbasealpha',
    symbol: 'DEV',
    icon: DEVIcon,
    decimals: 18,
    tokenIdentifier: DEV,
    nativeOnly: true,
  },
  milkADA: {
    nativeNetwork: 'milkomedatestnet',
    symbol: 'milkADA',
    icon: wADAIcon,
    decimals: 18,
    tokenIdentifier: wADA,
    nativeOnly: true,
  },
  wADA: {
    nativeNetwork: 'milkomedatestnet',
    symbol: 'wADA',
    icon: wADAIcon,
    decimals: 18,
    tokenIdentifier: wADA,
    nativeOnly: false,
  }
}

export const networks: { [key: string]: NetworkMetadata } = {
  rinkeby: {
    name: 'rinkeby',
    chainID: 4,
    domainID: 2000,
    nativeToken: tokens.rETH,
    rpcUrl: process.env.VUE_APP_RINKEBY_RPC!,
    blockExplorer: 'https://rinkeby.etherscan.io/',
    confirmationTimeInMinutes: 2
  },
  kovan: {
    name: 'kovan', // must be lowercase
    chainID: 42,
    domainID: 3000,
    nativeToken: tokens.ETH,
    rpcUrl:
      process.env.VUE_APP_KOVAN_RPC!,
    blockExplorer: 'https://kovan.etherscan.io',
    confirmationTimeInMinutes: 2
  },
  moonbasealpha: {
    name: 'moonbasealpha',
    chainID: 1287,
    domainID: 5000,
    nativeToken: tokens.DEV,
    rpcUrl: process.env.VUE_APP_MOONBASEALPHA_RPC!,
    blockExplorer: 'https://moonbase-blockscout.testnet.moonbeam.network',
    confirmationTimeInMinutes: 2,
  },
  milkomedatestnet: {
    name: 'milkomedatestnet',
    chainID: 200101,
    domainID: 8000,
    nativeToken: tokens.wADA,
    rpcUrl: process.env.VUE_APP_MILKOMEDA_RPC!,
    blockExplorer: 'http://use-util.cloud.milkomeda.com:4000',
    confirmationTimeInMinutes: 2,
  },
}