import {deployComplete} from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let kovanConfig = kovan.devConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

let moonbaseAlphaConfig = moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
  moonbasealpha.chain,
  moonbaseAlphaConfig,
);

deployComplete([kovanDeploy, moonbaseAlphaDeploy]);
