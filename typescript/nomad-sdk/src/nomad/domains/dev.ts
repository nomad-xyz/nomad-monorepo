import { NomadDomain } from './domain';

// Note: 
// Commented out as the current deployment doesn't include rinkeby
//
// export const rinkeby: NomadDomain = {
//   name: 'rinkeby',
//   paginate: {
//     blocks: 2000, 
//     from: 9811702,
//   },
//   id: 2000,
//   bridgeRouter: '0x9EA9754A42d99A41D17Ee4b6330Fc5a9C785E2e9',
//   tokenRegistry: 'TODO',
//   ethHelper: '0x4882cbF04c2c825d8FfB91CfF7F748a86B05F3f3',
//   home: '0x5E52A432958d2eE8B87da0E2875a8d56abdd3000',
//   replicas: [
//     { 
//       domain: 1000, 
//       address: '0x700C84df52388f0D5d23F8565a2B40D85d0348A3' 
//     },
//     {
//       domain: 3000,
//       address: '0x07d12F93980661E17ACa9034b15B285b495f4863',
//     },
//     {
//       domain: 5000,
//       address: '0x6aA7eC78A9B8D15487F6C181f5446239d61592A9',
//     },
    
//   ],
// };

export const kovan: NomadDomain = {
  name: 'kovan',
  paginate: {
    blocks: 2000,
    from: 28759727,
  },
  id: 3000,
  bridgeRouter: '0x3A3f8d6741f106ACb76763299CEF9239C3A0e929',
  tokenRegistry: 'TODO',
  ethHelper: '0x5Fa9A1B5149c3A85d02a43Bb7Aa5C9a72956b0eB',
  home: '0x5635b4B8Ea091b56A64317A89512ad9564BbcafB',
  replicas: [
    { 
      domain: 5000, 
      address: '0x84683c2d02FF9DfC65cc2c18Cf668773b318B224' 
    },
    
  ],
};

export const moonbasealpha: NomadDomain = {
  name: 'moonbasealpha',
  paginate: {
    blocks: 2000, 
    from: 1485048,
  },
  id: 5000,
  bridgeRouter: '0x7F0Ee81930DdaeDB77cA2FF569Fe0A9963D95627',
  tokenRegistry: 'TODO',
  home: '0x20f63643D5E521E8C1d6D73a2dd09D3C5e752Cbe',
  replicas: [
    {
      domain: 3000,
      address: '0xF90FbAc8F2ddc0BAc21A09494c9FD1b94d3311e2',
    },
  ],
};

export const devDomains = [kovan, moonbasealpha];
