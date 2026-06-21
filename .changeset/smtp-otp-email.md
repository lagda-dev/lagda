---
"@lagda/auth": minor
---

Deliver OTP codes by email over SMTP (nodemailer). The auth service resolves its OTP transport at
startup: when SMTP is configured (`SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM`, plus optional
`SMTP_USER`/`SMTP_PASSWORD`) it sends real email; in development with no SMTP it falls back to printing
the code to the logs. In production with no SMTP it **fails fast** at startup rather than booting into a
state where no one can receive a sign-in or sign-up code. Works with any SMTP provider.
