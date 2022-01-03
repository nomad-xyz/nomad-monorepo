import { NomadDomain } from './domain';

export const alfajores: NomadDomain = {
  name: 'alfajores',
  id: 1000,
  bridgeRouter: '0x76Cb005cC06b94957975964cb590F45aBDECEdF6',
  home: '0x495d3CEC866810898Ed0eC809da8bdEc08bcC866',
  replicas: [
    { domain: 2000, address: '0x0D1abAC01614698bCB5D96dF5818BE8793FD4957' },
    {
      domain: 3000,
      address: '0xFA8D78069dC87BC1355bf588b86C1E1F634a9906',
    },
  ],
};

export const kovan: NomadDomain = {
  name: 'kovan',
  id: 3000,
  bridgeRouter: '0x54f73e6fAB8Bb28A220Bd054A84ffB76dDb1c143',
  ethHelper: '0xEFbe71EEE2Ae694539DC0f36BfC35d417C120273',
  home: '0xD524390aF2931084269E90e6fcF2423ac4905780',
  replicas: [
    { domain: 2000, address: '0x21e956543645dc57ff769751427e80AE10a8F629' },
    {
      domain: 1000,
      address: '0x1a22D30eD82C1bbAe9C68FC66Ac49f8eBA22651F',
    },
  ],
};

export const rinkeby: NomadDomain = {
  name: 'rinkeby',
  id: 2000,
  bridgeRouter: '0xc9afF5f897C7F8dd5cd05499348817f71C84E1fE',
  ethHelper: '0xC652fd8dF178BEC5E62979C00bBceD0eDf0b10F8',
  home: '0x9D211A0E4Ac2A913D1F253FD4a6bC9555d78505b',
  replicas: [
    { domain: 1000, address: '0xB1F356AA3e63E56D4092D9b9354BF0C686De7cb8' },
    {
      domain: 3000,
      address: '0xa61aE9E7a2B63131efc69B032aac3A5f8D300eEF',
    },
  ],
};

export const stagingDomains = [alfajores, kovan, rinkeby];
