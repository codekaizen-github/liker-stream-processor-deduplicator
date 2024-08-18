import { createFencingToken, findFencingTokens } from './fencingTokenStore';
import { createStreamOut } from './streamOutStore';
import { notifySubscribers } from './subscriptions';
import { Database, NewStreamOut } from './types';
import { Kysely, Transaction } from 'kysely';

export async function processStreamEvent(
    newStreamEvent: NewStreamOut,
    db: Kysely<Database>,
    trx: Transaction<Database>
) {
    // Check to see if fencingToken was provided
    const newStreamOutData = JSON.parse(newStreamEvent.data);
    if (newStreamOutData.fencingToken !== undefined) {
        const incomingFencingToken = parseInt(newStreamOutData.fencingToken);
        // If a valid fencingToken is provided, check if it exists in the database before creating a new streamOut
        if (!isNaN(incomingFencingToken)) {
            const fencingToken = await findFencingTokens(trx, {
                token: incomingFencingToken,
            });
            if (fencingToken.length > 0) {
                // Fencing token was used already - do nothing
                return;
            }
            // If the fencing token is not found, create a new fencing token
            const token = await createFencingToken(trx, {
                token: incomingFencingToken,
            });
            if (token === undefined) {
                throw new Error('Failed to create fencing token');
            }
        }
    }
    const streamOut = await createStreamOut(trx, newStreamEvent);
    if (streamOut === undefined) {
        throw new Error('Failed to create stream out');
    }
    notifySubscribers(db, streamOut);
}
