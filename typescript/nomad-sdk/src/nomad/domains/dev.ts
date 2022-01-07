import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  name: 'kovan',
  paginate: {
    blocks: 2000,
    from: 28759727,
  },
  id: 3000,
  bridgeRouter: '0x3A3f8d6741f106ACb76763299CEF9239C3A0e929',
  tokenRegistry: '0x53e6d34fc51034923d78D5Cf2a687063b6703096',
  ethHelper: '0x250B6C2C13ab44e67Ed584d324e6d1568B6505be',
  home: '0x5635b4B8Ea091b56A64317A89512ad9564BbcafB',
  // replicas of remote homes deployed to Kovan
  // NOT  Kovan replicas deployed to remote chains
  replicas: [
    {
      domain: 5000,
      address: '0xF90FbAc8F2ddc0BAc21A09494c9FD1b94d3311e2',
    },
  ],
  governanceRouter: '0xC86666B3523c20b00c7F3BAa3d019d40E1b7c9b8',
};

export const moonbasealpha: NomadDomain = {
  name: 'moonbasealpha',
  paginate: {
    blocks: 2000,
    from: 1485048,
  },
  id: 5000,
  bridgeRouter: '0x7F0Ee81930DdaeDB77cA2FF569Fe0A9963D95627',
  tokenRegistry: '0xca445BA4554cB9f2cA90f63d14A73D568dE67cc6',
  home: '0x20f63643D5E521E8C1d6D73a2dd09D3C5e752Cbe',
  // replicas of remote homes deployed to Moonbasealpha
  // NOT  Moonbasealpha replicas deployed to remote chains
  replicas: [
    {
      domain: 3000,
      address: '0x84683c2d02FF9DfC65cc2c18Cf668773b318B224',
    },
  ],
  governanceRouter: '0xC72B0CBA22aC0d790B567E806E6e3257aAB103Fe',
};

export const devDomains = [kovan, moonbasealpha];
