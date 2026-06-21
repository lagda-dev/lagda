// The single opt-in switch for local-development OTP affordances, shared by the OTP generator (the
// fixed seed-owner code) and the logging sender (cleartext OTP in stdout). It is FAIL-CLOSED: both
// affordances stay off unless `AUTH_DEV_FIXED_OTP` is explicitly "true", and enabling it in production
// is a fatal misconfiguration — a known/cleartext code defeats the email-OTP gate that protects every
// sign-in and sign-up. We refuse to start rather than silently expose either (§8 security-by-design).

const DEV_OTP_FLAG = "AUTH_DEV_FIXED_OTP"

export const isDevOtpEnabled = (env: NodeJS.ProcessEnv = process.env): boolean => {
  const enabled = env[DEV_OTP_FLAG] === "true"
  if (enabled && env.NODE_ENV === "production") {
    throw new Error(`${DEV_OTP_FLAG} must not be enabled in production: a fixed or cleartext-logged OTP defeats the email-OTP gate.`)
  }
  return enabled
}
