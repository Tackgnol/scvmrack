import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

test('deleting a GM archives only their non-public class lineages', async () => {
  assert.ok(databaseUrl, 'DATABASE_URL is required for integration fixtures');
  const client = new Client({ connectionString: databaseUrl });
  const ownerId = `deleted-owner-${randomUUID()}`;
  const partyOwnerId = `party-owner-${randomUUID()}`;
  const privateLineageId = randomUUID();
  const publicLineageId = randomUUID();

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO "user" (id, name, email, "emailVerified") VALUES ($1, $2, $3, true), ($4, $5, $6, true)',
      [
        ownerId,
        'Deleted GM',
        `${ownerId}@example.test`,
        partyOwnerId,
        'Pool GM',
        `${partyOwnerId}@example.test`,
      ],
    );
    await client.query(
      'INSERT INTO "classes" (name, source, "owner_user_id", visibility, "lineage_id") VALUES ($1, $2, $3, $4, $5), ($6, $2, $3, $7, $8)',
      [
        `Private class ${privateLineageId}`,
        'user',
        ownerId,
        'private',
        privateLineageId,
        `Public class ${publicLineageId}`,
        'public',
        publicLineageId,
      ],
    );
    const party = await client.query<{ id: string }>(
      'INSERT INTO "parties" (name, "owner_user_id", "invite_token") VALUES ($1, $2, $3) RETURNING id',
      ['Archive test party', partyOwnerId, randomUUID()],
    );
    const partyId = party.rows[0]?.id;
    assert.ok(partyId);
    await client.query(
      'INSERT INTO "party_class_pools" ("party_id", "lineage_id") VALUES ($1, $2), ($1, $3)',
      [partyId, privateLineageId, publicLineageId],
    );

    await client.query('DELETE FROM "user" WHERE id = $1', [ownerId]);

    const classes = await client.query<{
      lineageId: string;
      ownerUserId: string | null;
      status: string;
    }>(
      'SELECT "lineage_id" AS "lineageId", "owner_user_id" AS "ownerUserId", status FROM "classes" WHERE "lineage_id" = ANY($1::uuid[]) ORDER BY "lineage_id"',
      [[privateLineageId, publicLineageId]],
    );
    const byLineage = new Map(classes.rows.map((row) => [row.lineageId, row]));
    assert.deepEqual(byLineage.get(privateLineageId), {
      lineageId: privateLineageId,
      ownerUserId: null,
      status: 'archived',
    });
    assert.deepEqual(byLineage.get(publicLineageId), {
      lineageId: publicLineageId,
      ownerUserId: null,
      status: 'active',
    });

    const pool = await client.query<{ lineageId: string }>(
      'SELECT "lineage_id" AS "lineageId" FROM "party_class_pools" WHERE "party_id" = $1 ORDER BY "lineage_id"',
      [partyId],
    );
    assert.deepEqual(pool.rows, [{ lineageId: publicLineageId }]);
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
});
