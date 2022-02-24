import * as ethereum from '../../../config/mainnets/ethereum';
import * as milkomeda from '../../../config/mainnets/milkomeda';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../../src/bridge/BridgeDeploy';
import { deployNewChainBridge } from '../../../src/bridge';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('dev');

// Instantiate existing governor deploy
const governorDeploy = new ExistingBridgeDeploy(
  ethereum.chain,
  ethereum.bridgeConfig,
  path,
);

// make new bridge Deploy
const newDeploy = new BridgeDeploy(
  milkomeda.chain,
  milkomeda.bridgeConfig,
  path,
);

// Deploy bridge with governing hub
deployNewChainBridge(newDeploy, governorDeploy);
