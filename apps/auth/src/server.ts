import { serve } from "@hono/node-server"
import { createApp } from "./app"
import { createAuth } from "./auth"
import { loadAuthConfig } from "./loadAuthConfig"

const config = loadAuthConfig()
const auth = createAuth({ databaseUrl: config.databaseUrl, baseUrl: config.baseUrl })
const app = createApp(auth)

serve({ fetch: app.fetch, port: config.port }, (info) => {
  process.stdout.write(`lagda-auth listening on http://localhost:${info.port}\n`)
})
