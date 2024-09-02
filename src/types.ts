import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface NewStreamEvent {
    data: any;
}

export interface OrderedStreamEvent {
    id: number;
    data: any;
}

export interface Database {
    streamOut: StreamOutTable;
    httpSubscriber: HttpSubscriberTable;
    upstreamControl: UpstreamControlTable;
    fencingToken: FencingTokenTable;
}

// This interface describes the `person` table to Kysely. Table
// interfaces should only be used in the `Database` type above
// and never as a result type of a query!. See the `Person`,
// `NewPerson` and `PersonUpdate` types below.
export interface StreamOutTable {
    id: Generated<number>;
    data: any;
}

export interface StreamOutTableSerialized extends StreamOutTable {
    data: string;
}

export type StreamOut = Selectable<StreamOutTable>;
export type NewStreamOut = Insertable<StreamOutTableSerialized>;
export type StreamOutUpdate = Updateable<StreamOutTableSerialized>;

export interface HttpSubscriberTable {
    id: Generated<number>;
    url: string;
}

export type HttpSubscription = Selectable<HttpSubscriberTable>;
export type NewHttpSubscription = Insertable<HttpSubscriberTable>;
export type HttpSubscriptionUpdate = Updateable<HttpSubscriberTable>;

export interface UpstreamControlTable {
    id: number; // Will always be 0
    streamId: number;
    totalOrderId: number;
}

export type UpstreamControl = Selectable<UpstreamControlTable>;
export type NewUpstreamControl = Insertable<UpstreamControlTable>;
export type UpstreamControlUpdate = Updateable<UpstreamControlTable>;

export interface FencingTokenTable {
    id: Generated<number>;
    token: number;
}

export type FencingToken = Selectable<FencingTokenTable>;
export type NewFencingToken = Insertable<FencingTokenTable>;
export type FencingTokenUpdate = Updateable<FencingTokenTable>;
