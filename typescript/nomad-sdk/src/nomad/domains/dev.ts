import { NomadDomain } from './domain';

export const kovan: NomadDomain = {
  name: 'kovan',
  id: 3000,
  paginate: {
    from: 29193581,
    blocks: 2000,
  },
  home: '0x706b4e61018793bA84BF23A314524c511170Ce07',
  replicas: [
    {
      domain: 5000,
      address: '0x3E8B3E047b6a7B6342E74b15813137b2891817Cd',
    },
  ],
  governanceRouter: '0x45F8c10cC8077081e062A7F643ADD6EABc7464C2',
  bridgeRouter: '0x7454A5cce9Ae2C52fB0B1B6D732A6a7d9CABA12C',
  tokenRegistry: '0x22f6977Bb15f55D2d8318F3EF4D27e64e5A2bb7F',
  ethHelper: '0x974CD1c543bd144C23bA7963b057eb0E54Fd6c9b',
};

export const moonbasealpha: NomadDomain = {
  name: 'moonbasealpha',
  id: 5000,
  paginate: {
    from: 1507573,
    blocks: 2000,
  },
  home: '0x926Df2b652bC8273BB2F06E8de135875bbE1D271',
  replicas: [
    {
      domain: 3000,
      address: '0x1d77eDee9bb5EA223ab83B7a1B67F931879D6e5B',
    },
  ],
  governanceRouter: '0x857d6dE0a9e3F985768FE164844b3e621893B904',
  bridgeRouter: '0x376017BF1De11dd15c236bB0e36D5e265966c9b8',
  tokenRegistry: '0xdC6aC677ea9057D0114Ab5609af9E70f71a519BC',
  ethHelper: '0x83df3076BbacA1C435ecAbEA2de33dc5d5A404d8',
};

export const devDomains = [kovan, moonbasealpha];
