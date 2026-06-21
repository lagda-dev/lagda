import { type Kysely, sql } from "kysely"

// Scoped, org-bound application tokens for the public REST API (§4). The plaintext secret is shown once
// at mint time and never stored — only its SHA-256 hash lives here (unique, so the future verification
// path can do a constant-shape lookup by hash). `revoked_at` is null until the token is revoked.
export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("application_tokens")
    // Text id (not a generated uuid): the token id is minted in app code as a random hex string and is
    // authoritative, so the mint response and the stored row always share the same id.
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("scopes", "jsonb", (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn("hashed_token", "text", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("revoked_at", "timestamptz")
    .execute()
  await db.schema.createIndex("application_tokens_org_id_index").on("application_tokens").column("org_id").execute()
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable("application_tokens").ifExists().execute()
}
