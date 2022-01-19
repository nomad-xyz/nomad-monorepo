import { NomadContext, dev } from '@nomad-xyz/sdk'
import { TokenIdentifier } from '@nomad-xyz/sdk/nomad'
import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, providers, utils } from 'ethers'
import { TransferMessage } from '@nomad-xyz/sdk/nomad/messages/BridgeMessage'
import { ERC20__factory } from '@nomad-xyz/contract-interfaces/bridge'

import {
  networks,
  tokens,
  NetworkName,
  TokenName,
  NetworkMetadata,
  TokenMetadata
} from '../config'

const { ethereum } = window as any
const nomad: NomadContext = instantiateNomad()

export interface SendData {
  isNative: boolean
  originNetwork: number
  destNetwork: number
  asset: TokenIdentifier
  amnt: number
  recipient: string
  ethersOverrides: object
}

export type TXData = {
  network: NetworkName
  hash: string
}

function instantiateNomad(): NomadContext {
  // configure for mainnet/testnet
  const nomadContext: NomadContext = dev

  // register rpc provider and signer for each network
  Object.values(networks).forEach(({ name, rpcUrl }) => {
    nomadContext.registerRpcProvider(name, rpcUrl)
  })

  return nomadContext
}

/**
 * determines if the token is native to the selected origin network
 */
export function isNativeToken(network: string, token: TokenMetadata): boolean {
  return token.nativeOnly && token.nativeNetwork === network 
}

/**
 * Retrieves network config given a chain ID
 */
export function getNetworkByChainID(chainID: number): NetworkMetadata | undefined {
  for (const network in networks) {
    if (networks[network].chainID === chainID) {
      return networks[network]
    }
  }
  // unsupported network
  console.error(`network not found: ${chainID}`)
}

export function getNetworkByDomainID(domainID: number): NetworkMetadata {
  const name = Object.keys(networks).find(n => {
    return networks[n].domainID === domainID
  })
  return networks[name!]
}

export async function getNomadBalances(
  tokenName: TokenName,
  address: string
): Promise<Record<number, string> | undefined> {
  const { tokenIdentifier, decimals, symbol } = tokens[tokenName]

  // get representations of token
  const representations = await nomad.resolveRepresentations(tokenIdentifier)
  const balances: Record<number, string> = {}
  let domain, instance

  for ([domain, instance] of representations.tokens.entries()) {
    const balanceBN = await instance.balanceOf(address)
    balances[domain] = utils.formatUnits(balanceBN.toString(), decimals)
  }
  return balances
}

export async function getNomadBalance(
  token: TokenIdentifier,
  address: string,
  domain: number
): Promise<BigNumber | undefined> {
  let key, instance, balance
  const representations = await nomad.resolveRepresentations(token)
  const tokenEntries = representations.tokens.entries()

  for ([key, instance] of tokenEntries) {
    if (domain === key) {
      balance = await instance.balanceOf(address)
      return balance
    }
  }
}

export async function getBalanceFromWallet(networkName: NetworkName, tokenName: TokenName, address: string) {
  console.log('gettingbalanceFromwallet')

  const network = networks[networkName]
  const domain = network.domainID
  const token = tokens[tokenName]

  let balance
  // native assets
  if (token.tokenIdentifier.domain === networkName) {
    const provider = nomad.getProvider(networkName)!
    if (network.nativeToken === token) {
      // get balance of primary native asset
      console.log('getting native token balance')
      balance = provider?.getBalance(address)
    } else {
      // get balance of ERC20 token
      console.log('getting balance of ERC20 token: ', tokenName)
      const tokenAddress = token.tokenIdentifier.id
      const tokenContract = ERC20__factory.connect(tokenAddress as string, provider)
      balance = await tokenContract.balanceOf(address)
    }
  } else {
    // get balance ofNomad representational assets
    console.log('getting representational token balance')
    balance = await getNomadBalance(
      token.tokenIdentifier,
      address,
      domain
    )
  }

  return balance
}

export function registerNewSigner(networkName: NetworkName) {
  console.log('registering signer for ', networkName)
  // get current provider and signer
  const provider = new providers.Web3Provider(ethereum)
  const newSigner = provider.getSigner()

  // clear current signers and re-register
  nomad.clearSigners()
  const missingProviders = nomad.missingProviders
  missingProviders.forEach((domain: number) => {
    const network = getNetworkByDomainID(domain)
    nomad.registerRpcProvider(networkName, network.rpcUrl)
  })

  nomad.registerSigner(networkName, newSigner)
}

export async function send(
  originNetworkName: NetworkName,
  destinationNetworkName: NetworkName,
  amount: number,
  tokenName: TokenName,
  destinationAddr: string
): Promise<TransferMessage> {
  const token = tokens[tokenName]
  const isNative = isNativeToken(originNetworkName, token)

  // get Nomad domain
  const originDomain = networks[originNetworkName].domainID
  const destDomain = networks[destinationNetworkName].domainID
  // 

  // format amount according to token decimals
  const amnt = utils.parseUnits(amount.toString(), token.decimals)

  let transferMessage: TransferMessage
  // if ETH Helper contract exists, native token must be wrapped
  // before sending, use sendNative
  const ethHelper = nomad.getBridge(originDomain)?.ethHelper
  if (ethHelper && isNative) {
    console.log('send native')
    transferMessage = await nomad.sendNative(
      originDomain,
      destDomain,
      amnt,
      destinationAddr
    )
  } else {
    console.log('send ERC-20')
    transferMessage = await nomad.send(
      originDomain,
      destDomain,
      token.tokenIdentifier,
      amnt,
      destinationAddr,
    )
  }
  console.log('tx sent!!!', transferMessage)
  return transferMessage
}

export async function getGasPrice(network: string | number) {
  const provider = nomad.getProvider(network)
  const gasPrice = await provider?.getGasPrice()
  return gasPrice
}

export async function getTxMessage(tx: TXData): Promise<TransferMessage> {
  const { network, hash } = tx
  return await TransferMessage.singleFromTransactionHash(
    nomad,
    network,
    hash
  )
}

export async function switchNetwork(networkName: string) {
  console.log('set wallet network')

  if (!ethereum) return

  const network = networks[networkName]
  const hexChainId = '0x' + network.chainID.toString(16)
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    })
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            rpcUrls: [network.rpcUrl],
            chainName: network.name,
            nativeCurrency: {
              name: network.nativeToken.symbol,
              symbol: network.nativeToken.symbol,
              decimals: network.nativeToken.decimals,
            },
          },
        ],
      })
    } 

    throw switchError
  }

  return network.name
}

export async function connectWallet() {
  // if window.ethereum does not exist, do not connect
  if (!ethereum) return

  await ethereum.request({ method: 'eth_requestAccounts' })

  // get provider/signer
  const provider = await getMetamaskProvider()
  const signer = await provider.getSigner()

  // return address
  return await signer.getAddress()
}

export async function getMetamaskNetwork() {
  const provider = await getMetamaskProvider()
  const { chainId } = await provider.ready
  return getNetworkByChainID(chainId)!.name
}

export async function getMetamaskProvider(): Promise<Web3Provider> {
  const provider = new Web3Provider(ethereum)
  await provider.ready
  // const signer = provider.getSigner()
  // console.log({ provider, signer })
  return Promise.resolve(provider)
}

export async function getNetwork(provider: Web3Provider): Promise<string> {
  const { chainId, name } = await provider.ready
  const network = getNetworkByChainID(chainId) || { name }
  return network.name
}
