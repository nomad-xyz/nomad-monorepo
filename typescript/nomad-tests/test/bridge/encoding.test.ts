import { ethers } from 'hardhat';

import * as contracts from '@nomad-xyz/contract-interfaces/dist/bridge';

describe('Encoding', async () => {
  it('encodes', async () => {
    const [signer] = await ethers.getSigners();
    const factory = new contracts.TestEncoding__factory(signer);
    const instance = await factory.deploy();

    await instance.test();
  });
});
