import { expect } from 'chai';
import { ethers, bridge, nomad } from 'hardhat';
import { BigNumber, BytesLike } from 'ethers';

import * as types from 'lib/types';
import { toBytes32 } from 'lib/utils';
import TestBridgeDeploy from '@nomad-xyz/deploy/dist/src/bridge/TestBridgeDeploy';
import {
  BridgeToken,
  BridgeToken__factory,
} from '@nomad-xyz/contract-interfaces/bridge';
import { hexlify } from 'ethers/lib/utils';
import { canonizeId } from '@nomad-xyz/sdk/utils';
const { BridgeMessageTypes } = bridge;

[true, false].map((ENABLE_FAST) => {
  describe.only('BridgeRouter', async () => {
    describe(ENABLE_FAST ? 'Fast Liquidity' : 'No Fast Liquidity', async () => {
      let deployer: types.Signer;
      let deployerAddress: string;
      let deployerId: string;
      let deploy: TestBridgeDeploy;
      let detailsHash: BytesLike;
      let originAndNonce: BigNumber;

      let bridgor: types.Signer;
      let bridgorAddress: string;
      let bridgorId: string;

      let remoteBridgeId: string;

      const DUST = BigNumber.from('60000000000000000');
      const fastTransferRecipient = '0x' + '22'.repeat(20);
      const fastTransferRecipientId = hexlify(
        canonizeId(fastTransferRecipient),
      );

      const PROTOCOL_PROCESS_GAS = 800_000;

      // Numerical token value
      const TOKEN_VALUE = 0xffff;
      const mockNonce = 1;

      before(async () => {
        // populate deployer signer
        [deployer, bridgor] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        deployerId = hexlify(canonizeId(deployerAddress));
        remoteBridgeId = deployerId;
        bridgorAddress = await bridgor.getAddress();
        bridgorId = hexlify(canonizeId(bridgorAddress));
      });

      describe('setup', async () => {
        before(async () => {
          deploy = await TestBridgeDeploy.deploy(ethers, deployer);
          originAndNonce = nomad.domainAndNonce(deploy.remoteDomain, mockNonce);
          detailsHash = bridge.getDetailsHash(
            deploy.testName,
            deploy.testSymbol,
            deploy.testDecimals,
          );
        });

        it('tokenRegistry has the correct owner', async () => {
          const owner = await deploy!.tokenRegistry!.owner();
          await expect(owner).to.equal(deploy!.bridgeRouter!.address);
        });
      });

      describe('invalid messages', async () => {
        before(async () => {
          deploy = await TestBridgeDeploy.deploy(ethers, deployer);
          originAndNonce = nomad.domainAndNonce(deploy.remoteDomain, mockNonce);
          detailsHash = bridge.getDetailsHash(
            deploy.testName,
            deploy.testSymbol,
            deploy.testDecimals,
          );
        });

        it('rejects invalid messages', async () => {
          const handleTx = deploy!.bridgeRouter!.handle(
            deploy.remoteDomain,
            mockNonce,
            remoteBridgeId,
            '0x',
            {
              gasLimit: PROTOCOL_PROCESS_GAS,
            },
          );
          await expect(handleTx).to.be.reverted;
        });
      });

      describe('transfer message', async () => {
        before(async () => {
          deploy = await TestBridgeDeploy.deploy(ethers, deployer);
        });

        describe('remotely-originating asset roundtrip', async () => {
          let transferMessage: BytesLike;
          let repr: BridgeToken;

          before(async () => {
            deploy = await TestBridgeDeploy.deploy(ethers, deployer);

            // generate transfer action
            const transferMessageObj: types.Message = {
              tokenId: deploy.testTokenId,
              action: {
                type: ENABLE_FAST
                  ? BridgeMessageTypes.FAST_TRANSFER
                  : BridgeMessageTypes.TRANSFER,
                recipient: bridgorId,
                amount: TOKEN_VALUE,
                detailsHash,
              },
            };
            transferMessage = bridge.serializeMessage(transferMessageObj);
          });

          it('deploys a token on first inbound transfer', async () => {
            let handleTx = await deploy.bridgeRouter!.handle(
              deploy.remoteDomain,
              mockNonce,
              remoteBridgeId,
              transferMessage,
              { gasLimit: PROTOCOL_PROCESS_GAS },
            );
            await handleTx.wait();

            const representation = await deploy.getTestRepresentation();
            expect(representation).to.not.be.undefined;
            expect(representation!.address).to.not.equal(
              ethers.constants.AddressZero,
              'representation address is 0',
            );
            repr = representation!;

            await expect(handleTx).to.emit(
              deploy.tokenRegistry!,
              'TokenDeployed',
            );
            await expect(handleTx)
              .to.emit(deploy.bridgeRouter!, 'Receive')
              .withArgs(
                originAndNonce,
                repr.address,
                bridgorAddress,
                ethers.constants.AddressZero,
                BigNumber.from(TOKEN_VALUE),
              );

            expect(await repr!.balanceOf(bridgorAddress)).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
            expect(await repr!.totalSupply()).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
          });

          it('errors on send if ERC20 balance is insufficient', async () => {
            const stealTx = deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                repr!.address,
                TOKEN_VALUE * 10,
                deploy.remoteDomain,
                deployerId,
                ENABLE_FAST,
              );

            await expect(stealTx).to.be.revertedWith(
              'ERC20: burn amount exceeds balance',
            );
          });

          it('errors when missing a remote router', async () => {
            expect(
              deploy
                .bridgeRouter!.connect(bridgor)
                .send(
                  repr!.address,
                  TOKEN_VALUE * 10,
                  121234,
                  deployerId,
                  ENABLE_FAST,
                ),
            ).to.be.revertedWith('!remote');
          });

          it('errors on send when recipient is the 0 address', async () => {
            expect(
              deploy
                .bridgeRouter!.connect(bridgor)
                .send(
                  repr!.address,
                  TOKEN_VALUE * 10,
                  deploy.remoteDomain,
                  `0x${'00'.repeat(32)}`,
                  ENABLE_FAST,
                ),
            ).to.be.revertedWith('!recip');
          });

          it('errors on send if ERC20 amount is zero', async () => {
            const zeroTx = deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                repr!.address,
                0,
                deploy.remoteDomain,
                deployerId,
                ENABLE_FAST,
              );

            await expect(zeroTx).to.be.revertedWith('!amnt');
          });

          it('errors on send if remote router is unknown', async () => {
            const unknownRemote = deploy
              .bridgeRouter!.connect(bridgor)
              .send(repr!.address, 1, 3000, deployerId, ENABLE_FAST);

            await expect(unknownRemote).to.be.revertedWith('!remote');
          });

          it('burns tokens on outbound message', async () => {
            // OUTBOUND
            const sendTx = await deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                repr!.address,
                TOKEN_VALUE,
                deploy.remoteDomain,
                bridgorId,
                ENABLE_FAST,
              );

            await expect(sendTx)
              .to.emit(deploy.mockCore, 'Enqueue')
              .withArgs(deploy.remoteDomain, deployerId, transferMessage);
            expect(await repr!.totalSupply()).to.equal(BigNumber.from(0));
          });

          it('errors on outbound messages with no balance', async () => {
            // OUTBOUND, NO Tokens
            const badTx = deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                repr!.address,
                TOKEN_VALUE,
                deploy.remoteDomain,
                deployerId,
                ENABLE_FAST,
              );
            await expect(badTx).to.be.revertedWith(
              'ERC20: burn amount exceeds balance',
            );
          });
        });

        describe('locally-originating asset roundtrip', async () => {
          let transferMessage: string;
          let localToken: BridgeToken;

          before(async () => {
            deploy = await TestBridgeDeploy.deploy(ethers, deployer);

            localToken = await new BridgeToken__factory(deployer).deploy();
            await localToken.initialize();
            await localToken.mint(bridgorAddress, TOKEN_VALUE);

            const name = await localToken.name();
            const symbol = await localToken.symbol();
            const decimals = await localToken.decimals();
            const localDetailsHash: BytesLike = bridge.getDetailsHash(
              name,
              symbol,
              decimals,
            );

            // generate protocol messages
            const transferMessageObj: types.Message = {
              tokenId: {
                domain: deploy.localDomain,
                id: toBytes32(localToken.address),
              },
              action: {
                type: ENABLE_FAST
                  ? BridgeMessageTypes.FAST_TRANSFER
                  : BridgeMessageTypes.TRANSFER,
                recipient: bridgorId,
                amount: TOKEN_VALUE,
                detailsHash: localDetailsHash,
              },
            };
            transferMessage = bridge.serializeMessage(transferMessageObj);

            expect(await localToken.balanceOf(bridgorAddress)).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));
          });

          it('errors if the token is not approved', async () => {
            // TOKEN NOT APPROVED
            const unapproved = deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                localToken.address,
                1,
                deploy.remoteDomain,
                deployerId,
                ENABLE_FAST,
              );

            expect(unapproved).to.be.revertedWith(
              'ERC20: transfer amount exceeds allowance',
            );
            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));
          });

          it('errors if insufficient balance', async () => {
            await localToken
              .connect(bridgor)
              .approve(
                deploy.bridgeRouter!.address,
                ethers.constants.MaxUint256,
              );

            const badTx = deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                localToken.address,
                TOKEN_VALUE * 5,
                deploy.remoteDomain,
                deployerId,
                ENABLE_FAST,
              );

            expect(badTx).to.be.revertedWith(
              'ERC20: transfer amount exceeds balance',
            );
            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));
          });

          it('holds tokens on outbound transfer', async () => {
            const sendTx = await deploy
              .bridgeRouter!.connect(bridgor)
              .send(
                localToken.address,
                TOKEN_VALUE,
                deploy.remoteDomain,
                bridgorId,
                ENABLE_FAST,
              );

            await expect(sendTx)
              .to.emit(deploy.mockCore, 'Enqueue')
              .withArgs(deploy.remoteDomain, remoteBridgeId, transferMessage);

            await expect(sendTx)
              .to.emit(deploy.bridgeRouter!, 'Send')
              .withArgs(
                localToken.address,
                sendTx.from,
                deploy.remoteDomain,
                bridgorId,
                TOKEN_VALUE,
                ENABLE_FAST,
              );

            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(TOKEN_VALUE));
          });

          it('unlocks tokens on inbound transfer', async () => {
            let handleTx = await deploy.bridgeRouter!.handle(
              deploy.remoteDomain,
              mockNonce,
              remoteBridgeId,
              transferMessage,
              { gasLimit: PROTOCOL_PROCESS_GAS },
            );

            await expect(handleTx).to.not.emit(
              deploy.tokenRegistry!,
              'TokenDeployed',
            );
            await expect(handleTx)
              .to.emit(deploy.bridgeRouter!, 'Receive')
              .withArgs(
                originAndNonce,
                localToken.address,
                bridgorAddress,
                ethers.constants.AddressZero,
                BigNumber.from(TOKEN_VALUE),
              );

            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));

            expect(await localToken.balanceOf(bridgorAddress)).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
          });
        });
      });

      if (ENABLE_FAST) {
        describe('prefill', async () => {
          before(async () => {
            deploy = await TestBridgeDeploy.deploy(ethers, deployer);
          });

          it('errors for non-existing assets', async () => {
            // generate transfer action
            const fastTransferMessageObj: types.Message = {
              tokenId: deploy.testTokenId,
              action: {
                type: BridgeMessageTypes.FAST_TRANSFER,
                recipient: bridgorId,
                amount: TOKEN_VALUE,
                detailsHash,
              },
            };
            const fastTransferMessage = bridge.serializeMessage(
              fastTransferMessageObj,
            );

            await expect(
              deploy.bridgeRouter!.preFill(
                deploy.remoteDomain,
                mockNonce,
                fastTransferMessage,
              ),
            ).to.be.revertedWith('!token');
          });

          describe('remotely-originating asset', async () => {
            let setupMessage: string;
            let repr: BridgeToken;
            let transferMessage: string;
            let fastTransferMessage: string;

            before(async () => {
              deploy = await TestBridgeDeploy.deploy(ethers, deployer);

              // transfer message
              const fastTransferMessageObj: types.Message = {
                tokenId: deploy.testTokenId,
                action: {
                  type: BridgeMessageTypes.FAST_TRANSFER,
                  recipient: fastTransferRecipientId,
                  amount: TOKEN_VALUE,
                  detailsHash,
                },
              };
              fastTransferMessage = bridge.serializeMessage(
                fastTransferMessageObj,
              );

              const transferMessageObj: types.Message = {
                tokenId: deploy.testTokenId,
                action: {
                  type: BridgeMessageTypes.TRANSFER,
                  recipient: bridgorId,
                  amount: TOKEN_VALUE,
                  detailsHash,
                },
              };
              transferMessage = bridge.serializeMessage(transferMessageObj);

              // setup message
              const setupMessageObj: types.Message = {
                tokenId: deploy.testTokenId,
                action: {
                  type: BridgeMessageTypes.TRANSFER,
                  recipient: bridgorId,
                  amount: TOKEN_VALUE,
                  detailsHash,
                },
              };
              setupMessage = bridge.serializeMessage(setupMessageObj);

              // perform setup
              const setupTx = await deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                remoteBridgeId,
                setupMessage,
                { gasLimit: PROTOCOL_PROCESS_GAS },
              );

              await expect(setupTx).to.emit(
                deploy.tokenRegistry!,
                'TokenDeployed',
              );

              const representation = await deploy.getTestRepresentation();
              expect(representation).to.not.be.undefined;
              expect(representation!.address).to.not.equal(
                ethers.constants.AddressZero,
                'representation address is 0',
              );
              repr = representation!;

              await expect(setupTx)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  repr.address,
                  bridgorAddress,
                  ethers.constants.AddressZero,
                  BigNumber.from(TOKEN_VALUE),
                );

              expect(await repr.balanceOf(bridgorAddress)).to.equal(
                BigNumber.from(TOKEN_VALUE),
              );
              await repr
                ?.connect(bridgor)
                .approve(
                  deploy.bridgeRouter!.address,
                  ethers.constants.MaxUint256,
                );
            });

            it('reverts for non-fast transfer messages', async () => {
              const prefillTx = deploy.bridgeRouter!.preFill(
                deploy.remoteDomain,
                mockNonce,
                transferMessage,
              );
              await expect(prefillTx).to.be.revertedWith('!fast transfer');
            });

            it('transfers tokens on a prefill', async () => {
              const prefillTx = await deploy
                .bridgeRouter!.connect(bridgor)
                .preFill(deploy.remoteDomain, mockNonce, fastTransferMessage);
              await expect(prefillTx)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  repr.address,
                  fastTransferRecipient,
                  bridgorAddress,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
              await expect(prefillTx)
                .to.emit(repr, 'Transfer')
                .withArgs(
                  bridgorAddress,
                  fastTransferRecipient,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
            });

            it('mints tokens for the liquidity provider on message receipt', async () => {
              let deliver = deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                remoteBridgeId,
                fastTransferMessage,
                { gasLimit: PROTOCOL_PROCESS_GAS },
              );
              await expect(deliver)
                .to.emit(repr, 'Transfer')
                .withArgs(
                  ethers.constants.AddressZero,
                  bridgorAddress,
                  TOKEN_VALUE,
                );
              await expect(deliver)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  repr.address,
                  bridgorAddress,
                  ethers.constants.AddressZero,
                  TOKEN_VALUE,
                );
            });
          });

          describe('locally-originating asset', async () => {
            let localToken: BridgeToken;
            let fastTransferMessage: string;

            before(async () => {
              deploy = await TestBridgeDeploy.deploy(ethers, deployer);
              localToken = await new BridgeToken__factory(deployer).deploy();
              await localToken.initialize();
              await localToken.mint(bridgorAddress, TOKEN_VALUE);
              await localToken.mint(deploy.bridgeRouter!.address, TOKEN_VALUE);
              await localToken
                .connect(bridgor)
                .approve(
                  deploy.bridgeRouter!.address,
                  ethers.constants.MaxUint256,
                );

              const name = await localToken.name();
              const symbol = await localToken.symbol();
              const localDetailsHash: BytesLike = bridge.getDetailsHash(
                name,
                symbol,
                deploy.testDecimals,
              );

              expect(await localToken.balanceOf(bridgorAddress)).to.equal(
                BigNumber.from(TOKEN_VALUE),
              );
              expect(
                await localToken.balanceOf(deploy.bridgeRouter!.address),
              ).to.equal(BigNumber.from(TOKEN_VALUE));

              const fastTransferMessageObj: types.Message = {
                tokenId: {
                  domain: deploy.localDomain,
                  id: toBytes32(localToken.address),
                },
                action: {
                  type: BridgeMessageTypes.FAST_TRANSFER,
                  recipient: fastTransferRecipientId,
                  amount: TOKEN_VALUE,
                  detailsHash: localDetailsHash,
                },
              };
              fastTransferMessage = bridge.serializeMessage(
                fastTransferMessageObj,
              );
            });

            it(`transfers tokens and dusts on prefill`, async () => {
              // transfer some dust to the bridge
              await deployer.sendTransaction({
                to: deploy.bridgeRouter!.address,
                value: DUST,
              });

              await expect(
                deployer.provider!.getBalance(fastTransferRecipient),
              ).to.equal(0);
              const prefillTx = await deploy
                .bridgeRouter!.connect(bridgor)
                .preFill(deploy.remoteDomain, mockNonce, fastTransferMessage);
              await expect(prefillTx)
                .to.emit(localToken, 'Transfer')
                .withArgs(
                  bridgorAddress,
                  fastTransferRecipient,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
              await expect(prefillTx)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  localToken.address,
                  fastTransferRecipient,
                  bridgorAddress,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
              // expect the recipient to get that dust in the prefill
              await expect(
                deployer.provider!.getBalance(fastTransferRecipient),
              ).to.equal(DUST);
            });

            it('unlocks tokens on message receipt', async () => {
              let deliver = deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                remoteBridgeId,
                fastTransferMessage,
                { gasLimit: PROTOCOL_PROCESS_GAS },
              );
              await expect(deliver)
                .to.emit(localToken, 'Transfer')
                .withArgs(
                  deploy.bridgeRouter!.address,
                  bridgorAddress,
                  TOKEN_VALUE,
                );
              await expect(deliver)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  localToken.address,
                  bridgorAddress,
                  ethers.constants.AddressZero,
                  TOKEN_VALUE,
                );
            });
          });
        });
      }
    });
  });
});
