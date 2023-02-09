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

export interface MongoGenerics<T extends object> extends Generics {
  adapter: MongoAdapter<T>;
  entity: T;
  query: MongoQuery<T>;
  options: MongoOptions;
}

/**
 * Mutent's Store preconfigured with MongoDB types.
 */
export declare type MongoStore<T extends object> = Store<MongoGenerics<T>>;

/**
 * Accepted query type by Mutent's Store instance.
 */
export declare type MongoQuery<T extends object> = Filter<T>;

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

export class MongoAdapter<T extends object> implements Adapter<Generics> {
  collection: Collection<T>;
  constructor(options: MongoAdapterOptions<T>);
  find(query: MongoQuery<T>, options?: MongoOptions): Promise<T>;
  filter(query: MongoQuery<T>, options?: MongoOptions): AsyncIterable<T>;
  create(data: T, options?: MongoOptions): Promise<T>;
  update(oldData: T, newData: T, options?: MongoOptions): Promise<void>;
  delete(data: T, options?: MongoOptions): Promise<void>;
  bulk(actions: Array<BulkAction<T>>, options?: MongoOptions): Promise<T[]>;
}
