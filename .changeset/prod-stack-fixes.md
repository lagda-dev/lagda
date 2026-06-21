---
"@lagda/email": patch
"@lagda/auth": patch
---

Fix the production Docker stack, which failed to boot. Keep `nodemailer` external in the auth bundle
(tsup inlined the CommonJS package into the ESM output, throwing "Dynamic require not supported"), and
declare it as a direct dependency so `pnpm deploy --prod` resolves it at runtime. Treat empty-string
SMTP credentials as "no auth" so a no-auth relay (the values docker-compose passes for unset vars) no
longer fails validation and crashes the auth service at startup. Also swap the dev MailHog catcher for
the multi-arch Mailpit (native on Apple Silicon) and shadow the renamed `integrations` package's
node_modules in the dev stack.
