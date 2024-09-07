import { Transaction } from 'kysely';
import { createStreamOutFromStreamEvent } from './streamOutStore';
import { Database } from './types';
import {
    NewTotallyOrderedStreamEvent,
    TotallyOrderedStreamEvent,
} from './transmissionControl/types';
import { createFencingToken, findFencingTokens } from './fencingTokenStore';

export async function createTotallyOrderedStreamEvents(
    trx: Transaction<Database>,
    streamEvent: NewTotallyOrderedStreamEvent
): Promise<TotallyOrderedStreamEvent[]> {
    const results: TotallyOrderedStreamEvent[] = [];
    // Extract any fencing token
    if (streamEvent.data?.payload?.fencingToken !== undefined) {
        const usedTokens = await findFencingTokens(trx, {
            token: streamEvent.data.payload.fencingToken,
        });
        if (usedTokens.length > 0) {
            return results;
        }
        // Insert fencing token
        await createFencingToken(trx, {
            token: streamEvent.data.payload.fencingToken,
        });
    }
    const streamOut = await createStreamOutFromStreamEvent(trx, {
        data: streamEvent.data,
        totalOrderId: streamEvent.totalOrderId,
    });
    if (streamOut === undefined) {
        throw new Error('Failed to create stream out');
    }
    results.push(streamOut);
    return results;
}
