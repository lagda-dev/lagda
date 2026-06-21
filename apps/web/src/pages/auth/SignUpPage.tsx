import { Button, Input, Label } from "@lagda/ui"
import { getErrorMessage } from "../../lib/getErrorMessage"
import type { FormEvent } from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { createOrganization, sendSignupOtp, setActiveOrganization, signInWithPassword, signUpWithEmail, verifyEmailOtp } from "../../auth/authClient"
import { toOrgSlug } from "../../auth/orgSlug"
import { AuthLayout } from "../../components/AuthLayout"

// Self-service sign-up: create an account that OWNS a brand-new organization. Two steps in one screen —
// (1) collect name/email/password/company and create the account (email-verification OTP is sent), then
// (2) verify the code, sign in, create the organization (the server provisions its default entity), make
// it active, and reload into the app as its owner. Errors are surfaced at every step, never swallowed.

// A short random suffix so two companies with the same name get distinct, instance-unique org slugs.
const randomSlugSuffix = (): string => Math.random().toString(36).slice(2, 8)

type SignUpStep = "details" | "verify"

export const SignUpPage = () => {
  const [step, setStep] = useState<SignUpStep>("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [otp, setOtp] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step one: create the account. Better Auth sends the email-verification OTP on sign-up, so on success
  // we move straight to the verification step.
  const createAccount = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const { error } = await signUpWithEmail({ email, password, name })
      if (error !== null) throw new Error(error.message ?? "Could not create your account.")
      setStep("verify")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step two: verify → sign in → create the org (owner) → set it active → reload into the app. A full
  // reload (not a router navigate) guarantees the next page mints a fresh JWT carrying the new org + role.
  const verifyAndProvision = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const { error: verifyError } = await verifyEmailOtp(email, otp)
      if (verifyError !== null) throw new Error(verifyError.message ?? "Invalid or expired code.")

      const { error: signInError } = await signInWithPassword(email, password)
      if (signInError !== null) throw new Error(signInError.message ?? "Could not sign you in after verification.")

      const { data: created, error: orgError } = await createOrganization({ name: organizationName, slug: toOrgSlug(organizationName, randomSlugSuffix()) })
      if (orgError !== null) throw new Error(orgError.message ?? "Could not create your organization.")
      if (created === null) throw new Error("Could not create your organization.")

      await setActiveOrganization(created.id)
      window.location.assign("/")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    setErrorMessage(null)
    try {
      const { error } = await sendSignupOtp(email)
      if (error !== null) throw new Error(error.message ?? "Could not resend the code.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleDetailsSubmit = (event: FormEvent) => {
    event.preventDefault()
    void createAccount()
  }

  const handleVerifySubmit = (event: FormEvent) => {
    event.preventDefault()
    void verifyAndProvision()
  }

  if (step === "verify") {
    return (
      <AuthLayout title="Verify your email" description={`We sent a one-time code to ${email}.`}>
        <form className="space-y-4" onSubmit={handleVerifySubmit}>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="text-center font-mono tracking-[0.5em]"
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </div>
          {errorMessage !== null && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Setting up…" : "Verify and continue"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void resendCode()}>
            Resend code
          </Button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" description="Set up a new organization — you'll be its owner.">
      <form className="space-y-4" onSubmit={handleDetailsSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization">Company name</Label>
          <Input
            id="organization"
            autoComplete="organization"
            required
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {errorMessage !== null && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
