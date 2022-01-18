import { deployComplete } from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as astar from '../../config/mainnets/astar';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let kovanConfig = kovan.stagingConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

let astarConfig = astar.stagingConfig;
const astarDeploy = new CoreDeploy(astar.chain, astarConfig);

deployComplete([kovanDeploy, astarDeploy]);
