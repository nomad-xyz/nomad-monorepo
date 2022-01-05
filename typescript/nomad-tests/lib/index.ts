import '@nomiclabs/hardhat-waffle';
import { extendEnvironment } from 'hardhat/config';

import { nomad } from './core';

import { bridge } from './bridge';

// HardhatRuntimeEnvironment
extendEnvironment((hre) => {
  hre.nomad = nomad;
  hre.bridge = bridge;
});
