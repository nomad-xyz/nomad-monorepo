import { ethers, nomad } from 'hardhat';
import { expect } from 'chai';
import * as types from 'ethers';

import { formatCall, sendFromSigner } from './utils';
import { increaseTimestampBy } from '../utils';
import { getTestDeploy } from '../testChain';
import { Updater } from 'lib/core';
import { Signer } from 'lib/types';
import {CoreDeploy} from '@nomad-xyz/deploy/dist/src/core/CoreDeploy';
import {deployHubAndSpoke} from '@nomad-xyz/deploy/dist/src/core';
import * as contracts from '@nomad-xyz/contract-interfaces/core';

async function expectNotInRecovery(
  updaterManager: contracts.UpdaterManager,
  recoveryManager: types.Signer,
  randomSigner: Signer,
  governor: Signer,
  governanceRouter: contracts.TestGovernanceRouter,
  home: contracts.TestHome,
) {
  const oldUpdater = await updaterManager.updater();
  expect(await governanceRouter.inRecovery()).to.be.false;

  // Format nomad call message
  const call = await formatCall(updaterManager, 'setUpdater', [
    randomSigner.address,
  ]);

  // Expect that Governor *CAN* Call Local & Call Remote
  // dispatch call on local governorRouter
  await expect(
    sendFromSigner(governor, governanceRouter, 'executeGovernanceActions', [
      [call],
      [],
      [],
    ]),
  )
    .to.emit(home, 'NewUpdater')
    .withArgs(oldUpdater, randomSigner.address);

  // dispatch call on local governorRouter
  await expect(
    sendFromSigner(governor, governanceRouter, 'executeGovernanceActions', [
      [],
      [2000],
      [[call]],
    ]),
  ).to.emit(home, 'Dispatch');

  // set xApp Connection Manager
  const xAppConnectionManager = await governanceRouter.xAppConnectionManager();
  await expect(
    sendFromSigner(governor, governanceRouter, 'setXAppConnectionManager', [
      randomSigner.address,
    ]),
  ).to.not.be.reverted;
  // reset xApp Connection Manager to actual contract
  await sendFromSigner(governor, governanceRouter, 'setXAppConnectionManager', [
    xAppConnectionManager,
  ]);

  // set Router Locally
  const otherDomain = 2000;
  const previousRouter = await governanceRouter.routers(otherDomain);
  await expect(
    sendFromSigner(governor, governanceRouter, 'setRouterLocal', [
      2000,
      nomad.ethersAddressToBytes32(randomSigner.address),
    ]),
  )
    .to.emit(governanceRouter, 'SetRouter')
    .withArgs(
      otherDomain,
      previousRouter,
      nomad.ethersAddressToBytes32(randomSigner.address),
    );

  // Expect that Recovery Manager CANNOT Call Local OR Call Remote
  // cannot dispatch call on local governorRouter
  await expect(
    sendFromSigner(
      recoveryManager,
      governanceRouter,
      'executeGovernanceActions',
      [[call], [], []],
    ),
  ).to.be.revertedWith('! called by governor');

  // cannot dispatch call to remote governorRouter
  await expect(
    sendFromSigner(
      recoveryManager,
      governanceRouter,
      'executeGovernanceActions',
      [[], [2000], [[call]]],
    ),
  ).to.be.revertedWith('! called by governor');

  // cannot set xAppConnectionManager
  await expect(
    sendFromSigner(
      recoveryManager,
      governanceRouter,
      'setXAppConnectionManager',
      [randomSigner.address],
    ),
  ).to.be.revertedWith('! called by governor');

  // cannot set Router
  await expect(
    sendFromSigner(recoveryManager, governanceRouter, 'setRouterLocal', [
      2000,
      nomad.ethersAddressToBytes32(randomSigner.address),
    ]),
  ).to.be.revertedWith('! called by governor');
}

async function expectOnlyRecoveryManagerCanTransferRole(
  governor: Signer,
  governanceRouter: contracts.TestGovernanceRouter,
  randomSigner: Signer,
  recoveryManager: Signer,
) {
  await expect(
    sendFromSigner(governor, governanceRouter, 'transferRecoveryManager', [
      randomSigner.address,
    ]),
  ).to.be.revertedWith('! called by recovery manager');

  await expect(
    sendFromSigner(randomSigner, governanceRouter, 'transferRecoveryManager', [
      randomSigner.address,
    ]),
  ).to.be.revertedWith('! called by recovery manager');

  await expect(
    sendFromSigner(
      recoveryManager,
      governanceRouter,
      'transferRecoveryManager',
      [randomSigner.address],
    ),
  )
    .to.emit(governanceRouter, 'TransferRecoveryManager')
    .withArgs(recoveryManager.address, randomSigner.address);

  await expect(
    sendFromSigner(randomSigner, governanceRouter, 'transferRecoveryManager', [
      recoveryManager.address,
    ]),
  )
    .to.emit(governanceRouter, 'TransferRecoveryManager')
    .withArgs(randomSigner.address, recoveryManager.address);
}

async function expectOnlyRecoveryManagerCanExitRecovery(
  governor: Signer,
  governanceRouter: contracts.TestGovernanceRouter,
  randomSigner: Signer,
  recoveryManager: Signer,
) {
  await expect(
    sendFromSigner(governor, governanceRouter, 'exitRecovery', []),
  ).to.be.revertedWith('! called by recovery manager');

  await expect(
    sendFromSigner(randomSigner, governanceRouter, 'exitRecovery', []),
  ).to.be.revertedWith('! called by recovery manager');

  await expect(
    sendFromSigner(recoveryManager, governanceRouter, 'exitRecovery', []),
  )
    .to.emit(governanceRouter, 'ExitRecovery')
    .withArgs(recoveryManager.address);
}

async function expectOnlyRecoveryManagerCanInitiateRecovery(
  governor: Signer,
  governanceRouter: contracts.TestGovernanceRouter,
  randomSigner: Signer,
  recoveryManager: Signer,
) {
  await expect(
    sendFromSigner(governor, governanceRouter, 'initiateRecoveryTimelock', []),
  ).to.be.revertedWith('! called by recovery manager');

  await expect(
    sendFromSigner(
      randomSigner,
      governanceRouter,
      'initiateRecoveryTimelock',
      [],
    ),
  ).to.be.revertedWith('! called by recovery manager');

  expect(await governanceRouter.recoveryActiveAt()).to.equal(0);

  await expect(
    sendFromSigner(
      recoveryManager,
      governanceRouter,
      'initiateRecoveryTimelock',
      [],
    ),
  ).to.emit(governanceRouter, 'InitiateRecovery');

  expect(await governanceRouter.recoveryActiveAt()).to.not.equal(0);
}

const localDomain = 1000;
const remoteDomain = 2000;
const extraDomain = 3000;

/*
 * Deploy the full Nomad suite on two chains
 */
describe('RecoveryManager', async () => {
  let governor: Signer,
    recoveryManager: Signer,
    randomSigner: Signer,
    governanceRouter: contracts.TestGovernanceRouter,
    home: contracts.TestHome,
    updaterManager: contracts.UpdaterManager;

  before(async () => {
    [governor, recoveryManager, randomSigner] = await ethers.getSigners();
    const updater = await Updater.fromSigner(randomSigner, localDomain);


    const hub: CoreDeploy = await getTestDeploy(
        localDomain,
        updater.address,
        [],
        recoveryManager.address,
      );

    const spoke: CoreDeploy = await getTestDeploy(
        remoteDomain,
        updater.address,
        [],
        recoveryManager.address,
      );

    const extraSpoke: CoreDeploy = await getTestDeploy(
        extraDomain,
        updater.address,
        [],
        recoveryManager.address,
    );

    await deployHubAndSpoke(hub, [spoke, extraSpoke]);

    governanceRouter = hub.contracts.governance
      ?.proxy! as contracts.TestGovernanceRouter;
    home = hub.contracts.home?.proxy! as contracts.TestHome;
    updaterManager = hub.contracts.updaterManager!;

    // set governor
    await governanceRouter.transferGovernor(localDomain, governor.address);
  });

  describe('Before Recovery Initiated', () => {
    it('Timelock has not been set', async () => {
      expect(await governanceRouter.recoveryActiveAt()).to.equal(0);
    });

    it('Cannot Exit Recovery yet', async () => {
      await expect(
        sendFromSigner(recoveryManager, governanceRouter, 'exitRecovery', []),
      ).to.be.revertedWith('recovery not initiated');
    });

    it('Not in Recovery (Governor CAN Call Local & Remote; Recovery Manager CANNOT Call either)', async () => {
      await expectNotInRecovery(
        updaterManager,
        recoveryManager,
        randomSigner,
        governor,
        governanceRouter,
        home,
      );
    });

    it('ONLY RecoveryManager can transfer RecoveryManager role', async () => {
      await expectOnlyRecoveryManagerCanTransferRole(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });

    it('ONLY RecoveryManager can Initiate Recovery', async () => {
      await expectOnlyRecoveryManagerCanInitiateRecovery(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });
  });

  describe('Before Recovery Active', async () => {
    it('CANNOT Initiate Recovery Twice', async () => {
      await expect(
        sendFromSigner(
          recoveryManager,
          governanceRouter,
          'initiateRecoveryTimelock',
          [],
        ),
      ).to.be.revertedWith('recovery already initiated');
    });

    it('Not in Recovery (Governor CAN Call Local & Remote; Recovery Manager CANNOT Call either)', async () => {
      await expectNotInRecovery(
        updaterManager,
        recoveryManager,
        randomSigner,
        governor,
        governanceRouter,
        home,
      );
    });

    it('ONLY RecoveryManager can transfer RecoveryManager role', async () => {
      await expectOnlyRecoveryManagerCanTransferRole(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });

    it('ONLY RecoveryManager can Exit Recovery', async () => {
      await expectOnlyRecoveryManagerCanExitRecovery(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });

    it('ONLY RecoveryManager can Initiate Recovery (CAN initiate a second time)', async () => {
      await expectOnlyRecoveryManagerCanInitiateRecovery(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });
  });

  describe('Recovery Active', async () => {
    it('inRecovery becomes true when timelock expires', async () => {
      // increase timestamp on-chain
      const timelock = await governanceRouter.recoveryTimelock();
      await increaseTimestampBy(ethers.provider, timelock.toNumber());
      expect(await governanceRouter.inRecovery()).to.be.true;
    });

    it('RecoveryManager CAN call local', async () => {
      const oldUpdater = await updaterManager.updater();

      // Format nomad call message
      const call = await formatCall(updaterManager, 'setUpdater', [
        randomSigner.address,
      ]);

      // dispatch call on local governorRouter
      await expect(
        sendFromSigner(
          recoveryManager,
          governanceRouter,
          'executeGovernanceActions',
          [[call], [], []],
        ),
      )
        .to.emit(home, 'NewUpdater')
        .withArgs(oldUpdater, randomSigner.address);
    });

    it('RecoveryManager CANNOT call remote', async () => {
      // Format nomad call message
      const call = await formatCall(updaterManager, 'setUpdater', [
        randomSigner.address,
      ]);

      // dispatch call on local governorRouter
      await expect(
        sendFromSigner(
          recoveryManager,
          governanceRouter,
          'executeGovernanceActions',
          [[], [2000], [[call]]],
        ),
      ).to.be.revertedWith('!remote calls in recovery mode');
    });

    it('RecoveryManager CAN set xAppConnectionManager', async () => {
      // set xApp Connection Manager
      const xAppConnectionManager =
        await governanceRouter.xAppConnectionManager();
      await expect(
        sendFromSigner(
          recoveryManager,
          governanceRouter,
          'setXAppConnectionManager',
          [randomSigner.address],
        ),
      ).to.not.be.reverted;
      // reset xApp Connection Manager to actual contract
      await sendFromSigner(
        recoveryManager,
        governanceRouter,
        'setXAppConnectionManager',
        [xAppConnectionManager],
      );
    });

    it('RecoveryManager CAN set Router locally', async () => {
      const otherDomain = 2000;
      const previousRouter = await governanceRouter.routers(otherDomain);
      await expect(
        sendFromSigner(recoveryManager, governanceRouter, 'setRouterLocal', [
          2000,
          nomad.ethersAddressToBytes32(randomSigner.address),
        ]),
      )
        .to.emit(governanceRouter, 'SetRouter')
        .withArgs(
          otherDomain,
          previousRouter,
          nomad.ethersAddressToBytes32(randomSigner.address),
        );
    });

    it('Governor CANNOT call local OR remote', async () => {
      // Format nomad call message
      const call = await formatCall(updaterManager, 'setUpdater', [
        randomSigner.address,
      ]);

      // dispatch call on local governorRouter
      await expect(
        sendFromSigner(governor, governanceRouter, 'executeGovernanceActions', [
          [call],
          [],
          [],
        ]),
      ).to.be.revertedWith('! called by recovery manager');

      // dispatch call to remote governorRouter
      await expect(
        sendFromSigner(governor, governanceRouter, 'executeGovernanceActions', [
          [],
          [2000],
          [[call]],
        ]),
      ).to.be.revertedWith('! called by recovery manager');
    });

    it('Governor CANNOT set xAppConnectionManager', async () => {
      // cannot set xAppConnectionManager
      await expect(
        sendFromSigner(governor, governanceRouter, 'setXAppConnectionManager', [
          randomSigner.address,
        ]),
      ).to.be.revertedWith('! called by recovery manager');
    });

    it('Governor CANNOT set Router locally', async () => {
      // cannot set Router
      await expect(
        sendFromSigner(governor, governanceRouter, 'setRouterLocal', [
          2000,
          nomad.ethersAddressToBytes32(randomSigner.address),
        ]),
      ).to.be.revertedWith('! called by recovery manager');
    });

    it('ONLY RecoveryManager can transfer RecoveryManager role', async () => {
      await expectOnlyRecoveryManagerCanTransferRole(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });

    it('ONLY RecoveryManager can Exit Recovery', async () => {
      await expectOnlyRecoveryManagerCanExitRecovery(
        governor,
        governanceRouter,
        randomSigner,
        recoveryManager,
      );
    });
  });

  it('Exited Recovery: Timelock is deleted', async () => {
    expect(await governanceRouter.recoveryActiveAt()).to.equal(0);
  });

  it('Exited Recovery: Not in Recovery (Governor CAN Call Local & Remote; Recovery Manager CANNOT Call either)', async () => {
    await expectNotInRecovery(
      updaterManager,
      recoveryManager,
      randomSigner,
      governor,
      governanceRouter,
      home,
    );
  });

  it('Exited Recovery: ONLY RecoveryManager can transfer RecoveryManager role', async () => {
    await expectOnlyRecoveryManagerCanTransferRole(
      governor,
      governanceRouter,
      randomSigner,
      recoveryManager,
    );
  });
});
