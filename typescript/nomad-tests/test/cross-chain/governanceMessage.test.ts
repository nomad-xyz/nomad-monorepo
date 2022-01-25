import * as contracts from '@nomad-xyz/contract-interfaces/core';
import { ethers } from 'hardhat';
import { Signer } from 'lib/types';
import { expect } from 'chai';

import { Call } from '@nomad-xyz/sdk/nomad/govern';
import * as utils from '@nomad-xyz/sdk/nomad/govern/utils';
import { randomBytes } from 'crypto';

function randomCall(): Call {
  const dataLen = Math.floor(Math.random() * 1000);
  return {
    to: ethers.utils.hexlify(randomBytes(32)),
    data: ethers.utils.hexlify(randomBytes(dataLen)),
  };
}

function randomBatch(): Call[] {
  const numCalls = Math.floor(Math.random() * 9) + 1;
  const testCalls = [...new Array(numCalls)].map(randomCall);
  return testCalls;
}

describe.only('GovernanceMessage', async () => {
  let instance: contracts.TestGovernanceMessage;
  let signer: Signer;

  before(async () => {
    [signer] = await ethers.getSigners();
    const factory = new contracts.TestGovernanceMessage__factory(signer);
    instance = await factory.deploy();
  });

  it('serializes calls', async () => {
    for (let i = 0; i < 50; i++) {
      const testCall = randomCall();
      const sol = await instance.serializeCall(testCall);
      const ts = utils.serializeCall(testCall);
      expect(sol).to.equal(ts);
    }
  });

  it('Calculates batch hashes properly', async () => {
    // variable number of calls
    for (let i = 0; i < 50; i++) {
      const testCalls = randomBatch();
      const sol = await instance.formatBatch(testCalls);
      const ts = utils.formatBatch(testCalls);
      expect(sol).to.equal(ts);
    }
  });

  it('succesfully performs validBatch tests', async () => {
    expect(await instance.isValidBatch('0x00')).to.be.false;
    for (let i = 0; i < 25; i++) {
      const testBatch = utils.formatBatch(randomBatch());
      expect(await instance.isValidBatch(testBatch)).to.be.true;
    }
  });
});
