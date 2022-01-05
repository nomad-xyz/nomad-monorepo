import { ethers } from 'hardhat';

import {
  CoreConfig,
  CoreDeploy,
} from '@nomad-xyz/deploy/dist/src/core/CoreDeploy';
import { Chain, DEFAULT_GAS } from '@nomad-xyz/deploy/dist/src/chain';

export async function getTestChain(
  domain: number,
  updater: string,
  watchers: string[],
  recoveryManager?: string,
): Promise<[Chain, CoreConfig]> {
  const [, , , , , , , deployer] = await ethers.getSigners();
  return [
    {
      name: 'hh',
      provider: ethers.provider,
      deployer,
      gas: DEFAULT_GAS,
      confirmations: 0,
      domain,
      config: {
        domain,
        name: 'hh',
        rpc: 'NA',
        chunk: 2000,
        timelag: 5,
      },
    },
    {
      environment: 'dev',
      recoveryTimelock: 1,
      recoveryManager: recoveryManager || ethers.constants.AddressZero,
      updater,
      optimisticSeconds: 3,
      watchers,
      processGas: 850_000,
      reserveGas: 15_000,
    },
  ];
}

export async function getTestDeploy(
  domain: number,
  updater: string,
  watchers: string[],
  recoveryManager?: string,
): Promise<CoreDeploy> {
  const [chain, config] = await getTestChain(
    domain,
    updater,
    watchers,
    recoveryManager,
  );
  return new CoreDeploy(chain, config, true);
}
