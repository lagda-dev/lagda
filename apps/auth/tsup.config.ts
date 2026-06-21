import { defineConfig } from "tsup"

// Bundle the internal @lagda/* workspace packages (consumed as TypeScript source)
// into the auth output so the built artifact runs under plain Node ESM. Third-party
// dependencies stay external and resolve from node_modules at runtime.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  noExternal: [/^@lagda\//],
  // `nodemailer` reaches the bundle transitively through the bundled `@lagda/email`, so it is not in
  // this app's own dependencies and tsup would otherwise inline it. It is CommonJS and uses dynamic
  // `require()`, which throws "Dynamic require not supported" once inlined into ESM. Force it external
  // so it is imported from node_modules at runtime (pnpm deploy includes it via @lagda/email).
  external: ["nodemailer"],
})
