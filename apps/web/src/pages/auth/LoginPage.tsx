import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { sendOtp, signIn } from "../../auth/authClient"

// Step one of the OTP-required sign-in: validate email/password against the auth service, then trigger
// the email-OTP step and hand off to /verify-otp. Errors are surfaced, never swallowed (§3 error rule).

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Unexpected error. Please try again.")

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void startSignIn()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in to Lagda</CardTitle>
          <CardDescription>Enter your credentials to receive a one-time code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              {isSubmitting ? "Sending code…" : "Continue"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
