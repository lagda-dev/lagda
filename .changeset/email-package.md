---
"@lagda/email": minor
"@lagda/auth": patch
---

Extract email delivery into a reusable `@lagda/email` package (DDD layout: `infrastructure/` for SMTP
config + nodemailer transport, `mailers/` for the SMTP and dev-logging mailers behind a `Mailer` port,
plus env-driven assembly). The auth service now depends on the package and keeps only OTP-domain logic
(the email copy and the fail-fast/dev-log policy), so any app can send transactional email without
re-implementing SMTP. The dev stack gains MailHog so OTP emails are viewable at http://localhost:8025.
