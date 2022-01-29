import { deployComplete } from '../../src/core';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as milkomedaTestnet from '../../config/testnets/milkomedaTestnet';
import { CoreDeploy } from '../../src/core/CoreDeploy';

let rinkebyConfig = rinkeby.devConfig;
const rinkebyDeploy = new CoreDeploy(rinkeby.chain, rinkebyConfig);

let milkomedaTestnetConfig = milkomedaTestnet.devConfig;
const milkomedaTestnetDeploy = new CoreDeploy(
  milkomedaTestnet.chain,
  milkomedaTestnetConfig,
);

deployComplete([rinkebyDeploy, milkomedaTestnetDeploy]);
