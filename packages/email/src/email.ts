// Public API of @lagda/email — reusable transactional email.
//   - Mailer port + EmailMessage (depend on these, not a transport)
//   - SMTP mailer (nodemailer) and a dev logging mailer
//   - env-driven assembly (createMailerFromEnv) + the SMTP config/transport infrastructure
export type { EmailMessage, Mailer } from "./mailers/mailer"
export { createSmtpMailer } from "./mailers/smtpMailer"
export { createLoggingMailer } from "./mailers/loggingMailer"
export { createMailerFromEnv } from "./createMailerFromEnv"
export { loadSmtpConfig } from "./infrastructure/smtpConfig"
export type { SmtpConfig } from "./infrastructure/smtpConfig"
export { createSmtpTransport } from "./infrastructure/smtpTransport"
export type { MailTransport } from "./infrastructure/smtpTransport"
