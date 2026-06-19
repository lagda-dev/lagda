import { createAuth } from "./src/auth"
import { loadAuthConfig } from "./src/loadAuthConfig"

// Config entry point for the Better Auth CLI (`@better-auth/cli migrate`). The CLI discovers a file
// exporting an `auth` instance and reads its schema to apply the Better Auth tables (user, session,
// account, verification, jwks, organization, member, invitation). It reuses the SAME `createAuth`
// factory the running service uses, so the migrated schema can never drift from the live auth config.
//
// It reads AUTH_DATABASE_URL/DATABASE_URL + AUTH_BASE_URL from the environment via loadAuthConfig,
// exactly like apps/auth/src/server.ts — zero divergence between "what we migrate" and "what we run".
const config = loadAuthConfig()

export const auth = createAuth({ databaseUrl: config.databaseUrl, baseUrl: config.baseUrl })
