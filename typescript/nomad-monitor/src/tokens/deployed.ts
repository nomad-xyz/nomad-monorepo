import {dev} from '../registerContext';
import {buildConfig} from '../config';
import {uploadTokens} from './googleSheets';
import {getTokenDeployedEvents} from "./moveToSDK";
import {TokenDetails} from "./detailsUpdated";
import {NomadContext} from '@nomad-xyz/sdk/nomad';

export async function getDeployedTokensForDomain(
    context: NomadContext,
    nameOrDomain: string | number,
): Promise<TokenDetails[]> {
    const annotatedTokenDeployed = await getTokenDeployedEvents(
        context,
        nameOrDomain,
    );
    // get tokens with UpdateDetails events from the deployed token events
    return Promise.all(
        annotatedTokenDeployed.map(async (annotatedTokenDeployed) => {
                const tokenId = {
                    domain: annotatedTokenDeployed.event.args.domain,
                    id: annotatedTokenDeployed.event.args.id
                };
                const details = await context.getCanonicalTokenDetails(tokenId);
                return {
                    ...tokenId,
                    ...details,
                    address: annotatedTokenDeployed.event.args.representation
                };
            }
        ),
    );
}

export async function getDeployedTokens(
    context: NomadContext,
): Promise<Map<number, TokenDetails[]>> {
    const events = new Map();
    for (const domain of context.domainNumbers) {
        events.set(domain, await getDeployedTokensForDomain(context, domain));
    }
    return events;
}

export async function printDeployedTokens(
    context: NomadContext,
): Promise<void> {
    const allTokenDetails = await getDeployedTokens(context);
    for (const domain of allTokenDetails.keys()) {
        const domainName = context.resolveDomainName(domain);
        const tokenDetail = allTokenDetails.get(domain);
        console.log(`DOMAIN: ${domain} ${domainName}`);
        console.table(tokenDetail);
    }
}

export async function persistDeployedTokens(
    context: NomadContext,
    credentials: string
): Promise<void> {
    const allTokenDetails = await getDeployedTokens(context);
    for (const domain of allTokenDetails.keys()) {
        const domainName = context.resolveDomainName(domain);
        const tokenDetail = allTokenDetails.get(domain);
        await uploadTokens(domainName!, tokenDetail!, credentials);
    }
}

(async function main() {
    const config = buildConfig("tokens")
    // TODO: separate sheets for deployed tokens vs. updated tokens
    await persistDeployedTokens(dev, config.googleCredentialsFile)
})();
