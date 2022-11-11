/// <reference types="mongodb" />
/// <reference types="mutent" />

import {
  BulkWriteOptions,
  Collection,
  DeleteOptions,
  Filter,
  FindOptions,
  ReplaceOptions,
  UpdateOptions,
} from "mongodb";
import { Adapter, BulkAction, Generics, Store } from "mutent";

export interface MongoGenerics<T> extends Generics {
  adapter: MongoAdapter<T>;
  entity: T;
  query: MongoQuery<T>;
  options: MongoOptions<T>;
}

/**
 * Mutent's Store preconfigured with MongoDB types.
 */
export declare type MongoStore<T> = Store<MongoGenerics<T>>;

/**
 * Accepted query type by Mutent's Store instance.
 */
export declare type MongoQuery<T> = Filter<T>;

/**
 * Store's unwrap options.
 */
export interface MongoOptions<T>
  extends BulkWriteOptions,
    DeleteOptions,
    FindOptions<T>,
    ReplaceOptions,
    UpdateOptions {}

export interface MongoAdapterOptions<T> {
  /**
   * MongoDB's collection instance.
   */
  collection?: Collection<T>;
  /**
   * Replace the whole document instead of just update the changed properties.
   *
   * @default false
   */
  replace?: boolean;
  /**
   * Throw an error when a delete request does not match any document.
   *
   * @default false
   */
  strictDelete?: boolean;
  /**
   * Throw an error when an update request does not match any document.
   *
   * @default false
   */
  strictUpdate?: boolean;
}

export class MongoAdapter<T> implements Adapter<Generics> {
  collection: Collection<T>;
  constructor(options: MongoAdapterOptions<T>);
  find(query: MongoQuery<T>, options?: MongoOptions<T>): Promise<T>;
  filter(query: MongoQuery<T>, options?: MongoOptions<T>): AsyncIterable<T>;
  create(data: T, options?: MongoOptions<T>): Promise<T>;
  update(oldData: T, newData: T, options?: MongoOptions<T>): Promise<void>;
  delete(data: T, options?: MongoOptions<T>): Promise<void>;
  bulk(actions: Array<BulkAction<T>>, options?: MongoOptions<T>): Promise<T[]>;
}
