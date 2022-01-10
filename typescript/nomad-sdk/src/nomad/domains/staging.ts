import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  "name": "kovan",
  "id": 3000,
  "paginate": {
    "from": 29193952,
    "blocks": 2000,
  },
  "home": "0xA2d62FbcD779231894586CFC569E8a085662d5Bb",
  "replicas": [
    {
      "domain": 5000,
      "address": "0x2fFEa0eBe27cF63cbE4b8bb621b817F7fe40f27B",
    },
  ],
  "governanceRouter": "0x2960C101Cb72eCC35a515e247608b17B46f38bA6",
  "bridgeRouter": "0x983fC3130002454d0e892ae7a53147B09Fb58fd8",
  "tokenRegistry": "0x60fB0Ea196F2c0Ba54FBFAB4184cCFb2ce4048BD",
  "ethHelper": "0xe3717ed5f3F087f3AAbaD4C25ee924EDeB80c9f6",
};

export const moonbasealpha: NomadDomain = {
  "name": "moonbasealpha",
  "id": 5000,
  "paginate": {
    "from": 1507707,
    "blocks": 2000,
  },
  "home": "0xdc515CB0Ba06c5E058998551C21864ed2e0629Fe",
  "replicas": [
    {
      "domain": 3000,
      "address": "0x3333744724611Ef93521446670b4cC4009338E58",
    },
  ],
  "governanceRouter": "0xD3cBBd9fe9Fa81850E2e083C4fe05Cc18B11a4B6",
  "bridgeRouter": "0xEDC1bcB5a6B47483eD9640bbE4c91C3d2A9A6286",
  "tokenRegistry": "0x5AFfc0aa97Af0e5de401b156De38CeE7b34cfCA0",
};

export const stagingDomains = [kovan, moonbasealpha];
