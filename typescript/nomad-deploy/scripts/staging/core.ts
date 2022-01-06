import {deployHubAndSpoke} from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from "../../config/testnets/moonbasealpha";
import { CoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';

let environment = deployEnvironment();

let kovanConfig =
    environment === 'staging' ? kovan.stagingConfig : kovan.devConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

let moonbaseAlphaConfig =
    environment === 'staging'
        ? moonbasealpha.stagingConfig
        : moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
    moonbasealpha.chain,
    moonbaseAlphaConfig,
);

deployHubAndSpoke( kovanDeploy, [ moonbaseAlphaDeploy]);
