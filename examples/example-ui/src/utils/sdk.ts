import { NomadContext, dev } from '@nomad-xyz/sdk'
import { TokenIdentifier } from '@nomad-xyz/sdk/nomad'
import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, providers } from 'ethers'
import { TransferMessage } from '@nomad-xyz/sdk/nomad/messages/BridgeMessage'

import { networks, tokens, NetworkName, TokenName, NetworkMetadata } from '../config'
import { getNetworkByChainID } from '../utils/index'
import { ERC20__factory } from '@nomad-xyz/contract-interfaces/bridge'

let nomad: NomadContext = instantiateNomad()
const { ethereum } = window as any

function instantiateNomad(): NomadContext {
  // configure for mainnet/testnet
  const nomadContext: NomadContext = dev

  // register rpc provider and signer for each network
  Object.values(networks).forEach(({ name, rpcUrl }) => {
    nomadContext.registerRpcProvider(name, rpcUrl)
  })

  return nomadContext
}

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

export function getNetworkByDomainID(domainID: number): NetworkMetadata {
  const name = Object.keys(networks).find(n => {
    return networks[n].domainID === domainID
  })
  return networks[name!]
}

export async function getNomadBalances(
  token: TokenIdentifier,
  address: string
): Promise<Record<number, BigNumber> | undefined> {
  // get representations of token
  const representations = await nomad.resolveRepresentations(token)
  const balances: Record<number, BigNumber> = {}
  let domain, instance

  for ([domain, instance] of representations.tokens.entries()) {
    console.log({ instance })
    balances[domain] = await instance.balanceOf(address)
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

export async function send(payload: SendData): Promise<TransferMessage> {
  console.log('sending...', payload)
  const {
    isNative,
    originNetwork,
    destNetwork,
    asset,
    amnt,
    recipient,
  } = payload

  // get Nomad domain
  const originDomain = nomad.resolveDomain(originNetwork)
  const destDomain = nomad.resolveDomain(destNetwork)

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
      recipient
    )
  } else {
    console.log('send ERC-20')
    transferMessage = await nomad.send(
      originDomain,
      destDomain,
      asset,
      amnt,
      recipient,
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

  // set network, if supported
  const { chainId } = await provider.ready

  // get and set address
  const address = await signer.getAddress()
  const network = getNetworkByChainID(chainId)!

  return {
    walletAddress: address,
    walletNetwork: network.name,
  }
}

export async function getMetamaskProvider(): Promise<Web3Provider> {
  const provider = new Web3Provider(ethereum)
  await provider.ready
  const signer = provider.getSigner()
  console.log({ provider, signer })
  return Promise.resolve(provider)
}

export async function getNetwork(provider: Web3Provider): Promise<string> {
  const { chainId, name } = await provider.ready
  const network = getNetworkByChainID(chainId) || { name }
  return network.name
}
