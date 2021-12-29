import { expect } from 'chai';
import { NomadContext } from '@nomad-xyz/sdk/dist';

describe('nomad multi-provider', () => {
  it('compiles', () => {
    expect(NomadContext).to.not.be.undefined;
  });
});
