import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  "name": "kovan",
  "id": 3000,
  "paginate": {
    "from": 29176685,
    "blocks": 2000,
  },
  "home": "0x6fAdB7EcBf784c5862ee34839F7379911a5b3038",
  "replicas": [
    {
      "domain": 5000,
      "address": "0x0f358a5977FCF8cC3c065489530ba40d38ae1c69",
    },
  ],
  "governanceRouter": "0xfD2aE1Db4226fc5b7A093c02e6587D44191B4fb9",
  "bridgeRouter": "0x2fDbf493b20C920E1e943eD5B7d9A8C16a48Ccc0",
  "tokenRegistry": "0xdE51871a7b90e5552fbE7D334735908Bea68224A",
  "ethHelper": "0xEb02Ea8e066106AF4D9C995e703b8bA06CD2aA32",
};

export const moonbasealpha: NomadDomain = {
  "name": "moonbasealpha",
  "id": 5000,
  "paginate": {
    "from": 1501043,
    "blocks": 2000,
  },
  "home": "0xf5364400B6180d03e295F99A2D8AFc2dE5968133",
  "replicas": [
    {
      "domain": 3000,
      "address": "0x4260dd1f0F70c31aB917FC89Fc2EAA46CAef3A46",
    },
  ],
  "governanceRouter": "0xDf4c0d67489F945C1e52440Ef8F203F4CE6e4176",
  "bridgeRouter": "0xdFeAd12447618EB409a47fDF9C687909ABBAbfB3",
  "tokenRegistry": "0xad465F3F9195ff9f1E3828dE1D7f816ec9F1CA3a",
};

export const stagingDomains = [kovan, moonbasealpha];
