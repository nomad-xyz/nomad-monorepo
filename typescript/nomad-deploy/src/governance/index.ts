import { NomadContext } from '@nomad-xyz/sdk';
import { CallBatch } from '@nomad-xyz/sdk/nomad';
import { getBatch, writeBatch } from './utils';
import { DeployEnvironment } from '../chain';

// execute a batch on the Governor Chain
export async function executeBatch(
  batch: CallBatch,
  environment: DeployEnvironment,
  reason: string,
): Promise<void> {
  // persist the call batch to a local file
  await writeBatch(batch, environment, reason);
  // send the batch transaction,
  // either directly on-chain or to gnosis safe
  if (environment === 'dev') {
    // in dev, execute the batch directly
    console.log('Sending governance transaction...');
    const txResponse = await batch.execute();
    const receipt = await txResponse.wait();
    console.log('Governance tx mined!! ', receipt.transactionHash);
  } else {
    // TODO: send to gnosis safe directly
  }
}

// execute the remote Call Batches on each non-Governor chain
export async function executeRemoteBatches(
  sdk: NomadContext,
  environment: string,
  reason: string,
) {
  const batch = await getBatch(sdk, environment, reason);
  // ensure that all batch hashes have landed on each remote domain
  await batch.waitAll();
  console.log('All Batch Hashes Ready.');
  // for each domain, execute the batch calls
  for (const domain of batch.domains) {
    const domainName = sdk.resolveDomainName(domain);
    console.log(`Executing Batch on ${domainName}...`);
    const tx = await batch.executeDomain(domain);
    const receipt = await tx.wait();
    console.log(`Executed Batch on ${domainName}:`, receipt.transactionHash);
  }
}

// log the progress of batches on all domains
export async function waitBatches(
  sdk: NomadContext,
  environment: string,
  reason: string,
): Promise<void[]> {
  const batch = await getBatch(sdk, environment, reason);
  return Promise.all(
    batch.domains.map(async (domain: number) => {
      const domainName = sdk.resolveDomainName(domain);
      console.log(`Waiting for batch to be received on ${domainName}...`);
      await batch.waitDomain(domain);
      console.log(`Batch received on ${domainName}!`);
    }),
  );
}
