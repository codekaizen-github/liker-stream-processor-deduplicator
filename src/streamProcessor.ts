import { createFencingToken, findFencingTokens } from './fencingTokenStore';
import { createStreamOutFromStreamEvent } from './streamOutStore';
import { notifySubscribers } from './subscriptions';
import { Database, NewStreamEvent } from './types';
import { Transaction } from 'kysely';

export async function processStreamEvent(
    trx: Transaction<Database>,
    newStreamEvent: NewStreamEvent
) {
    console.log({ newStreamEvent });
    // Check to see if fencingToken was provided
    // const newStreamOutData = JSON.parse(newStreamEvent.data);
    const newStreamOutData = newStreamEvent.data;
    const incomingFencingToken = newStreamOutData?.payload?.fencingToken;
    if (incomingFencingToken !== undefined) {
        const incomingFencingTokenNumeric = parseInt(incomingFencingToken);
        // If a valid fencingToken is provided, check if it exists in the database before creating a new streamOut
        if (!isNaN(incomingFencingTokenNumeric)) {
            const fencingToken = await findFencingTokens(trx, {
                token: incomingFencingTokenNumeric,
            });
            if (fencingToken.length > 0) {
                // Fencing token was used already - do nothing
                return;
            }
            // If the fencing token is not found, create a new fencing token
            const token = await createFencingToken(trx, {
                token: incomingFencingTokenNumeric,
            });
            if (token === undefined) {
                throw new Error('Failed to create fencing token');
            }
        }
    }
    const streamOut = await createStreamOutFromStreamEvent(trx, newStreamEvent);
    if (streamOut === undefined) {
        throw new Error('Failed to create stream out');
    }
    notifySubscribers(trx, streamOut);
}
