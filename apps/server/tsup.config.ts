import { defineConfig } from "tsup"

// Bundle the internal @lagda/* workspace packages (consumed as TypeScript source)
// into the server output so the built artifact runs under plain Node ESM. Third-party
// dependencies stay external and resolve from node_modules at runtime.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  noExternal: [/^@lagda\//],
})
