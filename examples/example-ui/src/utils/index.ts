import { networks, TokenMetadata } from '../config'

// determines if the token is native to the selected origin network
export function isNativeToken(network: string, token: TokenMetadata): boolean {
  
  const nativeToken = networks[network].
  return nativeToken.name === token.name
}
 