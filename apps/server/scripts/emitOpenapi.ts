import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { createApp } from "../src/app"
import type { ApiDependencies } from "../src/routes/v1/dependencies"

// Emit the OpenAPI document to apps/server/openapi.json so a CI gate (docs.yml) can fail on drift:
// regenerate the spec on every PR and diff it against the committed copy. The spec is a pure function
// of the route definitions — generating it never touches the database, the queue, or the auth service.
//
// The dependencies are therefore an inert stub: route REGISTRATION only reads `verifyToken`/`logger`
// (to bind the RBAC middleware); the repository and enqueuer are invoked at REQUEST time, which doc
// generation never reaches. A Proxy returns a throwing function for any access so an accidental call
// during emission fails loudly rather than silently producing a wrong spec.
const inertDependencies = new Proxy(
  {},
  {
    get: () => () => {
      throw new Error("a dependency was invoked while emitting the OpenAPI document — emission must stay side-effect free")
    },
  },
) as ApiDependencies

const emitOpenapiDocument = async (): Promise<void> => {
  const app = createApp(inertDependencies)
  const response = await app.request("/api/openapi.json")
  if (!response.ok) {
    throw new Error(`OpenAPI document route returned ${response.status}`)
  }
  const document = await response.json()
  const outputPath = join(import.meta.dirname, "..", "openapi.json")
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`)
  process.stdout.write(`openapi: wrote ${outputPath}\n`)
}

emitOpenapiDocument().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
