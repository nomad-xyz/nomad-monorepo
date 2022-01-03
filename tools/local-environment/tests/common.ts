import { Nomad, utils, Network } from "../src";
import type { TokenIdentifier } from "@nomad-xyz/sdk/nomad/tokens";
import { ERC20 } from "@nomad-xyz/contract-interfaces/dist/bridge/ERC20";
import { ethers } from "ethers";
import { TransferMessage } from "@nomad-xyz/sdk/nomad";

//
/**
 * Sends several amounts of tokens from network "From" to "To"
 * to particular reciver and then test that they are received
 *
 * @param n - Nomad instance which has both "from" and "to" networks
 * @param from - instance of Network *from* which the tokens will be sent
 * @param to - instance of Network *to* which the tokens will be sent
 * @param token - token identifier according to Nomad
 * @param receiver - receiver address as string at network *to*
 * @param amounts - array of amounts to be sent in bulk
 * @returns a promise of pair [`success`, `tokenContract` ERC20 if it was created]
 */
export async function sendTokensAndConfirm(
  n: Nomad,
  from: Network,
  to: Network,
  token: TokenIdentifier,
  receiver: string,
  amounts: ethers.BigNumberish[]
): Promise<[boolean, ERC20]> {
  const ctx = n.getMultiprovider();

  let amountTotal = ethers.BigNumber.from(0);

  let result: TransferMessage | undefined = undefined;
  for (const amountish of amounts) {
    const amount = ethers.BigNumber.from(amountish);

    result = await ctx.send(from.name, to.name, token, amount, receiver, {
      gasLimit: 10000000,
    });

    amountTotal = amountTotal.add(amount);

    console.log(
      `Sent from ${from.name} to ${to.name} ${amount.toString()} tokens`
    );
  }

  if (!result) throw new Error(`Didn't get the result from transactions`);

  console.log(
    `Waiting for the last transactions of ${amounts.length} to be delivered:`
  );

  await result.wait();

  console.log(`Waiting for asset to be created at destination!`);

  // Waiting until the token contract is created at destination network tom
  let waiter = new utils.Waiter(
    async () => {
      const tokenContract = await result!.assetAtDestination();

      if (
        tokenContract?.address !== "0x0000000000000000000000000000000000000000"
      ) {
        console.log(
          `Hurray! Asset was created at destination:`,
          tokenContract!.address
        );
        return tokenContract;
      }
    },
    3 * 60_000,
    2_000
  );

  const [tokenContract, tokenCreated] = await waiter.wait();
  if (!tokenCreated) throw new Error(`Timedout token creation at destination`);

  if (!tokenContract) throw new Error(`no token contract`);
  // const _tokenContract: xapps.ERC20 = tokenContract;

  let newBalance = await tokenContract!.balanceOf(receiver);

  // Waiting until all 3 transactions will land at tom
  let waiter2 = new utils.Waiter(
    async () => {
      if (newBalance.eq(amountTotal)) {
        return true;
      } else {
        newBalance = await tokenContract!.balanceOf(receiver);
        console.log(`New balance:`, parseInt(newBalance.toString()));
      }
    },
    4 * 60_000,
    2_000
  );

  const [, success] = await waiter2.wait();

  return [success, tokenContract!];
}
