import type { Mailer } from "@lagda/email"
import type { OtpMessage, OtpSender } from "./otpSender"

// The OTP-specific copy per purpose. Pure and deterministic so it can be asserted directly. This is the
// auth domain's knowledge (what a sign-in/verification/reset email says); the generic Mailer (from
// @lagda/email) only knows how to deliver an EmailMessage.
export const renderOtpEmail = (otp: string, type: OtpMessage["type"]): { subject: string; text: string } => {
  if (type === "email-verification") {
    return { subject: "Verify your email for Lagda", text: `Your Lagda verification code is ${otp}. Enter it to confirm your email address.` }
  }
  if (type === "forget-password") {
    return { subject: "Reset your Lagda password", text: `Your Lagda password reset code is ${otp}.` }
  }
  return { subject: "Your Lagda sign-in code", text: `Your Lagda sign-in code is ${otp}.` }
}

// Adapt a generic Mailer into the OtpSender the auth instance calls: render the OTP copy, then delegate
// delivery. The Mailer already wraps transport errors, so we do not re-wrap (no double-wrapping, §3).
export const createOtpEmailSender =
  (mailer: Mailer): OtpSender =>
  async ({ email, otp, type }) => {
    const { subject, text } = renderOtpEmail(otp, type)
    await mailer.send({ to: email, subject, text })
  }
