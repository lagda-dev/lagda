import nodemailer from "nodemailer"
import { createLoggingOtpSender } from "./otpSender"
import type { OtpSender } from "./otpSender"
import { loadSmtpConfig } from "./smtpConfig"
import type { SmtpConfig } from "./smtpConfig"
import { createSmtpOtpSender } from "./smtpOtpSender"
import type { MailTransport } from "./smtpOtpSender"

// Build a real nodemailer transport from the SMTP config. Injected into resolveOtpSender so tests can
// substitute a fake and never open a socket.
const buildNodemailerTransport = (config: SmtpConfig): MailTransport =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth ? { user: config.auth.user, pass: config.auth.password } : undefined,
  })

// Choose the OTP delivery transport at startup:
//   - SMTP configured  → send real email (any environment).
//   - production + no SMTP → FAIL FAST: refuse to start, because OTP gates every sign-in AND sign-up
//     verification, so a production instance with no email transport could never authenticate anyone.
//   - non-production + no SMTP → the dev logging stub (prints the code locally).
export const resolveOtpSender = (
  env: NodeJS.ProcessEnv = process.env,
  buildTransport: (config: SmtpConfig) => MailTransport = buildNodemailerTransport,
): OtpSender => {
  const smtp = loadSmtpConfig(env)
  if (smtp !== null) {
    return createSmtpOtpSender(buildTransport(smtp), smtp.from)
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "OTP email is not configured: set SMTP_HOST/SMTP_PORT/SMTP_FROM (and SMTP_USER/SMTP_PASSWORD if your relay needs auth). " +
        "Production refuses to start without it, since email-OTP gates all sign-in and sign-up verification.",
    )
  }

  return createLoggingOtpSender()
}
