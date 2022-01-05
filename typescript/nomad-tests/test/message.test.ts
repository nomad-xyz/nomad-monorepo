import { ethers, nomad } from 'hardhat';
import { expect } from 'chai';
import {
  TestMessage,
  TestMessage__factory,
} from '@nomad-xyz/contract-interfaces/dist/core';

const testCases = require('../../../vectors/message.json');

const remoteDomain = 1000;
const localDomain = 2000;

describe('Message', async () => {
  let messageLib: TestMessage;

  before(async () => {
    const [signer] = await ethers.getSigners();

    const Message = new TestMessage__factory(signer);
    messageLib = await Message.deploy();
  });

  it('Returns fields from a message', async () => {
    const [sender, recipient] = await ethers.getSigners();
    const nonce = 1;
    const body = ethers.utils.formatBytes32String('message');

    const message = nomad.formatMessage(
      remoteDomain,
      sender.address,
      nonce,
      localDomain,
      recipient.address,
      body,
    );

    expect(await messageLib.origin(message)).to.equal(remoteDomain);
    expect(await messageLib.sender(message)).to.equal(
      nomad.ethersAddressToBytes32(sender.address),
    );
    expect(await messageLib.nonce(message)).to.equal(nonce);
    expect(await messageLib.destination(message)).to.equal(localDomain);
    expect(await messageLib.recipient(message)).to.equal(
      nomad.ethersAddressToBytes32(recipient.address),
    );
    expect(await messageLib.recipientAddress(message)).to.equal(
      recipient.address,
    );
    expect(await messageLib.body(message)).to.equal(body);
  });

  it('Matches Rust-output NomadMessage and leaf', async () => {
    const origin = 1000;
    const sender = '0x1111111111111111111111111111111111111111';
    const nonce = 1;
    const destination = 2000;
    const recipient = '0x2222222222222222222222222222222222222222';
    const body = ethers.utils.arrayify('0x1234');

    const nomadMessage = nomad.formatMessage(
      origin,
      sender,
      nonce,
      destination,
      recipient,
      body,
    );

    const {
      origin: testOrigin,
      sender: testSender,
      nonce: testNonce,
      destination: testDestination,
      recipient: testRecipient,
      body: testBody,
      messageHash,
    } = testCases[0];

    expect(await messageLib.origin(nomadMessage)).to.equal(testOrigin);
    expect(await messageLib.sender(nomadMessage)).to.equal(testSender);
    expect(await messageLib.nonce(nomadMessage)).to.equal(testNonce);
    expect(await messageLib.destination(nomadMessage)).to.equal(
      testDestination,
    );
    expect(await messageLib.recipient(nomadMessage)).to.equal(testRecipient);
    expect(await messageLib.body(nomadMessage)).to.equal(
      ethers.utils.hexlify(testBody),
    );
    expect(await messageLib.leaf(nomadMessage)).to.equal(messageHash);
    expect(nomad.messageHash(nomadMessage)).to.equal(messageHash);
  });
});
