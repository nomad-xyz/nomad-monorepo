import { deployHubAndSpoke } from '../../src/core';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import * as kovan from '../../config/testnets/kovan';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let rinkebyConfig = rinkeby.devConfig;
const rinkebyDeploy = new CoreDeploy(rinkeby.chain, rinkebyConfig);

let moonbaseAlphaConfig = moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

let kovanConfig = kovan.devConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

deployHubAndSpoke(rinkebyDeploy, [moonbaseAlphaDeploy, kovanDeploy]);
