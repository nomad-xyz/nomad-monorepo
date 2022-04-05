import * as ethereum from '../../../../config/mainnets/ethereum';
import * as evmos from '../../../../config/mainnets/evmos';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../../../src/bridge/BridgeDeploy';
import { deployNewChainBridge } from '../../../../src/bridge';
import { getPathToDeployConfig } from '../../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('prod');

// Instantiate existing governor deploy
const governorDeploy = new ExistingBridgeDeploy(
  ethereum.chain,
  ethereum.bridgeConfig,
  path,
);

// make new bridge Deploy
const newDeploy = new BridgeDeploy(
  evmos.chain,
  evmos.bridgeConfig,
  path,
);

// Deploy bridge with governing hub
deployNewChainBridge(newDeploy, governorDeploy);
