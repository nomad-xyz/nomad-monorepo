import './lib/index';
import '@nomiclabs/hardhat-waffle';

// This adds support for typescript paths mappings
import 'tsconfig-paths/register';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.7.6',
};
