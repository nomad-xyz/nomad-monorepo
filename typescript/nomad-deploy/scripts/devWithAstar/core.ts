import { deployComplete } from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import * as astar from '../../config/mainnets/astar';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let kovanConfig = kovan.devConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

let moonbaseAlphaConfig = moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

let astarConfig = astar.config;
const astarDeploy = new CoreDeploy(astar.chain, astarConfig);

deployComplete([kovanDeploy, moonbaseAlphaDeploy, astarDeploy]);
