import { sql } from 'kysely';
import { db } from './database';

async function reset() {
    console.log('Resetting database');
    await sql`TRUNCATE TABLE streamOut`.execute(db);
    console.log('Truncated streamOut');
    await sql`TRUNCATE TABLE streamOutIncrementor`.execute(db);
    console.log('Truncated streamOutIncrementor');
    await sql`TRUNCATE TABLE upstreamControl`.execute(db);
    console.log('Truncated upstreamControl');
    await sql`TRUNCATE TABLE fencingToken`.execute(db);
    console.log('Truncated fencingToken');
    await db.destroy();
}

reset();
