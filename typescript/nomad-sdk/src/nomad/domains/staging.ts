import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  name: 'kovan',
  id: 3000,
  bridgeRouter: '0xB7ED67D47C5A04d8A81a096bEc281785C2a51efD',
  tokenRegistry: '0x0aA680320d096B4550132b2e8cF4832fF54E9974',
  ethHelper: '0xEA1472f4c01916471390579aCd43d2289a1624D5',
  home: '0xF207D7CdAEA189068aae28c441937fdA20DF4016',
  replicas: [
    { 
      domain: 5000, 
      address: '0x09B6a30de401084e1D355e859061D6C3EB1bC178',
    },
  ],
};

export const moonbasealpha: NomadDomain = {
  name: 'moonbasealpha',
  paginate: {
    blocks: 2000, 
    from: 1485171,
  },
  id: 5000,
  bridgeRouter: '0x8F60dc7117dE62398a801100bfcf613569Dd66d7',
  tokenRegistry: '0x374e21d37584128881cF385C3D629dd25f5d28b2',
  home: '0x53B94f2D4a3159b66fcCC4f406Ea388426A3f3cB',
  replicas: [
    {
      domain: 3000,
      address: '0x8f8424DC94b4c302984Ab5a03fc4c2d1Ec95DC92',
    },
  ],
};

export const stagingDomains = [kovan, moonbasealpha];
