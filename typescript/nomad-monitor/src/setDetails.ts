import { ethers } from 'ethers';
import { BridgeToken__factory } from '@nomad-xyz/contract-interfaces/dist/bridge';

// TODO: move to SDK
interface TokenDetails {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

// TODO: move to common file
function getRpcProviderFromNetwork(
  network: string,
): ethers.providers.JsonRpcProvider {
  let rpcUrl: string;
  switch (network) {
    case 'ethereum':
      rpcUrl = process.env.ETHEREUM_RPC!;
      break;
    case 'moonbeam':
      rpcUrl = process.env.MOONBEAM_RPC!;
      break;
    default:
      throw new Error(`No RPC url for network ${network}`);
  }

  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

function getSigner(network: string): ethers.Signer {
  const privKey = process.env.SET_DETAILS_KEY!;
  const provider = getRpcProviderFromNetwork(network);
  return new ethers.Wallet(privKey!.toString(), provider);
}

async function setDetailsForToken(
  network: string,
  signer: ethers.Signer,
  details: TokenDetails,
) {
  const { address, name, symbol, decimals } = details;

  const token = BridgeToken__factory.connect(address, signer);
  const tx = await token.setDetails(name, symbol, decimals);
  await tx.wait(3);

  console.log('Successfully set details for token!');
  console.log(`- network: ${network}`);
  console.log(`- address: ${address}`);
  console.log(`- name: ${name}`);
  console.log(`- symbol: ${symbol}`);
  console.log(`- decimals: ${decimals}`);

  console.log(`\n Transaction hash: ${tx.hash}`);
}

/* Usage:
 * 1. set SET_DETAILS_KEY in .env file (as well as RPC urls)
 * 2. npm run set-details <network> <token_address> <token_name> <symbol> <decimals>
 */
(async () => {
  const args = process.argv.slice(2);
  const network = args[0];
  const address = args[1];
  const name = args[2];
  const symbol = args[3];
  const decimals = parseInt(args[4]);

  const signer = getSigner(network);
  const details = {
    address,
    name,
    symbol,
    decimals,
  };

  await setDetailsForToken(network, signer, details);
})();
