import { loadSmtpConfig } from "./infrastructure/smtpConfig"
import type { SmtpConfig } from "./infrastructure/smtpConfig"
import { createSmtpTransport } from "./infrastructure/smtpTransport"
import type { MailTransport } from "./infrastructure/smtpTransport"
import { createSmtpMailer } from "./mailers/smtpMailer"
import type { Mailer } from "./mailers/mailer"

// Assemble an SMTP Mailer from the environment, or null when SMTP is not configured (no SMTP_HOST) —
// leaving the not-configured policy (dev logging, production fail-fast, …) to the caller. The transport
// builder is injectable so tests assemble a Mailer without opening a socket.
export const createMailerFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
  buildTransport: (config: SmtpConfig) => MailTransport = createSmtpTransport,
): Mailer | null => {
  const config = loadSmtpConfig(env)
  if (config === null) return null
  return createSmtpMailer(buildTransport(config), config.from)
}
