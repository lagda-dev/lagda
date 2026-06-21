import { getErrorMessage } from "./getErrorMessage"
import type { OtpMessage, OtpSender } from "./otpSender"

// The minimal transport surface we need — anything with `sendMail` (nodemailer's Transporter satisfies
// this). Kept as a tiny interface so the sender is testable with a fake, no live SMTP server required.
export type MailTransport = {
  sendMail: (message: { from: string; to: string; subject: string; text: string }) => Promise<unknown>
}

// The human-facing copy per OTP purpose. Pure and deterministic so it can be asserted directly.
export const renderOtpEmail = (otp: string, type: OtpMessage["type"]): { subject: string; text: string } => {
  if (type === "email-verification") {
    return { subject: "Verify your email for Lagda", text: `Your Lagda verification code is ${otp}. Enter it to confirm your email address.` }
  }
  if (type === "forget-password") {
    return { subject: "Reset your Lagda password", text: `Your Lagda password reset code is ${otp}.` }
  }
  return { subject: "Your Lagda sign-in code", text: `Your Lagda sign-in code is ${otp}.` }
}

// Build an OtpSender that delivers the code over SMTP via the injected transport. Errors are wrapped with
// context (never swallowed) so a failed send surfaces to the auth flow rather than silently dropping.
export const createSmtpOtpSender =
  (transport: MailTransport, from: string): OtpSender =>
  async ({ email, otp, type }) => {
    const { subject, text } = renderOtpEmail(otp, type)
    try {
      await transport.sendMail({ from, to: email, subject, text })
    } catch (error) {
      throw new Error(`Failed to send OTP email to ${email}: ${getErrorMessage(error)}`)
    }
  }
