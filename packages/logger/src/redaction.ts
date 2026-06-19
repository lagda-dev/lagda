import type { redactOptions } from "pino"

// The placeholder pino writes in place of any redacted value. Keeping it explicit
// documents — for anyone reading a shipped log line — that the field was scrubbed on purpose.
export const REDACTION_CENSOR = "[REDACTED]"

// PII and secret paths that must never reach Loki (lagda-conventions §8: no PII in logs).
// Each entry uses pino's dot/bracket path syntax; the leading `*.` wildcard matches the key
// at any first-level object so callers don't have to know the exact shape of what they log.
//
// - req.headers.authorization      bearer tokens / basic-auth credentials on inbound requests
// - *.password                     raw passwords supplied at sign-in or member creation
// - *.token                        application/session/OTP tokens minted by the auth service
// - *.email                        personal email addresses (employee + user PII)
// - *.encrypted_credentials        directory_connections secrets (encrypted at rest, never logged)
// - *.webhook                      Slack/webhook notification URLs (stored encrypted)
export const REDACTION_PATHS = ["req.headers.authorization", "*.password", "*.token", "*.email", "*.encrypted_credentials", "*.webhook"] as const

// Pure helper: turn the static path list into pino's `redact` option object.
// Censors (rather than removes) so the log structure stays stable and the scrubbing is auditable.
export const buildRedactOptions = (paths: readonly string[] = REDACTION_PATHS): redactOptions => ({
  paths: [...paths],
  censor: REDACTION_CENSOR,
})
