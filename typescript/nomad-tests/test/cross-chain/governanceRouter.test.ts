import { ethers, nomad } from 'hardhat';
import { expect } from 'chai';

import { formatCall, formatNomadMessage } from './utils';
import { UpgradeTestHelpers } from '../utils';
import { getTestDeploy } from '../testChain';
import { Updater } from 'lib/core';
import { Address, Signer } from 'lib/types';
import { CoreDeploy as Deploy } from '@nomad-xyz/deploy/dist/src/core/CoreDeploy';
import {
  deployHubAndSpoke,
  deployUnenrolledReplica,
} from '@nomad-xyz/deploy/dist/src/core';
import * as contracts from '@nomad-xyz/contract-interfaces/core';

const governorDomain = 1000;
const nonGovernorDomain = 2000;
const thirdDomain = 3000;

/*
 * Deploy the full Nomad suite on two chains
 */
describe('GovernanceRouter', async () => {
  let hub: Deploy;
  let spoke: Deploy;
  let extraSpoke: Deploy;

  let signer: Signer,
    secondGovernorSigner: Signer,
    thirdRouter: Signer,
    governorRouter: contracts.TestGovernanceRouter,
    governorHome: contracts.Home,
    governorReplicaOnNonGovernorChain: contracts.TestReplica,
    nonGovernorRouter: contracts.TestGovernanceRouter,
    nonGovernorReplicaOnGovernorChain: contracts.TestReplica,
    firstGovernor: Address,
    secondGovernor: Address,
    updater: Updater;

  async function expectGovernor(
    governanceRouter: contracts.TestGovernanceRouter,
    expectedGovernorDomain: number,
    expectedGovernor: Address,
  ) {
    expect(await governanceRouter.governorDomain()).to.equal(
      expectedGovernorDomain,
    );
    expect(await governanceRouter.governor()).to.equal(expectedGovernor);
  }

  before(async () => {
    [thirdRouter, signer, secondGovernorSigner] = await ethers.getSigners();
    updater = await Updater.fromSigner(signer, governorDomain);
  });

  beforeEach(async () => {
    // reset deploys
    hub = await getTestDeploy(governorDomain, updater.address, []);
    spoke = await getTestDeploy(nonGovernorDomain, updater.address, []);
    extraSpoke = await getTestDeploy(thirdDomain, updater.address, []);

    // deploy the entire Nomad suite on two chains
    await deployHubAndSpoke(hub, [spoke, extraSpoke]);

    // get both governanceRouters
    governorRouter = hub.contracts.governance
      ?.proxy! as contracts.TestGovernanceRouter;
    nonGovernorRouter = spoke.contracts.governance
      ?.proxy! as contracts.TestGovernanceRouter;

    firstGovernor = await governorRouter.governor();
    secondGovernor = await secondGovernorSigner.getAddress();

    governorHome = hub.contracts.home?.proxy!;

    governorReplicaOnNonGovernorChain = spoke.contracts.replicas[
      governorDomain
    ].proxy! as contracts.TestReplica;
    nonGovernorReplicaOnGovernorChain = hub.contracts.replicas[
      nonGovernorDomain
    ].proxy! as contracts.TestReplica;
  });

  it('Rejects message from unenrolled replica', async () => {
    await deployUnenrolledReplica(spoke, extraSpoke);

    const unenrolledReplica = spoke.contracts.replicas[thirdDomain]
      .proxy! as contracts.TestReplica;

    // Create TransferGovernor message
    const transferGovernorMessage = nomad.governance.formatTransferGovernor(
      thirdDomain,
      nomad.ethersAddressToBytes32(secondGovernor),
    );

    const nomadMessage = await formatNomadMessage(
      unenrolledReplica,
      governorRouter,
      nonGovernorRouter,
      transferGovernorMessage,
    );

    // Expect replica processing to fail when nonGovernorRouter reverts in handle
    let success = await unenrolledReplica.callStatic.testProcess(nomadMessage);
    expect(success).to.be.false;
  });

  it('Rejects message not from governor router', async () => {
    // Create TransferGovernor message
    const transferGovernorMessage = nomad.governance.formatTransferGovernor(
      nonGovernorDomain,
      nomad.ethersAddressToBytes32(nonGovernorRouter.address),
    );

    const nomadMessage = await formatNomadMessage(
      governorReplicaOnNonGovernorChain,
      nonGovernorRouter,
      governorRouter,
      transferGovernorMessage,
    );

    // Set message status to MessageStatus.Pending
    await nonGovernorReplicaOnGovernorChain.setMessagePending(nomadMessage);

    // Expect replica processing to fail when nonGovernorRouter reverts in handle
    let success =
      await nonGovernorReplicaOnGovernorChain.callStatic.testProcess(
        nomadMessage,
      );
    expect(success).to.be.false;
  });

  it('Sets routers based on batched remote calls', async () => {
    // Enroll router for new domain (in real setting this would
    // be executed with an Nomad message sent to the nonGovernorRouter)
    await nonGovernorRouter.testSetRouterGlobal(
      thirdDomain,
      nomad.ethersAddressToBytes32(thirdRouter.address),
    );

    // Create TransferGovernor message
    const transferGovernorMessage = nomad.governance.formatTransferGovernor(
      thirdDomain,
      nomad.ethersAddressToBytes32(thirdRouter.address),
    );

    const nomadMessage = await formatNomadMessage(
      governorReplicaOnNonGovernorChain,
      governorRouter,
      nonGovernorRouter,
      transferGovernorMessage,
    );

    // Expect successful tx on static call
    let success = await governorReplicaOnNonGovernorChain.callStatic.process(
      nomadMessage,
    );
    expect(success).to.be.true;

    await governorReplicaOnNonGovernorChain.process(nomadMessage);
    await expectGovernor(
      nonGovernorRouter,
      thirdDomain,
      ethers.constants.AddressZero,
    );
  });

  it('Accepts valid batch messages', async () => {
    // const TestRecipient = await nomad.deployImplementation('TestRecipient');
    const testRecipientFactory = new contracts.TestRecipient__factory(signer);
    const TestRecipient = await testRecipientFactory.deploy();

    // Format nomad call message
    const arg = 'String!';
    const call = formatCall(TestRecipient, 'receiveString', [arg]);

    // Create Call message to test recipient that calls receiveString
    const batchMessage = nomad.governance.formatBatch([call, call]);
    const batchHash = ethers.utils.keccak256(
      nomad.governance.serializeCalls([call, call]),
    );
    const nomadMessage = await formatNomadMessage(
      governorReplicaOnNonGovernorChain,
      governorRouter,
      nonGovernorRouter,
      batchMessage,
    );

    // Expect successful tx
    const success =
      await governorReplicaOnNonGovernorChain.callStatic.testProcess(
        nomadMessage,
      );
    expect(success).to.be.true;

    await expect(
      nonGovernorRouter.executeCallBatch([call, call]),
    ).to.be.revertedWith('!batch pending');

    await expect(governorReplicaOnNonGovernorChain.testProcess(nomadMessage))
      .to.emit(nonGovernorRouter, 'BatchReceived')
      .withArgs(batchHash);

    await expect(nonGovernorRouter.executeCallBatch([call, call]))
      .to.emit(nonGovernorRouter, 'BatchExecuted')
      .withArgs(batchHash);

    await expect(
      nonGovernorRouter.executeCallBatch([call, call]),
    ).to.be.revertedWith('!batch pending');
  });

  it('Transfers governorship', async () => {
    // Transfer governor on current governor chain
    // get root on governor chain before transferring governor
    const committedRoot = await governorHome.committedRoot();

    // Governor HAS NOT been transferred on original governor domain
    await expectGovernor(governorRouter, governorDomain, firstGovernor);
    // Governor HAS NOT been transferred on original non-governor domain
    await expectGovernor(
      nonGovernorRouter,
      governorDomain,
      ethers.constants.AddressZero,
    );

    // transfer governorship to nonGovernorRouter
    await governorRouter.transferGovernor(nonGovernorDomain, secondGovernor);

    // Governor HAS been transferred on original governor domain
    await expectGovernor(
      governorRouter,
      nonGovernorDomain,
      ethers.constants.AddressZero,
    );
    // Governor HAS NOT been transferred on original non-governor domain
    await expectGovernor(
      nonGovernorRouter,
      governorDomain,
      ethers.constants.AddressZero,
    );

    // get new root and signed update
    const newRoot = await governorHome.queueEnd();

    const { signature } = await updater.signUpdate(committedRoot, newRoot);

    // update governor chain home
    await governorHome.update(committedRoot, newRoot, signature);

    const transferGovernorMessage = nomad.governance.formatTransferGovernor(
      nonGovernorDomain,
      nomad.ethersAddressToBytes32(secondGovernor),
    );

    const nomadMessage = await formatNomadMessage(
      governorReplicaOnNonGovernorChain,
      governorRouter,
      nonGovernorRouter,
      transferGovernorMessage,
    );

    // Set current root on replica
    await governorReplicaOnNonGovernorChain.setCommittedRoot(newRoot);

    // Governor HAS been transferred on original governor domain
    await expectGovernor(
      governorRouter,
      nonGovernorDomain,
      ethers.constants.AddressZero,
    );
    // Governor HAS NOT been transferred on original non-governor domain
    await expectGovernor(
      nonGovernorRouter,
      governorDomain,
      ethers.constants.AddressZero,
    );

    // Process transfer governor message on Replica
    await governorReplicaOnNonGovernorChain.process(nomadMessage);

    // Governor HAS been transferred on original governor domain
    await expectGovernor(
      governorRouter,
      nonGovernorDomain,
      ethers.constants.AddressZero,
    );
    // Governor HAS been transferred on original non-governor domain
    await expectGovernor(nonGovernorRouter, nonGovernorDomain, secondGovernor);
  });

  it('Upgrades using GovernanceRouter call', async () => {
    const upgradeUtils = new UpgradeTestHelpers();
    const deploy = hub;

    const mysteryMath = await upgradeUtils.deployMysteryMathUpgradeSetup(
      deploy,
      signer,
    );

    const upgradeBeaconController = deploy.contracts.upgradeBeaconController!;

    // expect results before upgrade
    await upgradeUtils.expectMysteryMathV1(mysteryMath.proxy);

    // Deploy Implementation 2
    const v2Factory = new contracts.MysteryMathV2__factory(signer);
    const implementation = await v2Factory.deploy();

    // Format nomad call message
    const call = formatCall(upgradeBeaconController, 'upgrade', [
      mysteryMath.beacon.address,
      implementation.address,
    ]);

    // dispatch call on local governorRouter
    await expect(
      governorRouter.executeGovernanceActions([call], [], []),
    ).to.emit(upgradeBeaconController, 'BeaconUpgraded');

    // test implementation was upgraded
    await upgradeUtils.expectMysteryMathV2(mysteryMath.proxy);
  });

  it('Calls UpdaterManager to change the Updater on Home', async () => {
    const [newUpdater] = await ethers.getSigners();
    const updaterManager = hub.contracts.updaterManager!;

    // check current Updater address on Home
    let currentUpdaterAddr = await governorHome.updater();
    expect(currentUpdaterAddr).to.equal(hub.config.updater);

    // format nomad call message
    const call = formatCall(updaterManager, 'setUpdater', [newUpdater.address]);

    await expect(
      governorRouter.executeGovernanceActions([call], [], []),
    ).to.emit(governorHome, 'NewUpdater');

    // check for new updater
    currentUpdaterAddr = await governorHome.updater();
    expect(currentUpdaterAddr).to.equal(newUpdater.address);
  });
});
