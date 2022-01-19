import { deployHubAndSpoke } from '../../src/core';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let rinkebyConfig = rinkeby.stagingConfig;
const rinkebyDeploy = new CoreDeploy(rinkeby.chain, rinkebyConfig);

let moonbaseAlphaConfig = moonbasealpha.stagingConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

deployHubAndSpoke(rinkebyDeploy, [moonbaseAlphaDeploy]);
