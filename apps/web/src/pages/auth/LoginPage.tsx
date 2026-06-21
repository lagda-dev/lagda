import { Button, Input, Label } from "@lagda/ui"
import { getErrorMessage } from "../../lib/getErrorMessage"
import type { FormEvent } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { sendOtp, signIn } from "../../auth/authClient"
import { AuthLayout } from "../../components/AuthLayout"

// Step one of the OTP-required sign-in: validate email/password against the auth service, then trigger
// the email-OTP step and hand off to /verify-otp. Errors are surfaced, never swallowed (§3 error rule).

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startSignIn = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const { error: passwordError } = await signIn.email({ email, password })
      if (passwordError !== null) throw new Error(passwordError.message ?? "Invalid email or password.")

      const { error: otpError } = await sendOtp(email)
      if (otpError !== null) throw new Error(otpError.message ?? "Could not send the verification code.")

      navigate("/verify-otp", { state: { email } })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Passwordless path: skip the password and have the auth service email a one-time sign-in code straight
  // away. Requires the email field first so we know where to send it.
  const startPasswordlessSignIn = async () => {
    if (email.length === 0) {
      setErrorMessage("Enter your email first, then we'll send you a code.")
      return
    }
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const { error: otpError } = await sendOtp(email)
      if (otpError !== null) throw new Error(otpError.message ?? "Could not send the verification code.")
      navigate("/verify-otp", { state: { email } })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void startSignIn()
  }

  return (
    <AuthLayout title="Sign in" description="Use your work email to access the console.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/signup" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
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
          {isSubmitting ? "Sending code…" : "Sign in"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs text-faint">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full" disabled={isSubmitting} onClick={() => void startPasswordlessSignIn()}>
        Email me a sign-in code
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
