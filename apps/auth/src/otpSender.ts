// The OTP delivery side-effect is abstracted behind an injectable sender so the auth instance never
// hard-codes a transport. Tests pass a fake; production swaps in a real email provider later.
export type OtpDeliveryType = "sign-in" | "email-verification" | "forget-password"

export type OtpMessage = {
  email: string
  otp: string
  type: OtpDeliveryType
}

export type OtpSender = (message: OtpMessage) => Promise<void>

// TODO(email): replace this logging stub with a real transactional email provider (e.g. Resend / SES).
// For now we only write the delivery intent to stdout — never the OTP value alongside the email in
// production logs (§8 no-PII), so we redact the code here and surface only that a send was attempted.
export const createLoggingOtpSender =
  (write: (line: string) => void = (line) => process.stdout.write(line)): OtpSender =>
  async ({ email, type }) => {
    const redactedEmail = redactEmail(email)
    write(`otp.send type=${type} to=${redactedEmail} otp=<redacted>\n`)
  }

// Reduce an email to a non-identifying shape (first char + domain) so logs stay debuggable without PII.
const redactEmail = (email: string): string => {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "<invalid>"
  const firstChar = localPart.slice(0, 1)
  return `${firstChar}***@${domain}`
}
