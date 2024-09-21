import { Transaction } from 'kysely';
import { createStreamOutFromStreamEvent } from './streamOutStore';
import { Database } from './types';
import {
    NewTotallyOrderedStreamEvent,
    TotallyOrderedStreamEvent,
} from './transmissionControl/types';
import { createFencingToken, findFencingTokens } from './fencingTokenStore';
import { getUpstreamControlForTransaction } from './getUpstreamControl';
import {
    getStreamOutIncrementorForUpdate,
    insertIntoIgnoreStreamOutIncrementor,
    updateStreamOutIncrementor,
} from './streamOutIncrementorStore';

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
    const incrementorForUpdateLock = await getStreamOutIncrementorForUpdate(
        trx,
        0
    ); // Prevents duplicate entry keys and insertions in other tables
    const incrementorControlIgnore = await insertIntoIgnoreStreamOutIncrementor(
        trx,
        {
            id: 0,
            streamId: 0,
        }
    );
    const incrementorControl = await getStreamOutIncrementorForUpdate(trx, 0);
    if (incrementorControl === undefined) {
        throw new Error('Failed to get incrementor control lock');
    }
    const incrementorControlToUpdate = {
        id: 0,
        streamId: incrementorControl.streamId + 1,
    };
    const streamOut = await createStreamOutFromStreamEvent(trx, {
        streamId: incrementorControlToUpdate.streamId,
        totalOrderId: streamEvent.totalOrderId,
        data: streamEvent.data,
    });
    if (streamOut === undefined) {
        throw new Error('Failed to create stream out');
    }
    await updateStreamOutIncrementor(trx, 0, incrementorControlToUpdate);
    results.push(streamOut);
    return results;
}
