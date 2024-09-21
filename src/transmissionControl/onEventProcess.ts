import { db } from '../database';
import {
    StreamEventIdDuplicateException,
    StreamEventOutOfSequenceException,
} from './exceptions';
import {
    getUpstreamControlForUpdate,
    insertIntoIgnoreUpstreamControl,
    updateUpstreamControl,
} from '../upstreamControlStore';
import { processStreamEvent } from './processStreamEvent';
import { TotallyOrderedStreamEvent } from './types';

export async function onEventProcess(events: TotallyOrderedStreamEvent[], totalOrderId: number) {
    const results = await db
        .transaction()
        .setIsolationLevel('serializable')
        .execute(async (trx) => {
            const results: TotallyOrderedStreamEvent[] = [];
            const upstreamForUpdateLock = await getUpstreamControlForUpdate(
                trx,
                0
            ); // Prevents duplicate entry keys and insertions in other tables
            const upstreamControlIgnore = await insertIntoIgnoreUpstreamControl(
                trx,
                {
                    id: 0,
                    streamId: 0,
                    totalOrderId: 0,
                }
            );
            const upstreamControl = await getUpstreamControlForUpdate(trx, 0);
            console.log({
                events: events,
                upstreamControl,
            });
            if (upstreamControl === undefined) {
                throw new Error('Failed to get upstream control lock');
            }
            const upstreamControlToUpdate = {
                id: 0,
                streamId: upstreamControl.streamId,
                totalOrderId: totalOrderId,
            };
            for (const event of events) {
                try {
                    if (upstreamControlToUpdate.streamId >= event.id) {
                        throw new StreamEventIdDuplicateException();
                    }
                    if (upstreamControlToUpdate.streamId + 1 === event.id) {
                        console.log('we have a winner!');
                        results.push(...(await processStreamEvent(trx, event)));
                        upstreamControlToUpdate.streamId = event.id;
                        continue;
                    }
                    throw new StreamEventOutOfSequenceException();
                } catch (e) {
                    if (e instanceof StreamEventIdDuplicateException) {
                        console.log('Duplicate event ID', event);
                        continue;
                    }
                    if (e instanceof StreamEventOutOfSequenceException) {
                        console.log('Out of sequence event ID', event);
                        throw e;
                    }
                    throw e;
                }
            }
            console.log({ upstreamControlToUpdate });
            await updateUpstreamControl(trx, 0, upstreamControlToUpdate);
            return results;
        });
    return results;
}
