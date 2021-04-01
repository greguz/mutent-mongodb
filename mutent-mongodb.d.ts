/// <reference types="mutent" />
/// <reference types="mongodb" />

import { Adapter, BulkAction } from "mutent";
import {
  Collection,
  ClientSession,
  CollationDocument,
  FilterQuery,
  ReadPreferenceOrMode,
} from "mongodb";

export interface MongoOptions {
  /**
   * Determines which array elements to modify for update operation in MongoDB 3.6 or higher.
   */
  arrayFilters?: any[];
  /**
   * Specify if the cursor is a a tailable-await cursor. Requires tailable to be true.
   */
  awaitData?: boolean;
  /**
   * Set the batchSize for the getMoreCommand when iterating over the query results.
   */
  batchSize?: number;
  /**
   * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
   */
  bypassDocumentValidation?: boolean;
  /**
   * Specify collation (MongoDB 3.4 or higher) settings for update operation.
   */
  collation?: CollationDocument;
  /**
   * You can put a $comment field on a query to make looking in the profiler logs simpler.
   */
  comment?: string;
  /**
   * The verbosity mode for the explain output.
   */
  explain?: boolean;
  /**
   * Force server to assign _id values instead of driver.
   */
  forceServerObjectId?: boolean;
  /**
   * Tell the query to use specific indexes in the query. Object of indexes to use, {'_id':1}
   */
  hint?: object;
  /**
   * Sets the limit of documents returned in the query.
   */
  limit?: number;
  /**
   * Set index bounds.
   */
  max?: number;
  /**
   * Number of milliseconds to wait before aborting the query.
   */
  maxTimeMS?: number;
  /**
   * Set index bounds.
   */
  min?: number;
  /**
   * Execute write operation in ordered or unordered fashion.
   */
  ordered?: boolean;
  /**
   * Specify if the cursor should return partial results when querying against a sharded system.
   */
  partial?: boolean;
  /**
   * The fields to return in the query. Object of fields to either include or exclude (one of, not both), {'a':1, 'b': 1} or {'a': 0, 'b': 0}
   */
  projection?: object;
  /**
   * Promotes Binary BSON values to native Node Buffers.
   */
  promoteBuffers?: boolean;
  /**
   * Promotes Long values to number if they fit inside the 53 bits resolution.
   */
  promoteLongs?: boolean;
  /**
   * Promotes BSON values to native types where possible, set to false to only receive wrapper types.
   */
  promoteValues?: boolean;
  /**
   * The preferred read preference.
   */
  readPreference?: ReadPreferenceOrMode;
  /**
   * Only return the index key.
   */
  returnKey?: boolean;
  /**
   * Serialize functions on any object.
   */
  serializeFunctions?: boolean;
  /**
   * Optional (transaction) session to use for this operation.
   */
  session?: ClientSession;
  /**
   * Show disk location of results.
   */
  showDiskLoc?: boolean;
  /**
   * Set to skip N documents ahead in your query (useful for pagination).
   */
  skip?: number;
  /**
   * Set to sort the documents coming back from the query. Array of indexes, [['a', 1]] etc.
   */
  sort?: any;
  /**
   * Specify if the cursor is tailable.
   */
  tailable?: boolean;
  /**
   * Specify if the cursor can timeout.
   */
  timeout?: boolean;
  /**
   * Perform an upsert operation.
   */
  upsert?: boolean;
  /**
   * Specify write concern settings.
   */
  writeConcern?: {
    /**
     * requests acknowledgement from MongoDB that the write operation has been written to the journal
     * @default false
     */
    j?: boolean;
    /**
     * requests acknowledgement that the write operation has propagated to a specified number of mongod hosts
     * @default 1
     */
    w?: number | "majority" | string;
    /**
     * a time limit, in milliseconds, for the write concern
     */
    wtimeout?: number;
  };
}

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

export declare class MongoAdapter<T> implements Adapter<T, FilterQuery<T>, MongoOptions> {
  static create<S>(collection: Collection<S>, options?: AdapterOptions): MongoAdapter<S>;
  constructor(collection: Collection<T>, options?: AdapterOptions);
  find(query: FilterQuery<T>, options: MongoOptions): Promise<T>;
  filter(query: FilterQuery<T>, options: MongoOptions): AsyncIterable<T>;
  create(data: T, options: MongoOptions): Promise<T>;
  update(oldData: T, newData: T, options: MongoOptions): Promise<T>;
  delete(data: T, options: MongoOptions): Promise<void>;
  bulk(actions: Array<BulkAction<T>>, options: MongoOptions): Promise<T[]>;
}
