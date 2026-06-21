import type { Mailer } from "./mailer"

// A Mailer that writes the message to a log sink instead of sending it — a generic development fallback
// when no real transport is configured, so any app can see what it would have emailed. The body is
// printed in full (dev only); callers that send secrets in dev should rely on a real transport.
export const createLoggingMailer = (write: (line: string) => void = (line) => process.stdout.write(line)): Mailer => ({
  send: async ({ to, subject, text }) => {
    write(`email.send to=${to} subject="${subject}"\n${text}\n`)
  },
})
