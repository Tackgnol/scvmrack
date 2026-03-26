/* @name generateCharacter */
SELECT generate_character(:classId::integer) AS "generateCharacter";

/* @name bindCharacterToUser */
UPDATE characters
SET user_id = :userId
WHERE id = :id;

/* @name getCharacterFull */
SELECT * FROM get_character_full(:id, :locale);

/* @name updateCharacter */
SELECT update_character(:id::uuid, :patch::jsonb);

/* @name deleteCharacter */
DELETE FROM characters WHERE id = :id RETURNING id;

/* @name listUserCharacters */
SELECT
    c.id,
    c.name,
    c.class_id AS "classId",
    COALESCE(t_class_name.value, cl.name) AS "className",
    c.current_hp AS "currentHp",
    c.max_hp AS "maxHp",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
FROM characters c
LEFT JOIN classes cl ON cl.id = c.class_id
LEFT JOIN translations t_class_name
    ON t_class_name.key = cl.name_key
    AND t_class_name.locale = :locale
WHERE c.user_id = :userId
ORDER BY c.updated_at DESC;

/* @name checkCharacterAccess */
SELECT user_id AS "userId" FROM characters WHERE id = :id;

/* @name checkUserIsAnonymous */
SELECT "isAnonymous" FROM "user" WHERE id = :id;

/* @name claimCharacterFromAnonymous */
UPDATE characters
SET user_id = :userId
WHERE id = :characterId
  AND user_id = :guestId
RETURNING id;

/* @name getTotalCharacters */
SELECT count(*)::int AS "total" FROM characters;
