import * as contracts from '@nomad-xyz/contract-interfaces/dist/core';
import { ethers } from 'hardhat';
import { Signer } from 'lib/types';
import { expect } from 'chai';

describe('GovernanceMessage', async () => {
  let instance: contracts.TestGovernanceMessage;
  let signer: Signer;

  const testCall = {
    to: ethers.constants.HashZero,
    data: '0x',
  };

  const serializedTestCall = '0x' + '00'.repeat(36);
  const serializedTestCalls = ethers.utils.hexConcat([
    '0x01',
    serializedTestCall,
  ]);
  const testBatchHash = ethers.utils.keccak256(serializedTestCalls);
  const testBatch = ethers.utils.hexConcat(['0x01', testBatchHash]);

  const doubleTestCalls = ethers.utils.hexConcat([
    '0x02',
    serializedTestCall,
    serializedTestCall,
  ]);
  const doubleTestBatchHash = ethers.utils.keccak256(doubleTestCalls);
  const doubleTestBatch = ethers.utils.hexConcat(['0x01', doubleTestBatchHash]);

  before(async () => {
    [signer] = await ethers.getSigners();
    const factory = new contracts.TestGovernanceMessage__factory(signer);
    instance = await factory.deploy();
  });

  it('serializes calls', async () => {
    let output = await instance.serializeCall(testCall);
    expect(output).to.equal(serializedTestCall);
  });

  it('formats batches properly', async () => {
    let output = await instance.formatBatch([testCall]);
    expect(output).to.equal(testBatch);
    output = await instance.formatBatch([testCall, testCall]);
    expect(output).to.equal(doubleTestBatch);
  });

  it('succesfully performs validBatch tests', async () => {
    expect(await instance.isValidBatch(testBatch)).to.be.true;
    expect(await instance.isValidBatch(doubleTestBatch)).to.be.true;
    expect(await instance.isValidBatch('0x00')).to.be.false;
  });
});
