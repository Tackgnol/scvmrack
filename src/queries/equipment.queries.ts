/** Types generated for queries found in "src/queries/equipment.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type NumberOrString = number | string;

/** 'SearchItems' parameters type */
export interface ISearchItemsParams {
  limit?: NumberOrString | null | void;
  locale?: string | null | void;
  q?: string | null | void;
}

/** 'SearchItems' return type */
export interface ISearchItemsResult {
  id: number | null;
  itemType: string | null;
  key: string | null;
  name: string | null;
}

/** 'SearchItems' query type */
export interface ISearchItemsQuery {
  params: ISearchItemsParams;
  result: ISearchItemsResult;
}

const searchItemsIR: any = {"usedParamSet":{"q":true,"locale":true,"limit":true},"params":[{"name":"q","required":false,"transform":{"type":"scalar"},"locs":[{"a":270,"b":271},{"a":342,"b":343},{"a":453,"b":454},{"a":504,"b":505},{"a":559,"b":560}]},{"name":"locale","required":false,"transform":{"type":"scalar"},"locs":[{"a":999,"b":1005}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":1056,"b":1061}]}],"statement":"-- Complex CTE query with fuzzy matching using trigram similarity and full-text search\nWITH ranked_matches AS (\n    SELECT\n        s.item_type,\n        s.id,\n        s.key,\n        s.name,\n        s.locale,\n        ts_rank(s.document, plainto_tsquery('simple', unaccent(:q))) AS ts_score,\n        similarity(s.normalized_name, lower(unaccent(:q))) AS sim_score\n    FROM item_search s\n    WHERE (\n        s.document @@ plainto_tsquery('simple', unaccent(:q))\n        OR s.normalized_name % lower(unaccent(:q))\n        OR s.normalized_name LIKE (lower(unaccent(:q)) || '%')\n    )\n),\nbest_matches AS (\n    SELECT DISTINCT ON (item_type, id)\n        item_type,\n        id,\n        key,\n        ts_score,\n        sim_score\n    FROM ranked_matches\n    ORDER BY item_type, id, ts_score DESC, sim_score DESC\n)\nSELECT\n    b.item_type,\n    b.id,\n    b.key,\n    COALESCE(t.name, b.key) AS name\nFROM best_matches b\nLEFT JOIN item_search t\n    ON t.id = b.id\n    AND t.item_type = b.item_type\n    AND t.locale = :locale\nORDER BY b.ts_score DESC, b.sim_score DESC\nLIMIT :limit"};

/**
 * Query generated from SQL:
 * ```
 * -- Complex CTE query with fuzzy matching using trigram similarity and full-text search
 * WITH ranked_matches AS (
 *     SELECT
 *         s.item_type,
 *         s.id,
 *         s.key,
 *         s.name,
 *         s.locale,
 *         ts_rank(s.document, plainto_tsquery('simple', unaccent(:q))) AS ts_score,
 *         similarity(s.normalized_name, lower(unaccent(:q))) AS sim_score
 *     FROM item_search s
 *     WHERE (
 *         s.document @@ plainto_tsquery('simple', unaccent(:q))
 *         OR s.normalized_name % lower(unaccent(:q))
 *         OR s.normalized_name LIKE (lower(unaccent(:q)) || '%')
 *     )
 * ),
 * best_matches AS (
 *     SELECT DISTINCT ON (item_type, id)
 *         item_type,
 *         id,
 *         key,
 *         ts_score,
 *         sim_score
 *     FROM ranked_matches
 *     ORDER BY item_type, id, ts_score DESC, sim_score DESC
 * )
 * SELECT
 *     b.item_type,
 *     b.id,
 *     b.key,
 *     COALESCE(t.name, b.key) AS name
 * FROM best_matches b
 * LEFT JOIN item_search t
 *     ON t.id = b.id
 *     AND t.item_type = b.item_type
 *     AND t.locale = :locale
 * ORDER BY b.ts_score DESC, b.sim_score DESC
 * LIMIT :limit
 * ```
 */
export const searchItems = new PreparedQuery<ISearchItemsParams,ISearchItemsResult>(searchItemsIR);


/** 'GetItemFull' parameters type */
export interface IGetItemFullParams {
  id?: number | null | void;
  itemType?: string | null | void;
}

/** 'GetItemFull' return type */
export interface IGetItemFullResult {
  getItemFull: Json | null;
}

/** 'GetItemFull' query type */
export interface IGetItemFullQuery {
  params: IGetItemFullParams;
  result: IGetItemFullResult;
}

const getItemFullIR: any = {"usedParamSet":{"itemType":true,"id":true},"params":[{"name":"itemType","required":false,"transform":{"type":"scalar"},"locs":[{"a":21,"b":29}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":32,"b":34}]}],"statement":"SELECT get_item_full(:itemType, :id)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT get_item_full(:itemType, :id)
 * ```
 */
export const getItemFull = new PreparedQuery<IGetItemFullParams,IGetItemFullResult>(getItemFullIR);


