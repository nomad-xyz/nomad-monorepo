import {deployHubAndSpoke} from '../../src/core';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from "../../config/testnets/moonbasealpha";
import * as rinkeby from '../../config/testnets/rinkeby';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let kovanConfig = kovan.devConfig;
const kovanDeploy = new CoreDeploy(kovan.chain, kovanConfig);

let moonbaseAlphaConfig = moonbasealpha.devConfig;
const moonbaseAlphaDeploy = new CoreDeploy(
    moonbasealpha.chain,
    moonbaseAlphaConfig,
);

let rinkebyConfig = rinkeby.devConfig;
const rinkebyDeploy = new CoreDeploy(rinkeby.chain, rinkebyConfig);

deployHubAndSpoke(kovanDeploy, [ moonbaseAlphaDeploy, rinkebyDeploy]);
