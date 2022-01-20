import wETHIcon from './assets/WETH.png'
import USDTIcon from './assets/USDT.png'
import DEVIcon from './assets/DEV.png'

import { TokenIdentifier } from '@nomad-xyz/sdk/nomad'

export type NetworkName = 'kovan' | 'moonbasealpha'
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


export const tokens: { [key: string]: TokenMetadata } = {
  WETH: {
    nativeNetwork: 'kovan', // must be lowercase
    symbol: 'WETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: WETH,
    nativeOnly: false,
  },
  ETH: {
    nativeNetwork: 'kovan',
    symbol: 'ETH',
    icon: wETHIcon,
    decimals: 18,
    tokenIdentifier: WETH,
    nativeOnly: true,
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
}

export const networks: { [key: string]: NetworkMetadata } = {
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
}