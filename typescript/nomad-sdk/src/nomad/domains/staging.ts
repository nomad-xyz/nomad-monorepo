import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  name: 'kovan',
  id: 3000,
  paginate: {
    from: 29329838,
    blocks: 2000,
  },
  home: '0x134610222e796deAdDe52Fd2E4710D55A32899d5',
  replicas: [
    {
      domain: 1634956402,
      address: '0xF36d789E1A2cceC74476b4842e43bd1C58d3aB67',
    },
  ],
  governanceRouter: '0x3B58BE35841176f00684af0e1Cc59D88c8e0847c',
  bridgeRouter: '0x9aE2c4CA2ABaeE4f3C74057326686D27F0B44d68',
  tokenRegistry: '0x7D27AC216F7239260fd3594f265401977fea69f9',
  ethHelper: '0x77d3406cE820A4740906ca4849ad7e38B896EfF8',
};

export const astar: NomadDomain = {
  name: 'astar',
  id: 1634956402,
  paginate: {
    from: 222746,
    blocks: 2000,
  },
  home: '0xab838C2D976Ad2daa8cAbd20BC55632e33A6f5d6',
  replicas: [
    {
      domain: 3000,
      address: '0x044d4615e14237888669C918b3d0069bD6682905',
    },
  ],
  governanceRouter: '0xD02E93492564567A02A78F16a21532a088Ce056B',
  bridgeRouter: '0xb115014bB06faDaD1687292DA3d2918f4a637e12',
  tokenRegistry: '0x7470523E698cC52F05E8dd60Ef8a7a8fF1c819c5',
  ethHelper: '0x579b5c2d973cF47E5AE0294A0beba9CB2076F220',
};

export const stagingDomains = [kovan, astar];
