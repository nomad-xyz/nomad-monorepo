import { ethers } from 'hardhat';
import { expect } from 'chai';
import { getTestDeploy } from './testChain';
import { Updater } from 'lib/core';
import { Signer } from 'lib/types';
import { CoreContractAddresses } from '@nomad-xyz/deploy/dist/src/chain';
import { deployBridgesComplete } from '@nomad-xyz/deploy/dist/src/bridge';
import { BridgeDeploy } from '@nomad-xyz/deploy/dist/src/bridge/BridgeDeploy';
import {
  deployTwoChains,
  deployComplete,
  deployHubAndSpoke,
} from '@nomad-xyz/deploy/dist/src/core';
import { CoreDeploy } from '@nomad-xyz/deploy/dist/src/core/CoreDeploy';
import {
  MockWeth,
  MockWeth__factory,
} from '@nomad-xyz/contract-interfaces/dist/bridge';
import {toBytes32} from "lib/utils";

const domains = [1000, 2000, 3000, 4000];

/*
 * Deploy the full Nomad suite on two chains
 */
describe('core deploy scripts', async () => {
  let signer: Signer, recoveryManager: Signer, updater: Updater;

  before(async () => {
    [signer, recoveryManager] = await ethers.getSigners();
    updater = await Updater.fromSigner(signer, domains[0]);
  });

  describe('deployTwoChains', async () => {
    it('2-chain deploy', async () => {
      let deploys: CoreDeploy[] = [];
      for (var i = 0; i < 2; i++) {
        deploys.push(
          await getTestDeploy(domains[i], updater.address, [
            recoveryManager.address,
          ]),
        );
      }

      // deploy nomad contracts on 2 chains
      // will test inside deploy function
      await deployTwoChains(deploys[0], deploys[1]);
    });
  });

  describe('deployComplete', async () => {
    // tests deploys for up to 4 chains
    for (let i = 1; i <= 4; i++) {
      it(`${i}-chain deploy`, async () => {
        let deploys: CoreDeploy[] = [];
        for (let j = 0; j < i; j++) {
          deploys.push(
            await getTestDeploy(domains[j], updater.address, [
              recoveryManager.address,
            ]),
          );
        }

        // deploy nomad contracts on `i` chains
        // will test inside deploy function
        await deployComplete(deploys);
      });
    }

    it(`asserts there is at least one deploy config`, async () => {
      const deploys: CoreDeploy[] = [];
      const errMsg = 'Must pass at least one deploy config';

      try {
        await deployComplete(deploys);
        // `deployComplete` should error and skip to catch block. If it didn't, we need to make it fail
        // here (same as `expect(true).to.be.false`, but more explicit)
        expect('no error').to.equal(errMsg);
      } catch (e: any) {
        // expect correct error message
        expect(e.message).to.equal(errMsg);
      }
    });
  });

  describe('deployHubAndSpoke', async () => {
    for (let i = 1; i < domains.length; i++) {
      describe(`${i}-spoke deploy`, async () => {
        let hub: CoreDeploy;
        let spokes: CoreDeploy[] = [];
        const nullBytes = `0x${'00'.repeat(32)}`;

        before(async () => {
            // tests deploys for up to 4 chains
            hub = await getTestDeploy(domains[0], updater.address, [
              recoveryManager.address,
            ]);

            for(let j = 1; j <= i; j++) {
              spokes.push(
                  await getTestDeploy(domains[j], updater.address, [
                    recoveryManager.address,
                  ]),
              );
            }

            // deploy nomad contracts on `i` chains
            // will test inside deploy function
            await deployHubAndSpoke(hub, spokes);
          });

          it('does not enroll spokes in each other', async () => {
            for (let spoke1 of spokes) {
              for (let spoke2 of spokes) {
                // replica is not deployed
                expect(spoke1.contracts.replicas[spoke2.chain.domain]).to.be.undefined;
                // replica is not enrolled
                let replica = await spoke1.contracts.xAppConnectionManager!.domainToReplica(spoke2.chain.domain);
                expect(replica).to.equal(ethers.constants.AddressZero);
                // governanceRouter is not enrolled
                let governanceRouter = await spoke1.contracts.governance!.proxy.routers(spoke2.chain.domain);
                expect(governanceRouter).to.equal(nullBytes);

                // replica is not deployed
                expect(spoke2.contracts.replicas[spoke1.chain.domain]).to.be.undefined;
                // replica is not enrolled
                replica = await spoke2.contracts.xAppConnectionManager!.domainToReplica(spoke1.chain.domain);
                expect(replica).to.equal(ethers.constants.AddressZero);
                // governanceRouter is not enrolled
                governanceRouter = await spoke2.contracts.governance!.proxy.routers(spoke1.chain.domain);
                expect(governanceRouter).to.equal(nullBytes);
              }
            }
          });

        it('does enroll hub in all spokes', async () => {
          for (let spoke of spokes) {
              // replica is deployed
              expect(spoke.contracts.replicas[hub.chain.domain]).to.not.be.undefined;
              // replica is enrolled
              let replica = await spoke.contracts.xAppConnectionManager!.domainToReplica(hub.chain.domain);
              expect(replica).to.equal(spoke.contracts.replicas[hub.chain.domain].proxy.address);
              // governanceRouter is enrolled
              let governanceRouter = await spoke.contracts.governance!.proxy.routers(hub.chain.domain);
              expect(governanceRouter).to.equal(toBytes32(hub.contracts.governance!.proxy.address).toLowerCase());

              // replica is deployed
              expect(hub.contracts.replicas[spoke.chain.domain]).to.not.be.undefined;
              replica = await hub.contracts.xAppConnectionManager!.domainToReplica(spoke.chain.domain);
              // replica is enrolled
              expect(replica).to.equal(hub.contracts.replicas[spoke.chain.domain].proxy.address);
              // governanceRouter is enrolled
              governanceRouter = await hub.contracts.governance!.proxy.routers(spoke.chain.domain);
              expect(governanceRouter).to.equal(toBytes32(spoke.contracts.governance!.proxy.address).toLowerCase());
          }
        });
        });
      }

    describe("input verification", async () => {
      it(`asserts hub config exists`, async () => {
        let hub: CoreDeploy;
        const spoke: CoreDeploy = await getTestDeploy(domains[0], updater.address, [
          recoveryManager.address,
        ]);
        const errMsg = 'Must pass hub config';

        try {
          // @ts-ignore
          await deployHubAndSpoke(hub, [spoke]);
          // `deployHubAndSpoke` should error and skip to catch block. If it didn't, we need to make it fail
          // here (same as `expect(true).to.be.false`, but more explicit)
          expect('no error').to.equal(errMsg);
        } catch (e: any) {
          // expect correct error message
          expect(e.message).to.equal(errMsg);
        }
      });

      it(`asserts at least one spoke config exists`, async () => {
        const hub: CoreDeploy = await getTestDeploy(domains[0], updater.address, [
          recoveryManager.address,
        ]);
        const errMsg = 'Must pass at least one spoke config';

        try {
          await deployHubAndSpoke(hub, []);
          // `deployHubAndSpoke` should error and skip to catch block. If it didn't, we need to make it fail
          // here (same as `expect(true).to.be.false`, but more explicit)
          expect('no error').to.equal(errMsg);
        } catch (e: any) {
          // expect correct error message
          expect(e.message).to.equal(errMsg);
        }
      });
    });
  });
});

describe('bridge deploy scripts', async () => {
  const numChains = 3;

  let signer: Signer,
    recoveryManager: Signer,
    updater: Updater,
    mockWeth: MockWeth,
    deploys: CoreDeploy[] = [],
    coreAddresses: CoreContractAddresses[] = [];

  before(async () => {
    [signer, recoveryManager] = await ethers.getSigners();
    updater = await Updater.fromSigner(signer, domains[0]);
    mockWeth = await new MockWeth__factory(signer).deploy();

    // deploy core contracts on 2 chains
    for (let i = 0; i < numChains; i++) {
      deploys.push(
        await getTestDeploy(domains[i], updater.address, [
          recoveryManager.address,
        ]),
      );
    }
    await deployComplete(deploys);

    for (let i = 0; i < numChains; i++) {
      coreAddresses.push(deploys[i].contracts.toObject());
    }
  });

  it('2-chain bridge', async () => {
    // instantiate alfajores and kovan bridge deploys
    const alfajoresDeploy = new BridgeDeploy(
      deploys[0].chain,
      {},
      '',
      true,
      coreAddresses[0],
    );
    const kovanDeploy = new BridgeDeploy(
      deploys[1].chain,
      { weth: mockWeth.address },
      '',
      true,
      coreAddresses[1],
    );

    // deploy bridges
    await deployBridgesComplete([alfajoresDeploy, kovanDeploy]);
  });

  it('3-chain bridge', async () => {
    // instantiate 3 deploys: alfajores, kovan and rinkeby
    const alfajoresDeploy = new BridgeDeploy(
      deploys[0].chain,
      {},
      '',
      true,
      coreAddresses[0],
    );
    const kovanDeploy = new BridgeDeploy(
      deploys[1].chain,
      { weth: mockWeth.address },
      '',
      true,
      coreAddresses[1],
    );
    const rinkebyDeploy = new BridgeDeploy(
      deploys[2].chain,
      { weth: mockWeth.address },
      '',
      true,
      coreAddresses[2],
    );

    // deploy 3 bridges
    await deployBridgesComplete([alfajoresDeploy, kovanDeploy, rinkebyDeploy]);
  });
});
