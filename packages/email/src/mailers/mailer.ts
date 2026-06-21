// The domain port: a Mailer sends an EmailMessage. Apps depend on this interface, not on a transport,
// so the delivery mechanism (SMTP, dev logging, a future provider) stays swappable.
export type EmailMessage = {
  to: string
  subject: string
  text: string
}

export type Mailer = {
  send: (message: EmailMessage) => Promise<void>
}
