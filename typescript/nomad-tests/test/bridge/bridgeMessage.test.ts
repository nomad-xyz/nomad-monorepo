import { ethers, bridge } from 'hardhat';
const { BridgeMessageTypes } = bridge;
import { BytesLike } from 'ethers';
import { expect } from 'chai';
import { toBytes32 } from 'lib/utils';
import { formatTokenId, getDetailsHash } from 'lib/bridge';
import * as types from 'lib/types';
import {
  TestBridgeMessage__factory,
  TestBridgeMessage,
} from '@nomad-xyz/contract-interfaces/bridge';
import { TokenIdentifier } from '@nomad-xyz/sdk/nomad';

describe('BridgeMessage', async () => {
  let bridgeMessage: TestBridgeMessage;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerId = toBytes32(deployerAddress).toLowerCase();
  const TOKEN_VALUE = 0xffff;

  // tokenId
  const testTokenId: TokenIdentifier = {
    domain: 1,
    id: '0x' + '11'.repeat(32),
  };
  const testName = 'NomadTest';
  const testSymbol = 'TEST';
  const testDecimals = 18;

  const tokenIdBytes = formatTokenId(
    testTokenId.domain as number,
    testTokenId.id as string,
  );

  const detailsHash = getDetailsHash(testName, testSymbol, testDecimals);

  // transfer action/message
  const transferAction: types.TransferAction = {
    type: BridgeMessageTypes.TRANSFER,
    recipient: deployerId,
    amount: TOKEN_VALUE,
    detailsHash,
  };
  const transferBytes = bridge.serializeTransferAction(transferAction);
  const transferMessage: types.Message = {
    tokenId: testTokenId,
    action: transferAction,
  };
  const transferMessageBytes = bridge.serializeMessage(transferMessage);

  // fastTransfer action/message
  const fastTransferAction: types.FastTransferAction = {
    type: BridgeMessageTypes.FAST_TRANSFER,
    recipient: deployerId,
    amount: TOKEN_VALUE,
    detailsHash,
  };
  const fastTransferBytes =
    bridge.serializeFastTransferAction(fastTransferAction);
  const fastTransferMessage: types.Message = {
    tokenId: testTokenId,
    action: fastTransferAction,
  };
  const fastTransferMessageBytes = bridge.serializeMessage(fastTransferMessage);

  before(async () => {
    const [signer] = await ethers.getSigners();
    const bridgeMessageFactory = new TestBridgeMessage__factory(signer);
    bridgeMessage = await bridgeMessageFactory.deploy();
  });

  it('generates expected details hash', async () => {
    const expectedDetailsHash = getDetailsHash(
      testName,
      testSymbol,
      testDecimals,
    );
    const detailsHash = await bridgeMessage.testFormatDetailsHash(
      testName,
      testSymbol,
      testDecimals,
    );

    expect(detailsHash).to.equal(expectedDetailsHash);
  });

  it('validates actions', async () => {
    const invalidAction = '0x00';

    // transfer message is valid
    let isAction = await bridgeMessage.testIsValidAction(
      transferBytes,
      BridgeMessageTypes.TRANSFER,
    );
    expect(isAction).to.be.true;
    // fast transfer message is valid
    isAction = await bridgeMessage.testIsValidAction(
      fastTransferBytes,
      BridgeMessageTypes.INVALID,
    );
    expect(isAction).to.be.false;

    // not a valid message type
    isAction = await bridgeMessage.testIsValidAction(
      transferBytes,
      BridgeMessageTypes.INVALID,
    );
    expect(isAction).to.be.false;
    // not a valid action type
    isAction = await bridgeMessage.testIsValidAction(
      invalidAction,
      BridgeMessageTypes.TRANSFER,
    );
    expect(isAction).to.be.false;
  });

  it('validates message length', async () => {
    const invalidMessageLen = '0x' + '03'.repeat(38);
    // valid transfer message
    let isValidLen = await bridgeMessage.testIsValidMessageLength(
      transferMessageBytes,
    );
    expect(isValidLen).to.be.true;
    // valid fast transfer message
    isValidLen = await bridgeMessage.testIsValidMessageLength(
      fastTransferMessageBytes,
    );
    expect(isValidLen).to.be.true;
    // invalid message length
    isValidLen = await bridgeMessage.testIsValidMessageLength(
      invalidMessageLen,
    );
    expect(isValidLen).to.be.false;
    // TODO: check that message length matches type?
  });

  it('formats message', async () => {
    // formats message
    const newMessage = await bridgeMessage.testFormatMessage(
      tokenIdBytes,
      transferBytes,
      BridgeMessageTypes.TOKEN_ID,
      BridgeMessageTypes.TRANSFER,
    );
    expect(newMessage).to.equal(transferMessageBytes);
    // reverts with bad tokenId
    await expect(
      bridgeMessage.testFormatMessage(
        tokenIdBytes,
        transferBytes,
        BridgeMessageTypes.INVALID,
        BridgeMessageTypes.TRANSFER,
      ),
    ).to.be.reverted;
    // reverts with bad action
    await expect(
      bridgeMessage.testFormatMessage(
        tokenIdBytes,
        transferBytes,
        BridgeMessageTypes.TOKEN_ID,
        BridgeMessageTypes.INVALID,
      ),
    ).to.be.revertedWith('!action');
  });

  it('returns correct message type', async () => {
    // transfer message
    let type = await bridgeMessage.testMessageType(transferMessageBytes);
    expect(type).to.equal(BridgeMessageTypes.TRANSFER);
    type = await bridgeMessage.testMessageType(fastTransferMessageBytes);
    expect(type).to.equal(BridgeMessageTypes.FAST_TRANSFER);
  });

  it('checks message type', async () => {
    // transfer message
    let isTransfer = await bridgeMessage.testIsTransfer(transferBytes);
    expect(isTransfer).to.be.true;
    isTransfer = await bridgeMessage.testIsTransfer(fastTransferBytes);
    expect(isTransfer).to.be.false;

    // fast transfer message
    let isFastTransfer = await bridgeMessage.testIsFastTransfer(transferBytes);
    expect(isFastTransfer).to.be.false;
    isFastTransfer = await bridgeMessage.testIsFastTransfer(fastTransferBytes);
    expect(isFastTransfer).to.be.true;
  });

  it('fails for wrong action type', async () => {
    const invalidType = '0x00';
    const badTransfer: BytesLike = invalidType + transferBytes.slice(4);

    const isTransfer = await bridgeMessage.testIsTransfer(badTransfer);
    expect(isTransfer).to.be.false;

    let isFastTransfer = await bridgeMessage.testIsFastTransfer(badTransfer);
    expect(isFastTransfer).to.be.false;
  });

  it('formats transfer action', async () => {
    const { recipient, amount } = transferAction;
    const newTransfer = await bridgeMessage.testFormatTransfer(
      recipient,
      amount,
      detailsHash,
      false,
    );
    expect(newTransfer).to.equal(transferBytes);
  });

  it('formats fast transfer action', async () => {
    const { recipient, amount } = transferAction;
    const newTransfer = await bridgeMessage.testFormatTransfer(
      recipient,
      amount,
      detailsHash,
      true,
    );
    expect(newTransfer).to.equal(fastTransferBytes);
  });

  it('formats token id', async () => {
    const newTokenId = await bridgeMessage.testFormatTokenId(
      testTokenId.domain,
      testTokenId.id,
    );
    expect(newTokenId).to.equal(tokenIdBytes);
  });

  it('returns elements of a token id', async () => {
    const evmId = '0x' + (testTokenId.id as string).slice(26);
    const [domain, id, newEvmId] = await bridgeMessage.testSplitTokenId(
      tokenIdBytes,
    );
    expect(domain).to.equal(testTokenId.domain);
    expect(id).to.equal(testTokenId.id);
    expect(newEvmId).to.equal(evmId);

    await bridgeMessage.testSplitTokenId(transferMessageBytes);
  });

  it('returns elements of a transfer action', async () => {
    const evmRecipient = deployerAddress;

    const [type, recipient, newEvmRecipient, amount] =
      await bridgeMessage.testSplitTransfer(transferBytes);
    expect(type).to.equal(BridgeMessageTypes.TRANSFER);
    expect(recipient).to.equal(transferAction.recipient);
    expect(newEvmRecipient).to.equal(evmRecipient);
    expect(amount).to.equal(transferAction.amount);
  });

  it('returns elements of a message', async () => {
    const [newTokenId, action] = await bridgeMessage.testSplitMessage(
      transferMessageBytes,
    );
    expect(newTokenId).to.equal(tokenIdBytes);
    expect(action).to.equal(transferBytes);
  });

  it('fails if message type is not valid', async () => {
    const revertMsg = 'Validity assertion failed';

    await expect(
      bridgeMessage.testMustBeMessage(transferBytes),
    ).to.be.revertedWith(revertMsg);
  });
});
