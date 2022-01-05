import { ethers, bridge } from 'hardhat';
import { BytesLike, Signer } from 'ethers';
import { expect } from 'chai';

import * as types from 'lib/types';
import { toBytes32 } from 'lib/utils';
import TestBridgeDeploy from '@nomad-xyz/deploy/dist/src/bridge/TestBridgeDeploy';
import { TokenIdentifier } from '@nomad-xyz/sdk/dist/nomad';

const { BridgeMessageTypes } = bridge;
[true, false].map((ENABLE_FAST) => {
  describe('EthHelper', async () => {
    describe(ENABLE_FAST ? 'Fast Liquidity' : 'No Fast Liquidity', async () => {
      let deploy: TestBridgeDeploy;

      let deployer: Signer;
      let deployerAddress: string;
      let deployerId: string;

      let recipient: Signer;
      let recipientAddress: string;
      let recipientId: string;

      let transferToSelfMessage: string;
      let transferMessage: string;
      let detailsHash: BytesLike;

      const value = 1;

      before(async () => {
        [deployer, recipient] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        deployerId = toBytes32(deployerAddress).toLowerCase();
        recipientAddress = await recipient.getAddress();
        recipientId = toBytes32(recipientAddress).toLowerCase();
        deploy = await TestBridgeDeploy.deploy(ethers, deployer);

        const name = await deploy.mockWeth.name();
        const symbol = await deploy.mockWeth.symbol();
        const decimals = await deploy.mockWeth.decimals();
        detailsHash = bridge.getDetailsHash(name, symbol, decimals);

        const tokenId: TokenIdentifier = {
          domain: deploy.localDomain,
          id: toBytes32(deploy.mockWeth.address),
        };
        const transferToSelfMessageObj: types.Message = {
          tokenId,
          action: {
            type: ENABLE_FAST
              ? BridgeMessageTypes.FAST_TRANSFER
              : BridgeMessageTypes.TRANSFER,
            recipient: deployerId,
            amount: value,
            detailsHash,
          },
        };
        transferToSelfMessage = bridge.serializeMessage(
          transferToSelfMessageObj,
        );

        const transferMessageObj: types.Message = {
          tokenId,
          action: {
            type: ENABLE_FAST
              ? BridgeMessageTypes.FAST_TRANSFER
              : BridgeMessageTypes.TRANSFER,
            recipient: recipientId,
            amount: value,
            detailsHash,
          },
        };
        transferMessage = bridge.serializeMessage(transferMessageObj);
      });

      it('send function', async () => {
        let sendTx = deploy.contracts.ethHelper!.send(
          deploy.remoteDomain,
          ENABLE_FAST,
          {
            value,
          },
        );

        await expect(sendTx)
          .to.emit(deploy.mockCore, 'Enqueue')
          .withArgs(deploy.remoteDomain, deployerId, transferToSelfMessage);
      });

      it('sendTo function', async () => {
        let sendTx = deploy.contracts.ethHelper!.sendTo(
          deploy.remoteDomain,
          recipientId,
          ENABLE_FAST,
          {
            value,
          },
        );

        await expect(sendTx)
          .to.emit(deploy.mockCore, 'Enqueue')
          .withArgs(deploy.remoteDomain, deployerId, transferMessage);
      });

      it('sendToEVMLike function', async () => {
        let sendTx = deploy.contracts.ethHelper!.sendToEVMLike(
          deploy.remoteDomain,
          recipientAddress,
          ENABLE_FAST,
          {
            value,
          },
        );

        await expect(sendTx)
          .to.emit(deploy.mockCore, 'Enqueue')
          .withArgs(deploy.remoteDomain, deployerId, transferMessage);
      });
    });
  });
});
