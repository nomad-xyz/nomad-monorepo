import { NomadDomain } from './domain';

export const alfajores: NomadDomain = {
  name: 'alfajores',
  paginate: {
    blocks: 2000,
    from: 8820979,
  },
  id: 1000,
  bridgeRouter: '0x38aCafA61Be6a42161392f42B8C6234e44C09316',
  tokenRegistry: 'TODO',
  home: '0xd9361a00429Cb82292D19c6D448c1A9901b39180',
  replicas: [
    { domain: 2000, 
      address: '0xFdfA971948D8498968d297e4081D925FDf13F898' },
    {
      domain: 3000,
      address: '0xd4f7A973b08f64B8f8B558aC8016Fc2e0B77Ad08',
    },
    {
      domain: 5000,
      address: '0xe33088C011184C68EB376c1A643785ac7817ADBC',
    },
  ],
};

export const rinkeby: NomadDomain = {
  name: 'rinkeby',
  paginate: {
    blocks: 2000, 
    from: 9811702,
  },
  id: 2000,
  bridgeRouter: '0x9EA9754A42d99A41D17Ee4b6330Fc5a9C785E2e9',
  tokenRegistry: 'TODO',
  ethHelper: '0x4882cbF04c2c825d8FfB91CfF7F748a86B05F3f3',
  home: '0x5E52A432958d2eE8B87da0E2875a8d56abdd3000',
  replicas: [
    { 
      domain: 1000, 
      address: '0x700C84df52388f0D5d23F8565a2B40D85d0348A3' 
    },
    {
      domain: 3000,
      address: '0x07d12F93980661E17ACa9034b15B285b495f4863',
    },
    {
      domain: 5000,
      address: '0x6aA7eC78A9B8D15487F6C181f5446239d61592A9',
    },
    
  ],
};

export const kovan: NomadDomain = {
  name: 'kovan',
  paginate: {
    blocks: 2000,
    from: 28759727,
  },
  id: 3000,
  bridgeRouter: '0x584D6364946c56F7CA84939df253600Ea7d24C89',
  tokenRegistry: 'TODO',
  ethHelper: '0x5Fa9A1B5149c3A85d02a43Bb7Aa5C9a72956b0eB',
  home: '0x8B548745Dc467AA92D5E0709958e4cb2467A3381',
  replicas: [
    {
      domain: 1000,
      address: '0xcC4D45f31c9Fee823C7Ce2F86CFC3551A11806Aa',
    },
    { 
      domain: 2000, 
      address: '0x130d7c8B1Cb2a388B88AFdbf69EDDCddAA5822B1' 
    },
    { 
      domain: 5000, 
      address: '0x2c4e0Fe0962217D2cB8f2667EF51BE7408347BbB' 
    },
    
  ],
};

export const moonbasealpha: NomadDomain = {
  name: 'moonbasealpha',
  paginate: {
    blocks: 2000, 
    from: 1347815,
  },
  id: 5000,
  bridgeRouter: '0x64A375321dB2bA1f647dAf7b4e786700aCDAe1FA',
  tokenRegistry: 'TODO',
  home: '0xaB308Abb7DBD8edA27BB19c6069929Ea2b637aba',
  replicas: [
    { 
      domain: 1000, 
      address: '0x282abF00D2D0A78e82895F15d0eFc57bCb055544' 
    },
    {
      domain: 2000,
      address: '0x49c2dB60F45fD98eb290E24f464d8951Cd7B3153',
    },
    {
      domain: 3000,
      address: '0x8515b9A50616D48CC3313cfa7b07a463813E8A45',
    },
  ],
};

export const devDomains = [alfajores, kovan, rinkeby, moonbasealpha];
