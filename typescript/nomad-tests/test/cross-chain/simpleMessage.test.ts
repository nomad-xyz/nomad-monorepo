import { ethers } from 'hardhat';
import { expect } from 'chai';

import * as utils from './utils';
import { getTestDeploy } from '../testChain';
import { Updater } from 'lib/core';
import { Update, Signer } from 'lib/types';
import { CoreDeploy as Deploy } from '@nomad-xyz/deploy/dist/src/core/CoreDeploy';
import {deployHubAndSpoke} from '@nomad-xyz/deploy/dist/src/core';

const localDomain = 1000;
const remoteDomain = 2000;

/*
 * Deploy the full Nomad suite on two chains
 * dispatch messages to Home
 * sign and submit updates to Home
 * relay updates to Replica
 * confirm updates on Replica
 * TODO prove and process messages on Replica
 */
describe('SimpleCrossChainMessage', async () => {
  // hub is the local deploy and governor chain
  // spoke is the remote deploy
  let hub: Deploy;
  let spoke: Deploy;

  let randomSigner: Signer, updater: Updater, latestUpdate: Update;

  before(async () => {
    [randomSigner] = await ethers.getSigners();
    updater = await Updater.fromSigner(randomSigner, localDomain);

    hub = await getTestDeploy(localDomain, updater.address, []);
    spoke = await getTestDeploy(remoteDomain, updater.address, []);

    await deployHubAndSpoke(hub, [spoke]);
  });

  it('All Homes have correct initial state', async () => {
    const nullRoot = '0x' + '00'.repeat(32);

    // governorHome has 0 updates
    const governorHome = hub.contracts.home?.proxy!;

    let length = await governorHome.queueLength();
    expect(length).to.equal(0);

    let [suggestedCommitted, suggestedNew] = await governorHome.suggestUpdate();
    expect(suggestedCommitted).to.equal(nullRoot);
    expect(suggestedNew).to.equal(nullRoot);

    // nonGovernorHome has 2 updates
    const nonGovernorHome = spoke.contracts.home?.proxy!;

    length = await nonGovernorHome.queueLength();
    expect(length).to.equal(1);

    [suggestedCommitted, suggestedNew] = await nonGovernorHome.suggestUpdate();
    expect(suggestedCommitted).to.equal(nullRoot);
    expect(suggestedNew).to.not.equal(nullRoot);
  });

  it('Origin Home Accepts one valid update', async () => {
    const messages = ['message'].map((message) =>
      utils.formatMessage(message, remoteDomain, randomSigner.address),
    );
    const update = await utils.dispatchMessagesAndUpdateHome(
      hub.contracts.home?.proxy!,
      messages,
      updater,
    );

    latestUpdate = update;
  });

  it('Destination Replica Accepts the first update', async () => {
    await utils.updateReplica(
      latestUpdate,
      spoke.contracts.replicas[localDomain].proxy!,
    );
  });

  it('Origin Home Accepts an update with several batched messages', async () => {
    const messages = ['message1', 'message2', 'message3'].map((message) =>
      utils.formatMessage(message, remoteDomain, randomSigner.address),
    );
    const update = await utils.dispatchMessagesAndUpdateHome(
      hub.contracts.home?.proxy!,
      messages,
      updater,
    );
    latestUpdate = update;
  });

  it('Destination Replica Accepts the second update', async () => {
    await utils.updateReplica(
      latestUpdate,
      spoke.contracts.replicas[localDomain].proxy,
    );
  });

  it('Destination Replica shows latest update as the committed root', async () => {
    const replica = spoke.contracts.replicas[localDomain].proxy;
    const { newRoot } = latestUpdate;
    expect(await replica.committedRoot()).to.equal(newRoot);
  });
});
