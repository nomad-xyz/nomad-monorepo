import { expect } from 'chai';
import { NomadContext } from '@nomad-xyz/sdk';

describe('nomad multi-provider', () => {
  it('compiles', () => {
    expect(NomadContext).to.not.be.undefined;
  });
});
