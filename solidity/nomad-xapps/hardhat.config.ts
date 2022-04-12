import "hardhat-gas-reporter";
import "solidity-coverage";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";

import { task } from "hardhat/config";
import { verifyBridgeDeploy } from "../../typescript/nomad-deploy/src/verification/verifyDeploy";

import * as dotenv from "dotenv";
dotenv.config();

const etherscanKey = process.env.ETHERSCAN_API_KEY;
const infuraKey = process.env.INFURA_API_KEY;

task("verify-deploy", "Verifies the source code of the contract deploy")
  .addParam("environment", "dev, staging or prod")
  .setAction(async (args: any, hre: any) => {
    if (!etherscanKey) {
      throw new Error("set ETHERSCAN_API_KEY");
    }
    await verifyBridgeDeploy(hre, etherscanKey, args.environment);
  });

task("verify-token", "Verifies a token contract")
  .addParam("contractAddress", "address of token contract")
  .addParam("tokenBeacon", "address of token beacon")
  .setAction(async (args: any, hre: any) => {
    await hre.run("verify:verify", {
      address: args.contractAddress,
      constructorArguments: [args.tokenBeacon, Buffer.from("", "utf8")],
    });
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },

  gasReporter: {
    currency: "USD",
  },

  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${infuraKey}`,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraKey}`,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraKey}`,
    },
    moonbeam: {
      url: process.env.MOONBEAM_RPC,
    },
  },

  typechain: {
    outDir: "../../typescript/typechain/bridge",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      moonbeam: process.env.MOONBEAM_MOONSCAN_API_KEY,
    },
  },
};
