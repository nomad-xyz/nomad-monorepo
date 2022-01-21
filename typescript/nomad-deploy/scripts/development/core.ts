import { deployComplete } from '../../src/core';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let rinkebyConfig = rinkeby.devConfig;
const rinkebyDeploy = new CoreDeploy(rinkeby.chain, rinkebyConfig);

let moonbaseAlphaConfig = moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

deployComplete([rinkebyDeploy, moonbaseAlphaDeploy]);
