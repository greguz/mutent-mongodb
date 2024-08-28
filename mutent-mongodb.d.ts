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
  InsertOneOptions,
  MongoClient,
  ReplaceOptions,
  UpdateOptions,
} from "mongodb";
import type { Adapter, Context, Entity, Generics } from "mutent";

/**
 * Standard MongoDB filter query.
 *
 * @see https://www.mongodb.com/docs/compass/current/query/filter/
 */
export type MongoQuery<T extends Document> = Filter<T>;

/**
 * All possible MongoDB options for any write operation:
 * - `findOne`
 * - `find`
 * - `insertOne`
 * - `updateOne`
 * - `replaceOne`
 * - `deleteOne`
 * - `bulkWrite`
 */
export interface MongoOptions
  extends BulkWriteOptions,
    DeleteOptions,
    FindOptions,
    InsertOneOptions,
    ReplaceOptions,
    UpdateOptions {}

/**
 * Mutent's `Generics` interface extension. See Mutent docs.
 */
export interface MongoGenerics<T extends Document> extends Generics {
  adapter: Collection<T>;
  entity: T;
  options: MongoOptions;
  query: MongoQuery<T>;
}

/**
 * Entity and Mutation's context hook.
 */
export type Hook<T extends Document> = (
  entity: Entity<T>,
  ctx: Context<MongoGenerics<T>>
) => any;

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
   * Custom filter query generation. This function must return an object.
   *
   * Filter by `_id` by default.
   */
  filterQuery?: Hook<T>;
  /**
   * Enable or disable documents diff (partial updates). Can be a boolean or a entity/context hook.
   *
   * @default false
   */
  diffDocuments?: boolean | Hook<T>;
  /**
   * Allow lost updates writes. By default an error is thrown when a lost update is detected.
   *
   * @default false
   */
  allowLostUpdates?: boolean;
  /**
   * Allow lost deletes writes. By default an error is thrown when a lost update is detected.
   *
   * @default false
   */
  allowLostDeletes?: boolean;
}

declare class MongoAdapter<T extends Document>
  implements Adapter<MongoGenerics<T>>
{
  readonly filterQuery: Hook<T>;
  readonly diffDocuments: Hook<T>;
  readonly allowLostUpdates: boolean;
  readonly allowLostDeletes: boolean;
  readonly raw: Collection<T>;
  constructor(options: MongoAdapterOptions<T>);
  findEntity(query: MongoQuery<T>, ctx: Context<MongoGenerics<T>>): Promise<T>;
  filterEntities(
    query: MongoQuery<T>,
    ctx: Context<MongoGenerics<T>>
  ): AsyncIterable<T>;
  createEntity(
    entity: Entity<T>,
    ctx: Context<MongoGenerics<T>>
  ): Promise<void>;
  updateEntity(
    entity: Entity<T>,
    ctx: Context<MongoGenerics<T>>
  ): Promise<void>;
  deleteEntity(
    entity: Entity<T>,
    ctx: Context<MongoGenerics<T>>
  ): Promise<void>;
  bulkEntities(
    entities: Array<Entity<T>>,
    ctx: Context<MongoGenerics<T>>
  ): Promise<void>;
}

export default MongoAdapter;
