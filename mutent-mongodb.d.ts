/// <reference types="mongodb" />
/// <reference types="mutent" />

import type {
  BulkWriteOptions,
  Collection,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindOptions,
  MongoClient,
  ReplaceOptions,
  UpdateOptions,
} from "mongodb";
import type { Adapter, Context, Entity, Generics, Store } from "mutent";

/**
 * All generics without the Adapter (used by the Adapter itself).
 */
export interface MongoAdapterGenerics<T extends Document> extends Generics {
  entity: T;
  query: MongoQuery<T>;
  options: MongoOptions;
}

/**
 * All MongoDB generics collection (used by Mutent).
 */
export interface MongoGenerics<T extends Document>
  extends MongoAdapterGenerics<T> {
  adapter: MongoAdapter<T>;
}

/**
 * Mutent's Store preconfigured with MongoDB types.
 */
export type MongoStore<T extends Document> = Store<MongoGenerics<T>>;

/**
 * Accepted query type by Mutent's Store instance.
 */
export type MongoQuery<T extends Document> = Filter<T>;

/**
 * Store's unwrap options.
 */
export interface MongoOptions
  extends BulkWriteOptions,
    DeleteOptions,
    FindOptions,
    ReplaceOptions,
    UpdateOptions {}

export interface MongoAdapterOptions<T extends Document> {
  /**
   * MongoDB's `Collection` instance. This option has precedence over
   * `client`, `dbName`, `db`, and `collectionName`.
   */
  collection?: Collection<T>;
  /**
   * Name of the collection. This option is required when `collection` is
   * **not** defined.
   */
  collectionName?: string;
  /**
   * MongoDB's `Db` instance. This option has precedence over `dbName`
   * and `client`.
   */
  db?: Db;
  /**
   * Name of the database. Defaults to the database specified in the conection
   * URL, or `"admin"`.
   */
  dbName?: string;
  /**
   * An connected `MongoClient` instance.
   * See `mongodb` module for more info.
   */
  client?: MongoClient;
  /**
   * Custom filter query generation.
   * Filter by `_id` by default.
   */
  filterQuery?: (entity: Entity<T>, ctx: Context<MongoGenerics<T>>) => any;
  /**
   * Write mode to use during updates.
   * - `"AUTO"`: Choose the correct mode automatically (not a silver bullet).
   * - `"DIFF"`: Always try to diff the objects.
   * - `"REPLACE"`: Always replace the whole document.
   *
   * @default "AUTO"
   */
  updateMode?: "AUTO" | "DIFF" | "REPLACE";
  /**
   * Expect a matching document during an update request.
   *
   * If `true`, all update requests must result in MongoDB saying that a
   * document has matched the filter query.
   *
   * @default false
   */
  matchUpdates?: boolean;
  /**
   * Expect a matching document during a delete request.
   *
   * If `true`, all delete requests must result in MongoDB saying that a
   * document has matched the filter query.
   *
   * @default false
   */
  matchDeletes?: boolean;
}

export declare class MongoAdapter<T extends Document>
  implements Adapter<MongoAdapterGenerics<T>>
{
  readonly collection: Collection<T>;
  constructor(options: MongoAdapterOptions<T>);
  find(query: MongoQuery<T>, options: MongoOptions): Promise<T>;
  filter(query: MongoQuery<T>, options: MongoOptions): AsyncIterable<T>;
  createEntity(
    entity: Entity<T>,
    ctx: Context<MongoAdapterGenerics<T>>
  ): Promise<void>;
  updateEntity(
    entity: Entity<T>,
    ctx: Context<MongoAdapterGenerics<T>>
  ): Promise<void>;
  deleteEntity(
    entity: Entity<T>,
    ctx: Context<MongoAdapterGenerics<T>>
  ): Promise<void>;
  bulkEntities(
    entities: Array<Entity<T>>,
    ctx: Context<MongoAdapterGenerics<T>>
  ): Promise<void>;
}

/**
 * Returns `true` when the document has missed an update request
 * (database orphan).
 */
export declare function isOrphaned(doc: any): boolean;
