/** Types generated for queries found in "src/queries/characters.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'GenerateCharacter' parameters type */
export interface IGenerateCharacterParams {
  classId?: number | null | void;
}

/** 'GenerateCharacter' return type */
export interface IGenerateCharacterResult {
  generateCharacter: string | null;
}

/** 'GenerateCharacter' query type */
export interface IGenerateCharacterQuery {
  params: IGenerateCharacterParams;
  result: IGenerateCharacterResult;
}

const generateCharacterIR: any = {"usedParamSet":{"classId":true},"params":[{"name":"classId","required":false,"transform":{"type":"scalar"},"locs":[{"a":26,"b":33}]}],"statement":"SELECT generate_character(:classId::integer) AS \"generateCharacter\""};

/**
 * Query generated from SQL:
 * ```
 * SELECT generate_character(:classId::integer) AS "generateCharacter"
 * ```
 */
export const generateCharacter = new PreparedQuery<IGenerateCharacterParams,IGenerateCharacterResult>(generateCharacterIR);


/** 'BindCharacterToUser' parameters type */
export interface IBindCharacterToUserParams {
  id?: string | null | void;
  userId?: string | null | void;
}

/** 'BindCharacterToUser' return type */
export type IBindCharacterToUserResult = void;

/** 'BindCharacterToUser' query type */
export interface IBindCharacterToUserQuery {
  params: IBindCharacterToUserParams;
  result: IBindCharacterToUserResult;
}

const bindCharacterToUserIR: any = {"usedParamSet":{"userId":true,"id":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":32,"b":38}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":51,"b":53}]}],"statement":"UPDATE characters\nSET user_id = :userId\nWHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE characters
 * SET user_id = :userId
 * WHERE id = :id
 * ```
 */
export const bindCharacterToUser = new PreparedQuery<IBindCharacterToUserParams,IBindCharacterToUserResult>(bindCharacterToUserIR);


/** 'GetCharacterFull' parameters type */
export interface IGetCharacterFullParams {
  id?: string | null | void;
  locale?: string | null | void;
}

/** 'GetCharacterFull' return type */
export interface IGetCharacterFullResult {
  abilities: Json | null;
  agility: number | null;
  bodyDescription: string | null;
  classDescription: string | null;
  classId: number | null;
  className: string | null;
  computedModifiers: Json | null;
  createdAt: Date | null;
  currentHp: number | null;
  drToDodge: number | null;
  drToMelee: number | null;
  drToRanged: number | null;
  encumbrance: number | null;
  equipment: Json | null;
  equippedArmor: Json | null;
  equippedWeapons: Json | null;
  habit: string | null;
  id: string | null;
  maxEncumbrance: number | null;
  maxHp: number | null;
  maxOmens: number | null;
  modifiers: Json | null;
  name: string | null;
  notes: string | null;
  omens: number | null;
  origin: string | null;
  presence: number | null;
  silver: number | null;
  storage: Json | null;
  strength: number | null;
  tale: string | null;
  toughness: number | null;
  trait1: string | null;
  trait2: string | null;
  updatedAt: Date | null;
}

/** 'GetCharacterFull' query type */
export interface IGetCharacterFullQuery {
  params: IGetCharacterFullParams;
  result: IGetCharacterFullResult;
}

const getCharacterFullIR: any = {"usedParamSet":{"id":true,"locale":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":33,"b":35}]},{"name":"locale","required":false,"transform":{"type":"scalar"},"locs":[{"a":38,"b":44}]}],"statement":"SELECT * FROM get_character_full(:id, :locale)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM get_character_full(:id, :locale)
 * ```
 */
export const getCharacterFull = new PreparedQuery<IGetCharacterFullParams,IGetCharacterFullResult>(getCharacterFullIR);


/** 'UpdateCharacter' parameters type */
export interface IUpdateCharacterParams {
  id?: string | null | void;
  patch?: Json | null | void;
}

/** 'UpdateCharacter' return type */
export interface IUpdateCharacterResult {
  updateCharacter: string | null;
}

/** 'UpdateCharacter' query type */
export interface IUpdateCharacterQuery {
  params: IUpdateCharacterParams;
  result: IUpdateCharacterResult;
}

const updateCharacterIR: any = {"usedParamSet":{"id":true,"patch":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":24,"b":26}]},{"name":"patch","required":false,"transform":{"type":"scalar"},"locs":[{"a":35,"b":40}]}],"statement":"SELECT update_character(:id::uuid, :patch::jsonb)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT update_character(:id::uuid, :patch::jsonb)
 * ```
 */
export const updateCharacter = new PreparedQuery<IUpdateCharacterParams,IUpdateCharacterResult>(updateCharacterIR);


/** 'DeleteCharacter' parameters type */
export interface IDeleteCharacterParams {
  id?: string | null | void;
}

/** 'DeleteCharacter' return type */
export interface IDeleteCharacterResult {
  id: string;
}

/** 'DeleteCharacter' query type */
export interface IDeleteCharacterQuery {
  params: IDeleteCharacterParams;
  result: IDeleteCharacterResult;
}

const deleteCharacterIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":34,"b":36}]}],"statement":"DELETE FROM characters WHERE id = :id RETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM characters WHERE id = :id RETURNING id
 * ```
 */
export const deleteCharacter = new PreparedQuery<IDeleteCharacterParams,IDeleteCharacterResult>(deleteCharacterIR);


/** 'ListUserCharacters' parameters type */
export interface IListUserCharactersParams {
  locale?: string | null | void;
  userId?: string | null | void;
}

/** 'ListUserCharacters' return type */
export interface IListUserCharactersResult {
  classId: number | null;
  className: string | null;
  createdAt: Date | null;
  currentHp: number;
  id: string;
  maxHp: number;
  name: string;
  updatedAt: Date | null;
}

/** 'ListUserCharacters' query type */
export interface IListUserCharactersQuery {
  params: IListUserCharactersParams;
  result: IListUserCharactersResult;
}

const listUserCharactersIR: any = {"usedParamSet":{"locale":true,"userId":true},"params":[{"name":"locale","required":false,"transform":{"type":"scalar"},"locs":[{"a":397,"b":403}]},{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":423,"b":429}]}],"statement":"SELECT\n    c.id,\n    c.name,\n    c.class_id AS \"classId\",\n    COALESCE(t_class_name.value, cl.name) AS \"className\",\n    c.current_hp AS \"currentHp\",\n    c.max_hp AS \"maxHp\",\n    c.created_at AS \"createdAt\",\n    c.updated_at AS \"updatedAt\"\nFROM characters c\nLEFT JOIN classes cl ON cl.id = c.class_id\nLEFT JOIN translations t_class_name\n    ON t_class_name.key = cl.name_key\n    AND t_class_name.locale = :locale\nWHERE c.user_id = :userId\nORDER BY c.updated_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     c.id,
 *     c.name,
 *     c.class_id AS "classId",
 *     COALESCE(t_class_name.value, cl.name) AS "className",
 *     c.current_hp AS "currentHp",
 *     c.max_hp AS "maxHp",
 *     c.created_at AS "createdAt",
 *     c.updated_at AS "updatedAt"
 * FROM characters c
 * LEFT JOIN classes cl ON cl.id = c.class_id
 * LEFT JOIN translations t_class_name
 *     ON t_class_name.key = cl.name_key
 *     AND t_class_name.locale = :locale
 * WHERE c.user_id = :userId
 * ORDER BY c.updated_at DESC
 * ```
 */
export const listUserCharacters = new PreparedQuery<IListUserCharactersParams,IListUserCharactersResult>(listUserCharactersIR);


/** 'CheckCharacterAccess' parameters type */
export interface ICheckCharacterAccessParams {
  id?: string | null | void;
}

/** 'CheckCharacterAccess' return type */
export interface ICheckCharacterAccessResult {
  /** User who owns this character (NULL for unclaimed guests) */
  userId: string | null;
}

/** 'CheckCharacterAccess' query type */
export interface ICheckCharacterAccessQuery {
  params: ICheckCharacterAccessParams;
  result: ICheckCharacterAccessResult;
}

const checkCharacterAccessIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":54,"b":56}]}],"statement":"SELECT user_id AS \"userId\" FROM characters WHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT user_id AS "userId" FROM characters WHERE id = :id
 * ```
 */
export const checkCharacterAccess = new PreparedQuery<ICheckCharacterAccessParams,ICheckCharacterAccessResult>(checkCharacterAccessIR);


/** 'CheckUserIsAnonymous' parameters type */
export interface ICheckUserIsAnonymousParams {
  id?: string | null | void;
}

/** 'CheckUserIsAnonymous' return type */
export interface ICheckUserIsAnonymousResult {
  isAnonymous: boolean;
}

/** 'CheckUserIsAnonymous' query type */
export interface ICheckUserIsAnonymousQuery {
  params: ICheckUserIsAnonymousParams;
  result: ICheckUserIsAnonymousResult;
}

const checkUserIsAnonymousIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":46}]}],"statement":"SELECT \"isAnonymous\" FROM \"user\" WHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT "isAnonymous" FROM "user" WHERE id = :id
 * ```
 */
export const checkUserIsAnonymous = new PreparedQuery<ICheckUserIsAnonymousParams,ICheckUserIsAnonymousResult>(checkUserIsAnonymousIR);


/** 'ClaimCharacterFromAnonymous' parameters type */
export interface IClaimCharacterFromAnonymousParams {
  characterId?: string | null | void;
  guestId?: string | null | void;
  userId?: string | null | void;
}

/** 'ClaimCharacterFromAnonymous' return type */
export interface IClaimCharacterFromAnonymousResult {
  id: string;
}

/** 'ClaimCharacterFromAnonymous' query type */
export interface IClaimCharacterFromAnonymousQuery {
  params: IClaimCharacterFromAnonymousParams;
  result: IClaimCharacterFromAnonymousResult;
}

const claimCharacterFromAnonymousIR: any = {"usedParamSet":{"userId":true,"characterId":true,"guestId":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":32,"b":38}]},{"name":"characterId","required":false,"transform":{"type":"scalar"},"locs":[{"a":51,"b":62}]},{"name":"guestId","required":false,"transform":{"type":"scalar"},"locs":[{"a":80,"b":87}]}],"statement":"UPDATE characters\nSET user_id = :userId\nWHERE id = :characterId\n  AND user_id = :guestId\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE characters
 * SET user_id = :userId
 * WHERE id = :characterId
 *   AND user_id = :guestId
 * RETURNING id
 * ```
 */
export const claimCharacterFromAnonymous = new PreparedQuery<IClaimCharacterFromAnonymousParams,IClaimCharacterFromAnonymousResult>(claimCharacterFromAnonymousIR);


/** 'GetTotalCharacters' parameters type */
export type IGetTotalCharactersParams = void;

/** 'GetTotalCharacters' return type */
export interface IGetTotalCharactersResult {
  total: number | null;
}

/** 'GetTotalCharacters' query type */
export interface IGetTotalCharactersQuery {
  params: IGetTotalCharactersParams;
  result: IGetTotalCharactersResult;
}

const getTotalCharactersIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT count(*)::int AS \"total\" FROM characters"};

/**
 * Query generated from SQL:
 * ```
 * SELECT count(*)::int AS "total" FROM characters
 * ```
 */
export const getTotalCharacters = new PreparedQuery<IGetTotalCharactersParams,IGetTotalCharactersResult>(getTotalCharactersIR);
