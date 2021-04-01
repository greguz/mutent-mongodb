export function asCreateOptions ({
  bypassDocumentValidation,
  forceServerObjectId,
  serializeFunctions,
  session,
  writeConcern
}) {
  return {
    bypassDocumentValidation,
    forceServerObjectId,
    serializeFunctions,
    session,
    writeConcern
  }
}

export function asReadOptions ({
  awaitData,
  batchSize,
  collation,
  comment,
  explain,
  hint,
  limit,
  max,
  maxTimeMS,
  min,
  partial,
  projection,
  promoteBuffers,
  promoteLongs,
  promoteValues,
  readPreference,
  returnKey,
  session,
  showDiskLoc,
  skip,
  sort,
  tailable,
  timeout
}) {
  return {
    awaitData,
    batchSize,
    collation,
    comment,
    explain,
    hint,
    limit,
    max,
    maxTimeMS,
    min,
    partial,
    projection,
    promoteBuffers,
    promoteLongs,
    promoteValues,
    readPreference,
    returnKey,
    session,
    showDiskLoc,
    skip,
    sort,
    tailable,
    timeout
  }
}

export function asUpdateOptions ({
  arrayFilters,
  bypassDocumentValidation,
  session,
  upsert,
  writeConcern
}) {
  return {
    arrayFilters,
    bypassDocumentValidation,
    session,
    upsert,
    writeConcern
  }
}

export function asDeleteOptions ({ session, writeConcern }) {
  return {
    session,
    writeConcern
  }
}

export function asBulkOptions ({
  bypassDocumentValidation,
  forceServerObjectId,
  ordered,
  serializeFunctions,
  session,
  writeConcern
}) {
  return {
    bypassDocumentValidation,
    forceServerObjectId,
    ordered,
    serializeFunctions,
    session,
    writeConcern
  }
}
