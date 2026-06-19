import { Hono } from "hono"
import type { Auth } from "./auth"

// The auth service's HTTP surface. Better Auth owns every identity route under /api/auth/* — including
// sign-in, email-OTP, organizations, JWT issuance (/api/auth/token), and the JWKS document the resource
// server verifies bearer tokens against (/api/auth/jwks). We add only liveness/readiness probes (§9).
export const createApp = (auth: Auth) => {
  const app = new Hono()

  const routes = app
    // Liveness: the process is up and serving. No dependencies are checked here (§9).
    .get("/healthz", (ctx) => ctx.json({ status: "ok" }))
    // Readiness: the service is ready to take traffic. The Better Auth handler owns its own pool;
    // a deeper DB ping can be added once a health hook is exposed.
    .get("/readyz", (ctx) => ctx.json({ status: "ready" }))

  // Delegate all identity/token routes (incl. the well-known JWKS at /api/auth/jwks) to Better Auth.
  app.on(["POST", "GET"], "/api/auth/*", (ctx) => auth.handler(ctx.req.raw))

  return routes
}

export type AppType = ReturnType<typeof createApp>
