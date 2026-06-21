import { Button, Input, Label } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { fetchBearerToken, sendOtp, verifyOtp } from "../../auth/authClient"
import { AuthLayout } from "../../components/AuthLayout"

// Step two of the OTP-required sign-in: exchange the emailed code for a session, then proactively mint
// the application bearer JWT so the first authenticated app-server call already has a token in hand.

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Unexpected error. Please try again.")

type VerifyOtpLocationState = {
  email?: string
}

export const VerifyOtpPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as VerifyOtpLocationState | null)?.email ?? ""
  const [otp, setOtp] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reaching this page without an email means the flow was skipped — send the user back to /login.
  if (email.length === 0) return <Navigate to="/login" replace />

  const completeSignIn = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const { error: verifyError } = await verifyOtp(email, otp)
      if (verifyError !== null) throw new Error(verifyError.message ?? "Invalid or expired code.")

      await fetchBearerToken()
      navigate("/", { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    setErrorMessage(null)
    try {
      const { error: resendError } = await sendOtp(email)
      if (resendError !== null) throw new Error(resendError.message ?? "Could not resend the code.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void completeSignIn()
  }

  return (
    <AuthLayout title="Enter your code" description={`We sent a one-time code to ${email}.`}>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          {isSubmitting ? "Verifying…" : "Verify and sign in"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => void resendCode()}>
          Resend code
        </Button>
      </form>
    </AuthLayout>
  )
}
