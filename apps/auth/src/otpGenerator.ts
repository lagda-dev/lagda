import { randomInt } from "node:crypto"

// Better Auth lets us supply the OTP value via emailOTP's `generateOTP`. We use it for ONE dev-only
// affordance: the seeded test account gets a fixed, well-known code so local sign-in needs no log
// scraping. Everyone else — and everyone in production — gets a cryptographically random 6-digit code.

const OTP_DIGITS = 6
const OTP_UPPER_BOUND = 10 ** OTP_DIGITS
const FIXED_DEV_OTP = "123456"
const DEFAULT_SEED_OWNER_EMAIL = "owner@lagda.local"

export type OtpRequest = {
  email: string
  type: "sign-in" | "email-verification" | "forget-password"
}

// A cryptographically random, zero-padded 6-digit code (e.g. "004271").
const randomSixDigitOtp = (): string => String(randomInt(0, OTP_UPPER_BOUND)).padStart(OTP_DIGITS, "0")

// Build the OTP generator, reading its dev affordance from the environment so it is testable. The fixed
// code is returned ONLY when (a) not production AND (b) the requester is the seeded owner test account.
// Any other account, or production, always gets a random code.
export const createOtpGenerator = (env: NodeJS.ProcessEnv = process.env): ((request: OtpRequest) => string) => {
  const isProduction = env.NODE_ENV === "production"
  const seedOwnerEmail = env.SEED_OWNER_EMAIL ?? DEFAULT_SEED_OWNER_EMAIL

  return ({ email }: OtpRequest): string => {
    if (!isProduction && email === seedOwnerEmail) return FIXED_DEV_OTP
    return randomSixDigitOtp()
  }
}
