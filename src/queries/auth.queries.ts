/** Types generated for queries found in "src/queries/auth.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetUserEncryptedEmailById' parameters type */
export interface IGetUserEncryptedEmailByIdParams {
  id?: string | null | void;
}

/** 'GetUserEncryptedEmailById' return type */
export interface IGetUserEncryptedEmailByIdResult {
  encryptedEmail: string;
}

/** 'GetUserEncryptedEmailById' query type */
export interface IGetUserEncryptedEmailByIdQuery {
  params: IGetUserEncryptedEmailByIdParams;
  result: IGetUserEncryptedEmailByIdResult;
}

const getUserEncryptedEmailByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":66,"b":68}]}],"statement":"SELECT encrypted_email AS \"encryptedEmail\" FROM \"user\" WHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT encrypted_email AS "encryptedEmail" FROM "user" WHERE id = :id
 * ```
 */
export const getUserEncryptedEmailById = new PreparedQuery<IGetUserEncryptedEmailByIdParams,IGetUserEncryptedEmailByIdResult>(getUserEncryptedEmailByIdIR);


/** 'GetUserEmailBidxById' parameters type */
export interface IGetUserEmailBidxByIdParams {
  id?: string | null | void;
}

/** 'GetUserEmailBidxById' return type */
export interface IGetUserEmailBidxByIdResult {
  emailBidx: string;
}

/** 'GetUserEmailBidxById' query type */
export interface IGetUserEmailBidxByIdQuery {
  params: IGetUserEmailBidxByIdParams;
  result: IGetUserEmailBidxByIdResult;
}

const getUserEmailBidxByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":56,"b":58}]}],"statement":"SELECT email_bidx AS \"emailBidx\" FROM \"user\" WHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT email_bidx AS "emailBidx" FROM "user" WHERE id = :id
 * ```
 */
export const getUserEmailBidxById = new PreparedQuery<IGetUserEmailBidxByIdParams,IGetUserEmailBidxByIdResult>(getUserEmailBidxByIdIR);


/** 'TransferCharacterOwnership' parameters type */
export interface ITransferCharacterOwnershipParams {
  guestId?: string | null | void;
  userId?: string | null | void;
}

/** 'TransferCharacterOwnership' return type */
export interface ITransferCharacterOwnershipResult {
  id: string;
}

/** 'TransferCharacterOwnership' query type */
export interface ITransferCharacterOwnershipQuery {
  params: ITransferCharacterOwnershipParams;
  result: ITransferCharacterOwnershipResult;
}

const transferCharacterOwnershipIR: any = {"usedParamSet":{"userId":true,"guestId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":32,"b":38}]},{"name":"guestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":56,"b":63}]}],"statement":"UPDATE characters\nSET user_id = :userId\nWHERE user_id = :guestId\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE characters
 * SET user_id = :userId
 * WHERE user_id = :guestId
 * RETURNING id
 * ```
 */
export const transferCharacterOwnership = new PreparedQuery<ITransferCharacterOwnershipParams,ITransferCharacterOwnershipResult>(transferCharacterOwnershipIR);


/** 'GetUserEncryptedEmailByBidx' parameters type */
export interface IGetUserEncryptedEmailByBidxParams {
  emailBidx?: string | null | void;
}

/** 'GetUserEncryptedEmailByBidx' return type */
export interface IGetUserEncryptedEmailByBidxResult {
  encryptedEmail: string;
}

/** 'GetUserEncryptedEmailByBidx' query type */
export interface IGetUserEncryptedEmailByBidxQuery {
  params: IGetUserEncryptedEmailByBidxParams;
  result: IGetUserEncryptedEmailByBidxResult;
}

const getUserEncryptedEmailByBidxIR: any = {"usedParamSet":{"emailBidx":true},"params":[{"name":"emailBidx","required":false,"transform":{"type":"scalar"},"locs":[{"a":74,"b":83}]}],"statement":"SELECT encrypted_email AS \"encryptedEmail\" FROM \"user\" WHERE email_bidx = :emailBidx"};

/**
 * Query generated from SQL:
 * ```
 * SELECT encrypted_email AS "encryptedEmail" FROM "user" WHERE email_bidx = :emailBidx
 * ```
 */
export const getUserEncryptedEmailByBidx = new PreparedQuery<IGetUserEncryptedEmailByBidxParams,IGetUserEncryptedEmailByBidxResult>(getUserEncryptedEmailByBidxIR);


/** 'GetLatestCharacterIdByUserId' parameters type */
export interface IGetLatestCharacterIdByUserIdParams {
  userId?: string | null | void;
}

/** 'GetLatestCharacterIdByUserId' return type */
export interface IGetLatestCharacterIdByUserIdResult {
  id: string;
}

/** 'GetLatestCharacterIdByUserId' query type */
export interface IGetLatestCharacterIdByUserIdQuery {
  params: IGetLatestCharacterIdByUserIdParams;
  result: IGetLatestCharacterIdByUserIdResult;
}

const getLatestCharacterIdByUserIdIR: any = {"usedParamSet":{"userId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":42,"b":48}]}],"statement":"SELECT id FROM characters\nWHERE user_id = :userId\nORDER BY updated_at DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id FROM characters
 * WHERE user_id = :userId
 * ORDER BY updated_at DESC
 * LIMIT 1
 * ```
 */
export const getLatestCharacterIdByUserId = new PreparedQuery<IGetLatestCharacterIdByUserIdParams,IGetLatestCharacterIdByUserIdResult>(getLatestCharacterIdByUserIdIR);


