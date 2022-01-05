import { deployNChains } from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { CoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';

let environment = deployEnvironment();

let kovanConfig =
  environment === 'staging' ? kovan.stagingConfig : kovan.devConfig;
let moonbaseAlphaConfig =
  environment === 'staging'
    ? moonbasealpha.stagingConfig
    : moonbasealpha.devConfig;


const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

deployNChains([
  kovanDeploy,
  moonbaseAlphaDeploy,
]);
