/// <reference types="mongodb" />
/// <reference types="mutent" />

import { Adapter, BulkAction } from "mutent";
import { BulkWriteOptions, Collection, DeleteOptions, Filter, FindOptions, ReplaceOptions, UpdateOptions } from "mongodb";

export interface MongoOptions<T = any> extends BulkWriteOptions, DeleteOptions, FindOptions<T>, ReplaceOptions, UpdateOptions {}

export interface AdapterOptions {
  /**
   * Do not throw an error when a write action (insertOne, updateOne, deleteOne) does not match any document.
   * @default false
   */
  relax?: boolean;
  /**
   * Always replace the whole document (replaceOne) instead of just update changed fields (updateOne).
   * @default false
   */
  replace?: boolean;
}

export declare class MongoAdapter<T> implements Adapter<T, Filter<T>, MongoOptions<T>> {
  static create<S> (collection: Collection<S>, options?: AdapterOptions): MongoAdapter<S>;
  constructor (collection: Collection<T>, options?: AdapterOptions);
  find (query: Filter<T>, options: MongoOptions<T>): Promise<T>;
  filter (query: Filter<T>, options: MongoOptions<T>): AsyncIterable<T>;
  create (data: T, options: MongoOptions<T>): Promise<T>;
  update (oldData: T, newData: T, options: MongoOptions<T>): Promise<void>;
  delete (data: T, options: MongoOptions<T>): Promise<void>;
  bulk (actions: Array<BulkAction<T>>, options: MongoOptions<T>): Promise<T[]>;
}
