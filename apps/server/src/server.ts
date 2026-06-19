import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { loadConfig } from "@lagda/core"
import { createApp } from "./app"

const config = loadConfig()
const app = createApp()

const isProduction = process.env.NODE_ENV === "production"
if (isProduction) {
  app.use("/*", serveStatic({ root: "./public" }))
  app.get("*", serveStatic({ path: "./public/index.html" }))
}

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  process.stdout.write(`lagda-server listening on http://localhost:${info.port}\n`)
})
