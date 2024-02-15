/// <reference types="mongodb" />
/// <reference types="mutent" />

import type {
  BulkWriteOptions,
  Collection,
  Db,
  DeleteOptions,
  Filter,
  FindOptions,
  MongoClient,
  ReplaceOptions,
  UpdateOptions,
} from "mongodb";
import type {
  Adapter,
  BulkAction,
  Context,
  Entity,
  Generics,
  Store,
} from "mutent";

export interface MongoGenerics<T extends object> extends Generics {
  adapter: MongoAdapter<T>;
  entity: T;
  query: MongoQuery<T>;
  options: MongoOptions;
}

/**
 * Mutent's Store preconfigured with MongoDB types.
 */
export type MongoStore<T extends object> = Store<MongoGenerics<T>>;

/**
 * Accepted query type by Mutent's Store instance.
 */
export type MongoQuery<T extends object> = Filter<T>;

/**
 * Store's unwrap options.
 */
export interface MongoOptions
  extends BulkWriteOptions,
    DeleteOptions,
    FindOptions,
    ReplaceOptions,
    UpdateOptions {}

export interface MongoAdapterOptions<T extends object> {
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
  filterQuery?: (
    entity: Entity<T>,
    ctx: Context<MongoGenerics<T>>
  ) => Filter<T>;
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

export declare class MongoAdapter<T extends object>
  implements Adapter<Generics>
{
  readonly collection: Collection<T>;
  constructor(options: MongoAdapterOptions<T>);
  find(query: MongoQuery<T>, options?: MongoOptions): Promise<T>;
  filter(query: MongoQuery<T>, options?: MongoOptions): AsyncIterable<T>;
  create(data: T, options?: MongoOptions): Promise<T>;
  update(oldData: T, newData: T, options?: MongoOptions): Promise<void>;
  delete(data: T, options?: MongoOptions): Promise<void>;
  bulk(actions: Array<BulkAction<T>>, options?: MongoOptions): Promise<T[]>;
}

/**
 * Returns `true` when the document has missed an update request
 * (database orphan).
 */
export declare function isOrphaned(doc: any): boolean;
