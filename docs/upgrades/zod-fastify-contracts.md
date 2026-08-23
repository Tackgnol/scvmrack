# Fastify contract inference

**Status:** Implemented on `chore/zod-fastify-contracts`.

This change keeps the current Fastify JSON Schema and service-level validation
as-is. It supersedes the earlier Zod-first direction.

## Goal

Infer route types from the existing JSON Schemas and share domain limits only
where direct service callers need them. Keep Ajv, `fast-json-stringify`,
Swagger, OpenAPI client generation, and the repository → service → controller
boundaries unchanged.

## Verified findings

| Finding | Evidence |
|---|---|
| Route request types were handwritten beside their JSON Schemas | 32 route generics across 6 files on the `dev` base: parties 14, characters 8, party enemies 6, equipment 2, feedback 1, OBR 1 |
| The live `CharacterUpdate` mirror has drifted from `UpdateBodySchema` | It omits `maxHp`, `maxOmens`, and `tale`; `abilities` omits `comment` and makes optional schema fields required; `equippedArmor` omits schema-accepted `null`; modifier shapes also differ |
| `CharacterPatch` is dead code | Its definition in `schemas/character.ts` is its only `src/` reference |
| The misery range was repeated on `dev` | Two backend enforcement sites: the character update schema and character sanitizer. The unmerged GM-misery branch adds three party sites that should consume the same constants when rebased |
| Schema inference was blocked in four files | 31 schema constants lacked `as const`: 13 in `character.ts`, 12 in `draft.ts`, 4 in `equipment.ts`, and 2 in `feedback.ts`; `DraftPreviewSchema` also spreads `CharacterSchema` across files |
| One comment documents the wrong runtime behavior | `additionalProperties: false, // Reject unknown fields` in `schemas/character.ts` |

Fastify's default Ajv configuration uses `removeAdditional: true`.
`additionalProperties: false` therefore strips unknown properties; it does not
reject them.

## Implementation

- Added `@fastify/type-provider-json-schema-to-ts` as a development dependency.
- Added `as const` to the 31 externally defined schemas that needed it, inner
  schemas before outer schemas and `character.ts` before `draft.ts`.
- Scoped `.withTypeProvider<JsonSchemaToTsProvider>()` to each migrated route
  plugin. This is compile-time only; no validator or serializer compiler
  changes were made.
- Deleted the dead `CharacterPatch`, the drifted `CharacterUpdate`, its helper
  interfaces, and the now-unused `types/character.ts`.
- Made the generated-body seed properties statically visible to TypeScript.
  The emitted JSON Schema is equivalent to the previous `Object.fromEntries`
  result.
- Added serializer deserialization typing for `date-time` fields on character
  routes because `fast-json-stringify` accepts `Date` objects and emits strings.
- Narrowed existing `ServiceResult<unknown>` annotations where reply inference
  exposed already-known result shapes.
- Shared `MISERY_MIN` and `MISERY_MAX` between the character request schema and
  sanitizer.
- Kept OpenAPI as the frontend contract boundary.
- Added no ADR because the runtime architecture did not change.

Request and reply types are now inferred for schema-backed routes. The one
intentional exception is `GET /equipment/:itemType/:id`: it has no 200 response
schema, so it retains its existing request generic rather than incorrectly
inferring every successful reply as an error payload. Adding that missing
response schema is separate contract work.

No TS2589 instantiation-depth error occurred, so no deserialize override or
handwritten fallback was needed for the nested request schemas.

`UpdateBodySchema` is the largest and most deeply nested request schema, while
`DraftPreviewSchema` spreads the largest response schema. Inference in either
file may hit TypeScript's TS2589 instantiation-depth limit. If it does, use the
provider's `ValidatorSchemaOptions.deserialize` or
`SerializerSchemaOptions.deserialize`, as appropriate, to map only the
problematic subschema to an explicit type. Keep the runtime JSON Schema
unchanged and do not fall back to a handwritten whole-body mirror.

`frontend/src/api/schema.ts` remains unchanged. A fresh regeneration is not
currently byte-stable against that checked-in file: the repository has no
frontend lockfile, and neither the installed `openapi-typescript` 7.13.0 nor an
explicit 7.10.1 reproduces it. Pinning the generator and accepting that
generated diff is separate work; it is not mixed into this type-only migration.

## Done when

- `CharacterPatch`, `CharacterUpdate`, their unused helpers, and the dead
  character types module are gone.
- Route request types, and reply types where success response schemas exist,
  are inferred instead of mirrored manually.
- The backend misery range is stated once.
- Ajv validation and `fast-json-stringify` behavior are unchanged.
- `frontend/src/api/schema.ts` has no diff.
- Backend unit/integration tests, frontend build, and browser tests pass.
- The change contains no unrelated feature or business-logic work.

## Revisit Zod only when needed

Reconsider Zod when cross-field rules become materially awkward in JSON Schema
or shared frontend/backend runtime parsing becomes a concrete requirement.
The frontend already uses Zod, and
`frontend/src/validation/characterUpdate.ts` is an independent runtime
statement of the update rules; revisit sharing only if maintaining that
separation causes material drift.

Until then, keep OpenAPI as the boundary and do not share Zod schemas directly.

If Zod is revisited:

- Use the unscoped `fastify-type-provider-zod` package and verify its current
  Zod, Fastify, Swagger, and `openapi-types` compatibility floors.
- As of 2026-07-25, v7 targets Zod 4.2+ and requires
  `@fastify/swagger >=9.5.1`; raise this repository's declared Swagger floor
  from `^9.0.0` before adoption.
- Scope its validator, serializer, and type provider to migrated plugins;
  Fastify encapsulates all three.
- Preserve current unknown-property stripping, coercion, defaults, formats,
  nullable behavior, and OpenAPI output. Do not add `.strict()` reflexively.
- Treat replacement of `fast-json-stringify` with Zod validation plus
  `JSON.stringify` as an accepted runtime cost, not preserved behavior.
- Preserve the four validation-entry fields consumed by `normalizeApiError`:
  `instancePath`, `params.missingProperty`, `keyword`, and `message`. Also
  preserve the parent error's `validationContext`.
- Keep `Prisma.InputJsonValue` at the persistence boundary. The current JSON
  fields are finite structures and do not require `z.lazy()`.

## References

- [Fastify type providers](https://fastify.dev/docs/latest/Reference/Type-Providers/)
- [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [JSON Schema to TS provider](https://github.com/fastify/fastify-type-provider-json-schema-to-ts)
- [Zod provider](https://github.com/turkerdev/fastify-type-provider-zod)
