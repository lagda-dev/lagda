import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { createOrganization, sendSignupOtp, setActiveOrganization, signInWithPassword, signUpWithEmail, verifyEmailOtp } from "../../auth/authClient"
import { toOrgSlug } from "../../auth/orgSlug"

// Self-service sign-up: create an account that OWNS a brand-new organization. Two steps in one screen —
// (1) collect name/email/password/company and create the account (email-verification OTP is sent), then
// (2) verify the code, sign in, create the organization (the server provisions its default entity), make
// it active, and reload into the app as its owner. Errors are surfaced at every step, never swallowed.

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Unexpected error. Please try again.")

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

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        {step === "details" ? (
          <>
            <CardHeader>
              <CardTitle>Create your Lagda account</CardTitle>
              <CardDescription>Set up a new organization — you'll be its owner.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
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
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>We sent a one-time code to {email}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleVerifySubmit}>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input id="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} />
                </div>
                {errorMessage !== null && (
                  <p role="alert" className="text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Setting up…" : "Verify and continue"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => void resendCode()}>
                  Resend code
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  )
}
