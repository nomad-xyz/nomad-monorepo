import * as ethers from 'ethers';

/*
 * Converts address to Bytes32
 *
 * @param address - the address
 * @return The address as bytes32
 */
export function toBytes32(address: string): string {
  return '0x' + '00'.repeat(12) + address.slice(2);
}

/*
 * Encoded call to a function,
 * where to and data is encoded.
 */
export type CallData = {
  to: ethers.ethers.utils.BytesLike;
  data: ethers.ethers.utils.BytesLike;
};

/*
 * Formats function call into {to, data} struct,
 * where to and data is encoded.
 *
 * @param destinationContract - contract to be called
 * @param functionStr - name of the function
 * @param functionArgs - arguments to the call
 * @return The encoded call
 */
export function formatCall(
  destinationContract: ethers.Contract,
  functionStr: string,
  functionArgs: any[],
): CallData {
  // Set up data for call message
  const func = destinationContract.interface.getFunction(functionStr);
  const data = destinationContract.interface.encodeFunctionData(
    func,
    functionArgs,
  );

  return {
    to: toBytes32(destinationContract.address),
    data: data,
  };
}
