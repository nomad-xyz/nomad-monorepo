import { expect } from 'chai';
import { bridge, ethers } from 'hardhat';
import { BigNumber, BytesLike } from 'ethers';

import * as types from 'lib/types';
import { toBytes32 } from 'lib/utils';
import TestBridgeDeploy from '@nomad-xyz/deploy/dist/src/bridge/TestBridgeDeploy';
import {
  BridgeToken,
  BridgeToken__factory,
} from '@nomad-xyz/contract-interfaces/dist/bridge';
const { BridgeMessageTypes } = bridge;

[true, false].map((ENABLE_FAST) => {
  describe('TokenRegistry', async () => {
    describe(ENABLE_FAST ? 'Fast Liquidity' : 'No Fast Liquidity', async () => {
      let deployer: types.Signer;
      let deployerAddress: string;
      let deployerId: BytesLike;
      let deploy: TestBridgeDeploy;
      let detailsHash: BytesLike;

      const PROTOCOL_PROCESS_GAS = 800_000;

      // Numerical token value
      const TOKEN_VALUE = 0xffff;
      const mockNonce = 1;

      before(async () => {
        // populate deployer signer
        [deployer] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        deployerId = toBytes32(await deployer.getAddress()).toLowerCase();
      });

      describe('custom token representations', async () => {
        let transferMessage: string;
        let defaultRepr: BridgeToken;
        let customRepr: BridgeToken;
        const VALUE = `0xffffffffffffffff`;

        before(async () => {
          deploy = await TestBridgeDeploy.deploy(ethers, deployer);

          detailsHash = bridge.getDetailsHash(
            deploy.testName,
            deploy.testSymbol,
            deploy.testDecimals,
          );

          // generate transfer action
          const transferMessageObj: types.Message = {
            tokenId: deploy.testTokenId,
            action: {
              type: ENABLE_FAST
                ? BridgeMessageTypes.FAST_TRANSFER
                : BridgeMessageTypes.TRANSFER,
              recipient: deployerId,
              amount: VALUE,
              detailsHash,
            },
          };
          transferMessage = bridge.serializeMessage(transferMessageObj);

          // first send in a transfer to create the repr
          let handle = await deploy.bridgeRouter!.handle(
            deploy.remoteDomain,
            mockNonce,
            deployerId,
            transferMessage,
          );
          await handle.wait();

          const representation = await deploy.getTestRepresentation();
          expect(representation).to.not.be.undefined;
          defaultRepr = representation!;
          expect(await defaultRepr.balanceOf(deployerAddress)).to.equal(
            BigNumber.from(VALUE),
          );

          // setup custom
          customRepr = await new BridgeToken__factory(deployer).deploy();
          await customRepr.initialize();
          expect(await customRepr.balanceOf(deployerAddress)).to.equal(
            BigNumber.from(0),
          );
        });

        it('migrate errors if old === new', async () => {
          const migrate = deploy.bridgeRouter!.migrate(defaultRepr.address);
          await expect(migrate).to.be.revertedWith('!different');
        });

        it('migrate errors if custom token is not enrolled', async () => {
          const migrate = deploy.bridgeRouter!.migrate(customRepr.address);
          await expect(migrate).to.be.revertedWith('!repr');
        });

        it('errors if no mint/burn privileges', async () => {
          const enrollTx = deploy.bridgeRouter!.enrollCustom(
            deploy.remoteDomain,
            deploy.testToken,
            customRepr.address,
          );

          await expect(enrollTx).to.be.revertedWith(
            'Ownable: caller is not the owner',
          );
        });

        it('registers the custom token', async () => {
          await customRepr.transferOwnership(deploy.bridgeRouter!.address);

          const enrollTx = deploy.bridgeRouter!.enrollCustom(
            deploy.remoteDomain,
            deploy.testToken,
            customRepr.address,
          );

          await expect(enrollTx).to.not.be.reverted;
          expect(
            await deploy.tokenRegistry!['getLocalAddress(uint32,bytes32)'](
              deploy.remoteDomain,
              deploy.testToken,
            ),
          ).to.equal(customRepr.address);

          let [domain, token] = await deploy.tokenRegistry!.getCanonicalTokenId(
            customRepr.address,
          );
          expect(domain).to.equal(deploy.remoteDomain);
          expect(token).to.equal(deploy.testToken);

          [domain, token] = await deploy.tokenRegistry!.getCanonicalTokenId(
            defaultRepr.address,
          );
          expect(domain).to.equal(deploy.remoteDomain);
          expect(token).to.equal(deploy.testToken);
        });

        it('mints incoming tokens in the custom repr', async () => {
          const defaultBalance = await defaultRepr.balanceOf(deployerAddress);

          // first send in a transfer to create the repr
          await deploy.bridgeRouter!.handle(
            deploy.remoteDomain,
            mockNonce,
            deployerId,
            transferMessage,
          );
          // did not mint default
          expect(await defaultRepr.balanceOf(deployerAddress)).to.equal(
            defaultBalance,
          );
          // did mint custom
          expect(await customRepr.balanceOf(deployerAddress)).to.equal(
            BigNumber.from(VALUE),
          );
        });

        it('allows outbound transfers of both assets', async () => {
          const smallTransfer: types.Message = {
            tokenId: deploy.testTokenId,
            action: {
              type: ENABLE_FAST
                ? BridgeMessageTypes.FAST_TRANSFER
                : BridgeMessageTypes.TRANSFER,
              recipient: deployerId,
              amount: TOKEN_VALUE,
              detailsHash,
            },
          };
          const smallTransferMessage = bridge.serializeMessage(smallTransfer);

          const defaultSendTx = await deploy.bridgeRouter!.send(
            defaultRepr.address,
            TOKEN_VALUE,
            deploy.remoteDomain,
            deployerId,
            ENABLE_FAST,
          );
          await expect(defaultSendTx)
            .to.emit(deploy.mockCore, 'Enqueue')
            .withArgs(deploy.remoteDomain, deployerId, smallTransferMessage);

          const customSendTx = await deploy.bridgeRouter!.send(
            customRepr.address,
            TOKEN_VALUE,
            deploy.remoteDomain,
            deployerId,
            ENABLE_FAST,
          );
          await expect(customSendTx)
            .to.emit(deploy.mockCore, 'Enqueue')
            .withArgs(deploy.remoteDomain, deployerId, smallTransferMessage);
        });

        it('allows users to migrate', async () => {
          const defaultBalance = await defaultRepr.balanceOf(deployerAddress);
          const customBalance = await customRepr.balanceOf(deployerAddress);

          let migrateTx = deploy.bridgeRouter!.migrate(defaultRepr.address);

          await expect(migrateTx).to.not.be.reverted;

          expect(await defaultRepr.balanceOf(deployerAddress)).to.equal(
            ethers.constants.Zero,
          );
          expect(await customRepr.balanceOf(deployerAddress)).to.equal(
            defaultBalance.add(customBalance),
          );
        });
      });

      describe('update details', async () => {
        before(async () => {
          deploy = await TestBridgeDeploy.deploy(ethers, deployer);
          detailsHash = bridge.getDetailsHash(
            deploy.testName,
            deploy.testSymbol,
            deploy.testDecimals,
          );
        });

        describe('remotely-originating asset', async () => {
          let transferMessage: BytesLike;
          let repr: BridgeToken;

          before(async () => {
            deploy = await TestBridgeDeploy.deploy(ethers, deployer);
            detailsHash = bridge.getDetailsHash(
              deploy.testName,
              deploy.testSymbol,
              deploy.testDecimals,
            );

            // generate transfer action
            const transferMessageObj: types.Message = {
              tokenId: deploy.testTokenId,
              action: {
                type: ENABLE_FAST
                  ? BridgeMessageTypes.FAST_TRANSFER
                  : BridgeMessageTypes.TRANSFER,
                recipient: deployerId,
                amount: TOKEN_VALUE,
                detailsHash,
              },
            };
            transferMessage = bridge.serializeMessage(transferMessageObj);
          });

          it('stores detailsHash on first inbound transfer', async () => {
            await deploy.bridgeRouter!.handle(
              deploy.remoteDomain,
              mockNonce,
              deployerId,
              transferMessage,
              { gasLimit: PROTOCOL_PROCESS_GAS },
            );

            const representation = await deploy.getTestRepresentation();
            expect(representation).to.not.be.undefined;
            repr = representation!;

            const storedDetailsHash = await repr.detailsHash();
            expect(storedDetailsHash).to.equal(detailsHash);
          });

          it('fails for incorrect symbol', async () => {
            const badUpdateOne = repr.setDetails(
              deploy.testName,
              'FAKE',
              deploy.testDecimals,
            );
            await expect(badUpdateOne).to.be.revertedWith('!committed details');

            const badUpdateTwo = repr.setDetails(
              deploy.testName,
              deploy.testSymbol + ' ',
              deploy.testDecimals,
            );
            await expect(badUpdateTwo).to.be.revertedWith('!committed details');
          });

          it('fails for incorrect name', async () => {
            const badUpdateOne = repr.setDetails(
              'NomadTesT',
              deploy.testSymbol,
              deploy.testDecimals,
            );
            await expect(badUpdateOne).to.be.revertedWith('!committed details');

            const badUpdateTwo = repr.setDetails(
              deploy.testName + ' ',
              deploy.testSymbol,
              deploy.testDecimals,
            );
            await expect(badUpdateTwo).to.be.revertedWith('!committed details');
          });

          it('fails for incorrect decimals', async () => {
            const badUpdateOne = repr.setDetails(
              deploy.testName,
              deploy.testSymbol,
              0,
            );
            await expect(badUpdateOne).to.be.revertedWith('!committed details');

            const badUpdateTwo = repr.setDetails(
              deploy.testName,
              deploy.testSymbol,
              deploy.testDecimals * 2,
            );
            await expect(badUpdateTwo).to.be.revertedWith('!committed details');
          });

          it('updates details successfully', async () => {
            let name = await repr.name();
            let symbol = await repr.symbol();
            await expect(name).to.not.equal(deploy.testName);
            await expect(symbol).to.not.equal(deploy.testSymbol);

            const updateTx = repr.setDetails(
              deploy.testName,
              deploy.testSymbol,
              deploy.testDecimals,
            );
            await expect(updateTx)
              .to.emit(repr, 'UpdateDetails')
              .withArgs(
                deploy.testName,
                deploy.testSymbol,
                deploy.testDecimals,
              );

            name = await repr.name();
            symbol = await repr.symbol();
            let decimals = await repr.decimals();
            await expect(name).to.equal(deploy.testName);
            await expect(symbol).to.equal(deploy.testSymbol);
            await expect(decimals).to.equal(deploy.testDecimals);
          });
        });
      });
    });
  });
});
