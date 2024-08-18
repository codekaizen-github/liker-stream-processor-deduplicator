import { Response } from 'express';
import { createStreamOut } from './streamOutStore';
import { notifySubscribers } from './subscriptions';
import { Database, NewStreamOut } from './types';
import { Kysely, Transaction } from 'kysely';

export async function processStreamEvent(
    newStreamEvent: NewStreamOut,
    res: Response,
    db: Kysely<Database>,
    trx: Transaction<Database>
) {
    const streamOut = await createStreamOut(trx, newStreamEvent);
    if (streamOut === undefined) {
        return res.status(500).send();
    }
    // non-blocking
    notifySubscribers(db, streamOut);
}
