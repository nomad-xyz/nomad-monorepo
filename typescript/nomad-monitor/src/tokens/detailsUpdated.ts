import {dev} from '../registerContext';
import {buildConfig} from '../config';
import {uploadTokens} from './googleSheets';
import {getUpdateDetailsEvent, getTokenDeployedEvents} from "./moveToSDK";
import {AnnotatedTokenDeployed, AnnotatedUpdateDetails,} from '@nomad-xyz/sdk/nomad/events/bridgeEvents';
import {NomadContext} from '@nomad-xyz/sdk/nomad';

export type TokenDetails = {
  address: string;
  id: string;
  domain: number;
  name: string;
  symbol: string;
  decimals: number;
};

function transformUpdatedTokenDetails(
  annotatedTokenDeployed: AnnotatedTokenDeployed,
  annotatedUpdateDetails: AnnotatedUpdateDetails,
): TokenDetails {
    return {
      name: annotatedUpdateDetails.event.args.name,
      symbol: annotatedUpdateDetails.event.args.symbol,
      decimals: annotatedUpdateDetails.event.args.decimals,
      address: annotatedTokenDeployed.event.args.representation,
      id: annotatedTokenDeployed.event.args.id,
      domain: annotatedTokenDeployed.event.args.domain,
    };
}

export async function getUpdatedTokensForDomain(
  context: NomadContext,
  nameOrDomain: string | number,
): Promise<TokenDetails[]> {
  const annotatedTokenDeployed = await getTokenDeployedEvents(
    context,
    nameOrDomain,
  );
  // get tokens with UpdateDetails events from the deployed token events
  const tokenDetails = await Promise.all(
    annotatedTokenDeployed.map(async (annotatedTokenDeployed) => {
          const annotatedUpdateDetails = await getUpdateDetailsEvent(
              context,
              nameOrDomain,
              annotatedTokenDeployed.event.args.representation,
          );
          if (!annotatedUpdateDetails) {
            // no Update Details event found; return null
            return null;
          }
          // transform annotatedTokenDeployed event & annotatedUpdateDetails event to DeployedTokenDetails
          return transformUpdatedTokenDetails(annotatedTokenDeployed, annotatedUpdateDetails);
        }
    ),
  );
  // filter out null values, which represent tokens whose details have not been updated
  return tokenDetails.filter(details => !!details) as any as TokenDetails[];
}

export async function getUpdatedTokens(
  context: NomadContext,
): Promise<Map<number, TokenDetails[]>> {
  const events = new Map();
  for (const domain of context.domainNumbers) {
    events.set(domain, await getUpdatedTokensForDomain(context, domain));
  }
  return events;
}

export async function printUpdatedTokens(
  context: NomadContext,
): Promise<void> {
  const allTokenDetails = await getUpdatedTokens(context);
  for (const domain of allTokenDetails.keys()) {
    const domainName = context.resolveDomainName(domain);
    const tokenDetail = allTokenDetails.get(domain);
    console.log(`DOMAIN: ${domain} ${domainName}`);
    console.table(tokenDetail);
  }
}

export async function persistUpdatedTokens(
  context: NomadContext,
  credentials: string
): Promise<void> {
  const allTokenDetails = await getUpdatedTokens(context);
  for (const domain of allTokenDetails.keys()) {
    const domainName = context.resolveDomainName(domain);
    const tokenDetail = allTokenDetails.get(domain);
    await uploadTokens(domainName!, tokenDetail!, credentials);
  }
}

(async function main() {
  const config = buildConfig("tokens")
  // TODO: separate sheets for deployed tokens vs. updated tokens
  await persistUpdatedTokens(dev, config.googleCredentialsFile)
})();
