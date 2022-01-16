import { networks, TokenMetadata, NetworkMetadata } from '../config'

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

/**
 * Retrieves network config given a domain ID
 */
export function getNetworkByDomainID(domainID: number): NetworkMetadata {
  for (const network in networks) {
    if (networks[network].domainID === domainID) {
      return networks[network]
    }
  }
  throw new Error(`network not found: ${domainID}`)
}