import { getErrorMessage } from "@lagda/core"
import type { MailTransport } from "../infrastructure/smtpTransport"
import type { Mailer } from "./mailer"

// A Mailer that delivers over SMTP via the injected transport, stamping the configured From address.
// Send failures are wrapped with context (never swallowed) so a failed delivery surfaces to the caller.
export const createSmtpMailer = (transport: MailTransport, from: string): Mailer => ({
  send: async ({ to, subject, text }) => {
    try {
      await transport.sendMail({ from, to, subject, text })
    } catch (error) {
      throw new Error(`Failed to send email to ${to}: ${getErrorMessage(error)}`)
    }
  },
})
