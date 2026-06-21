import { createMailerFromEnv } from "@lagda/email"
import type { Mailer } from "@lagda/email"
import { createOtpEmailSender } from "./otpEmailSender"
import { createLoggingOtpSender } from "./otpSender"
import type { OtpSender } from "./otpSender"

// Choose how OTP codes are delivered, at startup:
//   - a Mailer is available (SMTP configured) → send real email (any environment).
//   - production + no Mailer → FAIL FAST: refuse to start, because email-OTP gates every sign-in AND
//     sign-up verification, so a production instance with no email transport could authenticate no one.
//   - non-production + no Mailer → the dev logging stub (prints the code locally).
// The mailer resolver is injectable so tests pick the branch without opening a socket.
export const resolveOtpSender = (
  env: NodeJS.ProcessEnv = process.env,
  resolveMailer: (env: NodeJS.ProcessEnv) => Mailer | null = createMailerFromEnv,
): OtpSender => {
  const mailer = resolveMailer(env)
  if (mailer !== null) {
    return createOtpEmailSender(mailer)
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "OTP email is not configured: set SMTP_HOST/SMTP_PORT/SMTP_FROM (and SMTP_USER/SMTP_PASSWORD if your relay needs auth). " +
        "Production refuses to start without it, since email-OTP gates all sign-in and sign-up verification.",
    )
  }

  return createLoggingOtpSender()
}
