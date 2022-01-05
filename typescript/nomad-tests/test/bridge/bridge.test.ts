import { expect } from 'chai';
import { ethers, bridge, nomad } from 'hardhat';
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
  describe('BridgeRouter', async () => {
    describe(ENABLE_FAST ? 'Fast Liquidity' : 'No Fast Liquidity', async () => {
      let deployer: types.Signer;
      let deployerAddress: string;
      let deployerId: BytesLike;
      let deploy: TestBridgeDeploy;
      let detailsHash: BytesLike;
      let originAndNonce: BigNumber;

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
            deployerId,
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
                recipient: deployerId,
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
              deployerId,
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
                deployerAddress,
                ethers.constants.AddressZero,
                BigNumber.from(TOKEN_VALUE),
              );

            expect(await repr!.balanceOf(deployer.address)).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
            expect(await repr!.totalSupply()).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
          });

          it('errors on send if ERC20 balance is insufficient', async () => {
            const stealTx = deploy.bridgeRouter!.send(
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
              deploy.bridgeRouter!.send(
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
              deploy.bridgeRouter!.send(
                repr!.address,
                TOKEN_VALUE * 10,
                deploy.remoteDomain,
                `0x${'00'.repeat(32)}`,
                ENABLE_FAST,
              ),
            ).to.be.revertedWith('!recip');
          });

          it('errors on send if ERC20 amount is zero', async () => {
            const zeroTx = deploy.bridgeRouter!.send(
              repr!.address,
              0,
              deploy.remoteDomain,
              deployerId,
              ENABLE_FAST,
            );

            await expect(zeroTx).to.be.revertedWith('!amnt');
          });

          it('errors on send if remote router is unknown', async () => {
            const unknownRemote = deploy.bridgeRouter!.send(
              repr!.address,
              1,
              3000,
              deployerId,
              ENABLE_FAST,
            );

            await expect(unknownRemote).to.be.revertedWith('!remote');
          });

          it('burns tokens on outbound message', async () => {
            // OUTBOUND
            const sendTx = await deploy.bridgeRouter!.send(
              repr!.address,
              TOKEN_VALUE,
              deploy.remoteDomain,
              deployerId,
              ENABLE_FAST,
            );

            await expect(sendTx)
              .to.emit(deploy.mockCore, 'Enqueue')
              .withArgs(deploy.remoteDomain, deployerId, transferMessage);

            expect(await repr!.totalSupply()).to.equal(BigNumber.from(0));
          });

          it('errors on outbound messages with no balance', async () => {
            // OUTBOUND, NO Tokens
            const badTx = deploy.bridgeRouter!.send(
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
            await localToken.mint(deployerAddress, TOKEN_VALUE);

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
                recipient: deployerId,
                amount: TOKEN_VALUE,
                detailsHash: localDetailsHash,
              },
            };
            transferMessage = bridge.serializeMessage(transferMessageObj);

            expect(await localToken.balanceOf(deployerAddress)).to.equal(
              BigNumber.from(TOKEN_VALUE),
            );
            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));
          });

          it('errors if the token is not approved', async () => {
            // TOKEN NOT APPROVED
            const unapproved = deploy.bridgeRouter!.send(
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
            await localToken.approve(
              deploy.bridgeRouter!.address,
              ethers.constants.MaxUint256,
            );

            const badTx = deploy.bridgeRouter!.send(
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
            const sendTx = await deploy.bridgeRouter!.send(
              localToken.address,
              TOKEN_VALUE,
              deploy.remoteDomain,
              deployerId,
              ENABLE_FAST,
            );

            await expect(sendTx)
              .to.emit(deploy.mockCore, 'Enqueue')
              .withArgs(deploy.remoteDomain, deployerId, transferMessage);

            await expect(sendTx)
              .to.emit(deploy.bridgeRouter!, 'Send')
              .withArgs(
                localToken.address,
                sendTx.from,
                deploy.remoteDomain,
                deployerId,
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
              deployerId,
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
                deployerAddress,
                ethers.constants.AddressZero,
                BigNumber.from(TOKEN_VALUE),
              );

            expect(
              await localToken.balanceOf(deploy.bridgeRouter!.address),
            ).to.equal(BigNumber.from(0));

            expect(await localToken.balanceOf(deployerAddress)).to.equal(
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
                recipient: deployerId,
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
            let recipient: string;
            let recipientId: string;
            let transferMessage: string;
            let fastTransferMessage: string;

            before(async () => {
              deploy = await TestBridgeDeploy.deploy(ethers, deployer);

              // generate actions
              recipient = `0x${'00'.repeat(19)}ff`;
              recipientId = toBytes32(recipient);

              // transfer message
              const fastTransferMessageObj: types.Message = {
                tokenId: deploy.testTokenId,
                action: {
                  type: BridgeMessageTypes.FAST_TRANSFER,
                  recipient: recipientId,
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
                  recipient: deployerId,
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
                  recipient: deployerId,
                  amount: TOKEN_VALUE,
                  detailsHash,
                },
              };
              setupMessage = bridge.serializeMessage(setupMessageObj);

              // perform setup
              const setupTx = await deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                deployerId,
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
                  deployerAddress,
                  ethers.constants.AddressZero,
                  BigNumber.from(TOKEN_VALUE),
                );

              expect(await repr.balanceOf(deployerAddress)).to.equal(
                BigNumber.from(TOKEN_VALUE),
              );
              await repr?.approve(
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
              const prefillTx = await deploy.bridgeRouter!.preFill(
                deploy.remoteDomain,
                mockNonce,
                fastTransferMessage,
              );
              await expect(prefillTx)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  repr.address,
                  recipient,
                  deployerAddress,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
              await expect(prefillTx)
                .to.emit(repr, 'Transfer')
                .withArgs(
                  deployerAddress,
                  recipient,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
            });

            it('mints tokens for the liquidity provider on message receipt', async () => {
              let deliver = deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                deployerId,
                fastTransferMessage,
                { gasLimit: PROTOCOL_PROCESS_GAS },
              );
              await expect(deliver)
                .to.emit(repr, 'Transfer')
                .withArgs(
                  ethers.constants.AddressZero,
                  deployerAddress,
                  TOKEN_VALUE,
                );
              await expect(deliver)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  repr.address,
                  deployerAddress,
                  ethers.constants.AddressZero,
                  TOKEN_VALUE,
                );
            });
          });

          describe('locally-originating asset', async () => {
            let localToken: BridgeToken;
            let recipient: string;
            let recipientId: string;
            let fastTransferMessage: string;

            before(async () => {
              deploy = await TestBridgeDeploy.deploy(ethers, deployer);
              localToken = await new BridgeToken__factory(deployer).deploy();
              await localToken.initialize();
              await localToken.mint(deployerAddress, TOKEN_VALUE);
              await localToken.mint(deploy.bridgeRouter!.address, TOKEN_VALUE);
              await localToken.approve(
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

              expect(await localToken.balanceOf(deployerAddress)).to.equal(
                BigNumber.from(TOKEN_VALUE),
              );
              expect(
                await localToken.balanceOf(deploy.bridgeRouter!.address),
              ).to.equal(BigNumber.from(TOKEN_VALUE));

              // generate transfer action
              recipient = `0x${'00'.repeat(19)}ff`;
              recipientId = toBytes32(recipient);

              const fastTransferMessageObj: types.Message = {
                tokenId: {
                  domain: deploy.localDomain,
                  id: toBytes32(localToken.address),
                },
                action: {
                  type: BridgeMessageTypes.FAST_TRANSFER,
                  recipient: recipientId,
                  amount: TOKEN_VALUE,
                  detailsHash: localDetailsHash,
                },
              };
              fastTransferMessage = bridge.serializeMessage(
                fastTransferMessageObj,
              );
            });

            it('transfers tokens on prefill', async () => {
              const prefillTx = await deploy.bridgeRouter!.preFill(
                deploy.remoteDomain,
                mockNonce,
                fastTransferMessage,
              );
              await expect(prefillTx)
                .to.emit(localToken, 'Transfer')
                .withArgs(
                  deployerAddress,
                  recipient,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
              await expect(prefillTx)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  localToken.address,
                  recipient,
                  deployerAddress,
                  BigNumber.from(TOKEN_VALUE).mul(9995).div(10000),
                );
            });

            it('unlocks tokens on message receipt', async () => {
              let deliver = deploy.bridgeRouter!.handle(
                deploy.remoteDomain,
                mockNonce,
                deployerId,
                fastTransferMessage,
                { gasLimit: PROTOCOL_PROCESS_GAS },
              );
              await expect(deliver)
                .to.emit(localToken, 'Transfer')
                .withArgs(
                  deploy.bridgeRouter!.address,
                  deployerAddress,
                  TOKEN_VALUE,
                );
              await expect(deliver)
                .to.emit(deploy.bridgeRouter!, 'Receive')
                .withArgs(
                  originAndNonce,
                  localToken.address,
                  deployerAddress,
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
