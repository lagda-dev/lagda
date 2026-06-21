import nodemailer from "nodemailer"
import type { SmtpConfig } from "./smtpConfig"

// The minimal transport surface the mailers need — anything with `sendMail`. nodemailer's Transporter
// satisfies this; tests substitute a fake so no socket is ever opened.
export type MailTransport = {
  sendMail: (message: { from: string; to: string; subject: string; text: string }) => Promise<unknown>
}

// Build a real nodemailer transport from validated config. `createTransport` is synchronous and does not
// open a connection, so this is side-effect free until the first send.
export const createSmtpTransport = (config: SmtpConfig): MailTransport =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth ? { user: config.auth.user, pass: config.auth.password } : undefined,
  })
