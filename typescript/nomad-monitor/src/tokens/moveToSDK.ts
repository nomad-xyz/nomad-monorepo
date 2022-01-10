import {NomadContext} from "@nomad-xyz/sdk";
import {
    AnnotatedTokenDeployed,
    AnnotatedUpdateDetails,
    TokenDeployedArgs,
    TokenDeployedTypes,
    UpdateDetailsArgs,
    UpdateDetailsTypes
} from "@nomad-xyz/sdk/nomad/events/bridgeEvents";
import {queryAnnotatedEvents} from "@nomad-xyz/sdk/nomad";
import {TSContract} from "@nomad-xyz/sdk/nomad/events/fetch";

// TODO: move to SDK
async function getUpdateDetailsEventsForToken(context: NomadContext, nameOrDomain: string | number, representationAddress: string) {
    const representation = await context.connectRepresentation(
        nameOrDomain,
        representationAddress,
    );
    const fromBlock = context.mustGetDomain(nameOrDomain).paginate?.from;
    const annotatedUpdateDetails = await queryAnnotatedEvents<UpdateDetailsTypes,
        UpdateDetailsArgs>(
        context,
        nameOrDomain,
        representation as TSContract<UpdateDetailsTypes, UpdateDetailsArgs>,
        representation.filters.UpdateDetails(),
        fromBlock,
    );
    return annotatedUpdateDetails;
}

// TODO: move to SDK
export async function getUpdateDetailsEvent(
    context: NomadContext,
    nameOrDomain: string | number,
    representationAddress: string,
): Promise<AnnotatedUpdateDetails | null> {
    const annotatedUpdateDetails = await getUpdateDetailsEventsForToken(context, nameOrDomain, representationAddress);
    // if there are no update details events, return null
    if (annotatedUpdateDetails.length == 0) {
        return null;
    }
    // return the first update details event
    return annotatedUpdateDetails[0];
}

// TODO: move to SDK
export async function getTokenDeployedEvents(
    context: NomadContext,
    nameOrDomain: string | number,
): Promise<AnnotatedTokenDeployed[]> {
    const tokenRegistry = context.mustGetBridge(nameOrDomain).tokenRegistry;
    const fromBlock = context.mustGetDomain(nameOrDomain).paginate?.from;
    return queryAnnotatedEvents<TokenDeployedTypes,
        TokenDeployedArgs>(
        context,
        nameOrDomain,
        tokenRegistry as TSContract<TokenDeployedTypes, TokenDeployedArgs>,
        tokenRegistry.filters.TokenDeployed(),
        fromBlock,
    );
}
