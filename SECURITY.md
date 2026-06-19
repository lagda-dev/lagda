# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, report privately via
[GitHub Security Advisories](https://github.com/lagda-dev/lagda/security/advisories/new) or email
**security@lagda.dev**.

We aim to acknowledge reports within 3 business days and to provide a remediation timeline after triage.
Please include steps to reproduce, affected versions, and impact.

## Supported versions

Lagda is pre-1.0. Security fixes target the latest released `0.x` minor. Once 1.0 ships, this section
will list the supported version window.

## Handling of credentials & mailbox access

Lagda is self-hostable specifically so that directory data and OAuth tokens **never leave the
operator's tenant**. Operators supply their **own** Google/Microsoft OAuth application.

- **Least privilege:** the Google integration requests only `admin.directory.user.readonly` (directory read) and `gmail.settings.basic` / `sendAs` (signature write). No broader scopes are requested.
- **Encryption at rest:** OAuth tokens, application tokens, and Slack webhook URLs are encrypted (AES-GCM, key from env). `directory_connections.encrypted_credentials` and `notification_channels` are never stored in plaintext.
- **Secrets** live only in environment variables and are never committed; CI runs secret scanning (gitleaks).
- **Transport:** terminate TLS in front of the services (documented for self-host); `secureHeaders` and CSRF protection are enabled.
- **Auditability:** directory reads and signature writes are recorded in an append-only `audit_log`.

A threat model lives at `docs/THREAT-MODEL.md`.
