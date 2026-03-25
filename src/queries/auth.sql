/* @name getUserEncryptedEmailById */
SELECT encrypted_email AS "encryptedEmail" FROM "user" WHERE id = :id;

/* @name getUserEmailBidxById */
SELECT email_bidx AS "emailBidx" FROM "user" WHERE id = :id;

/* @name transferCharacterOwnership */
UPDATE characters
SET user_id = :userId
WHERE user_id = :guestId
RETURNING id;

/* @name getUserEncryptedEmailByBidx */
SELECT encrypted_email AS "encryptedEmail" FROM "user" WHERE email_bidx = :emailBidx;

/* @name getLatestCharacterIdByUserId */
SELECT id FROM characters
WHERE user_id = :userId
ORDER BY updated_at DESC
LIMIT 1;
