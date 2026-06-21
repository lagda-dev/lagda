---
"@lagda/auth": minor
"@lagda/web": minor
---

Add self-service sign-up and a dev-only fixed OTP. A "Create an account" flow on the login screen lets
anyone register: it creates the account, verifies the email by OTP, then creates a brand-new
organization (the signer-up becomes its owner) which the auth service mirrors into the app schema with
a default entity via an organization-create hook — so a new owner lands on a usable, tenant-isolated
instance. In development, the seeded owner test account (owner@lagda.local) always gets the fixed code
`123456`, so local sign-in needs no log scraping; every other account, and all of production, gets a
cryptographically random code.
